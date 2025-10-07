import { serverSupabaseClient } from '#supabase/server';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
    const productId:number = parseInt(event.context.params!.id, 10);

    if (isNaN(productId)) {
        throw createError({ statusCode: 400, message: 'Invalid Product ID.' });
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
        .channel(`product-comments-${productId}`)
        .on('postgres_changes', {
            event: '*', // Listen for INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'Comment',
            filter: `productId=eq.${productId}`
        }, (payload) => {
            // When a change is detected, send an event down to the client
            console.log(`Change detected on product ${productId}, sending update event.`);
            sendEvent({ type: 'UPDATE', payload });
        })
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log(`Successfully subscribed to real-time updates for product ${productId}`);
            }
            if (err) {
                console.error(`Error subscribing to channel for product ${productId}:`, err);
            }
        });

    // Clean up the subscription when the client disconnects
    event.node.res.on('close', () => {
        if (channel) {
            supabase.removeChannel(channel);
            console.log(`Unsubscribed from real-time updates for product ${productId}`);
        }
    });
    
    // Set the headers to establish the SSE connection
    setHeader(event, 'Content-Type', 'text/event-stream');
    setHeader(event, 'Cache-Control', 'no-cache');
    setHeader(event, 'Connection', 'keep-alive');
    
    return eventStream.readable;
});
