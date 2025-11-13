import { defineEventHandler, readBody, createError } from 'h3';
import { serverSupabaseUser } from '#supabase/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Zod schema to validate the incoming post data
const postSchema = z.object({
  platform: z.enum(['facebook', 'twitter']), // 'facebook' handles Instagram
  caption: z.string(),
  mediaUrl: z.string().url(),
  productUrl: z.string().url(),
});

/**
 * This is a highly secure server-only function.
 * It uses the Admin client to retrieve a user's secret provider token.
 */
async function getProviderToken(userId: string, provider: 'facebook' | 'twitter') {
  // These ENVs are automatically available in the server context
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (userError || !userData.user) {
    throw new Error('User not found in admin context.');
  }
  
  // Find the specific social media identity
  const identity = userData.user.identities?.find(i => i.provider === provider);
  const providerToken = identity?.provider_token; // This is the user's Access Token

  if (!providerToken) {
    throw new Error(`You have not connected ${provider}, or your token is invalid. Please reconnect.`);
  }
  return providerToken;
}

/**
 * This is the main API handler for posting to all social platforms.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  // 1. Validate the incoming data from the modal
  const validation = await readValidatedBody(event, body => postSchema.safeParse(body));
  if (!validation.success) {
    throw createError({ statusCode: 400, message: validation.error.issues.map(i => i.message).join(', ') });
  }
  
  const { platform, caption, mediaUrl, productUrl } = validation.data;
  const fullCaption = `${caption}\n\nShop the look: ${productUrl}`;

  try {
    // 2. Securely get the user's secret access token from Supabase
    const accessToken = await getProviderToken(user.id, platform);

    // 3. Switch on the platform to call the correct external API
    switch (platform) {
      
      // --- Case 1: Post to Instagram (via Facebook Graph API) ---
      case 'facebook':
        // This is a complex multi-step process
        
        // 1. Get the user's Facebook Pages
        const pages: any = await $fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
        
        // 2. Find the *first* page that has an Instagram account linked
        let igAccountId = null;
        let pageAccessToken = null;
        for (const page of pages.data) {
          const igData: any = await $fetch(`https://graph.facebook.com/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
          if (igData.instagram_business_account) {
            igAccountId = igData.instagram_business_account.id;
            pageAccessToken = page.access_token; // Use this page's token
            break;
          }
        }

        if (!igAccountId || !pageAccessToken) {
          throw new Error('No Instagram Business Account is linked to your Facebook Page. Please check your Meta Business Suite settings.');
        }

        // 3. Create a media container on Instagram's servers 
        const mediaContainer: any = await $fetch(`https://graph.facebook.com/${igAccountId}/media`, {
            method: 'POST',
            body: {
                image_url: mediaUrl,
                caption: fullCaption,
                access_token: pageAccessToken
            }
        });
        
        // 4. Publish the media container to the feed
        // This can take a few seconds, so we check its status
        let publishStatus = 'IN_PROGRESS';
        let publishResponse: any;
        for (let i = 0; i < 5; i++) { // Try for ~10 seconds
            const statusCheck: any = await $fetch(`https://graph.facebook.com/${mediaContainer.id}?fields=status_code&access_token=${pageAccessToken}`);
            if (statusCheck.status_code === 'FINISHED') {
                // It's ready! Now publish it.
                publishResponse = await $fetch(`https://graph.facebook.com/${igAccountId}/media_publish`, {
                    method: 'POST',
                    body: {
                        creation_id: mediaContainer.id,
                        access_token: pageAccessToken
                    }
                });
                publishStatus = 'FINISHED';
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
        }

        if (publishStatus !== 'FINISHED' || !publishResponse) {
            throw new Error('Instagram media processing timed out.');
        }

        return { success: true, platform: 'instagram', postId: publishResponse.id };

      // --- Case 2: Post to Twitter (X) ---
      case 'twitter':
        // The Twitter API v2 is much simpler
        const response = await $fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
                // The provider_token from Supabase *is* the Bearer token
                'Authorization': `Bearer ${accessToken}`, 
                'Content-Type': 'application/json'
            },
            body: {
                text: fullCaption
            }
        });
        return { success: true, platform: 'twitter', postId: response.data.id };
        
      default:
        throw createError({ statusCode: 400, message: 'Platform not supported.' });
    }

  } catch (error: any) {
    // This will catch errors from any of the $fetch calls or token logic
    console.error(`Failed to post to ${platform}:`, error.data || error.message);
    throw createError({ statusCode: 502, message: `Failed to post to ${platform}: ${error.data?.error?.message || error.message}` });
  }
});