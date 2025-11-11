import { serverSupabaseClient } from '#supabase/server';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { z } from 'zod';

export default defineEventHandler(async (event) => {
    const postId: string = event.context.params!.id;

    // Validate that the ID is a UUID (which Post IDs are)
    const validation = z.string().uuid().safeParse(postId);
    if (!validation.success) {
        throw createError({ statusCode: 400, message: 'Invalid Post ID.' });
    }

    // This is a special handler for Server-Sent Events
    const eventStream = new TransformStream();
    const writer = eventStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Get the server-side Supabase client
    const supabase = await serverSupabaseClient(event);
    let channel: RealtimeChannel;

    const sendEvent = (data: object) => {
        writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Subscribe to database changes on the server
    channel = supabase
        .channel(`post-comments-${postId}`)
        .on('postgres_changes', {
            event: '*', // Listen for INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'Comment',
            // --- THE FIX: This now filters by postId ---
            filter: `postId=eq.${postId}`
        }, (payload) => {
            // When a change is detected, send an event down to the client
            console.log(`Change detected on post ${postId}, sending update event.`);
            sendEvent({ type: 'UPDATE', payload });
        })
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log(`Successfully subscribed to real-time updates for post ${postId}`);
            }
            if (err) {
                console.error(`Error subscribing to channel for post ${postId}:`, err);
            }
        });

    // Clean up the subscription when the client disconnects
    event.node.res.on('close', () => {
        if (channel) {
            supabase.removeChannel(channel);
            console.log(`Unsubscribed from real-time updates for post ${postId}`);
        }
    });
    
    // Set the headers to establish the SSE connection
    setHeader(event, 'Content-Type', 'text/event-stream');
    setHeader(event, 'Cache-Control', 'no-cache');
    setHeader(event, 'Connection', 'keep-alive');
    
    return eventStream.readable;
});