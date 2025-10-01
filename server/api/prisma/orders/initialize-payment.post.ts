import { serverSupabaseUser } from '#supabase/server';

// Get the secret key securely from Nuxt's runtime config.
const config = useRuntimeConfig();
const paystackSecret = config.paystackSecretKey;

if (!paystackSecret || !paystackSecret.startsWith('sk_')) {
    console.error("FATAL ERROR: Paystack secret key is missing or invalid in your .env file.");
}

export default defineEventHandler(async (event) => {
  if (!paystackSecret) {
      throw createError({ statusCode: 500, message: 'Server is not configured for payments.' });
  }

  const user = await serverSupabaseUser(event);
  if (!user || !user.email) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const { amount } = await readBody(event);
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw createError({ statusCode: 400, message: 'A valid amount is required.' });
  }

  try {
    // THE DEFINITIVE FIX: We are bypassing the SDK and using Nuxt's $fetch directly.
    // This gives us complete control over the request and error handling.
    const response = await $fetch<{ status: boolean, message: string, data: { authorization_url: string, reference: string } }>('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
            // Manually and explicitly set the Authorization header.
            'Authorization': `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json',
        },
        body: {
            email: user.email,
            amount: amount, // For direct $fetch, amount can be a number
            currency: 'NGN',
        }
    });

    if (!response.status || !response.data) {
        throw new Error(response.message || 'Paystack API did not return a valid response.');
    }
    
    return {
      authorization_url: response.data.authorization_url,
      reference: response.data.reference,
    };

  } catch (error: any) {
    console.error("Paystack API Error:", error);
    
    // This provides much clearer error messages directly from the API response
    const errorMessage = error.data?.message || error.message || 'Could not initialize payment.';
    throw createError({ 
        statusCode: error.statusCode || 500, 
        statusMessage: "Payment Initialization Failed",
        message: errorMessage
    });
  }
});

