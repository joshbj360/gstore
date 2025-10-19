import { v2 as cloudinary } from 'cloudinary';

const config = useRuntimeConfig();

// Configure Cloudinary with your secret credentials on the server
cloudinary.config({ 
  cloud_name: config.public.cloudinary.cloudName as string, 
  api_key: config.public.cloudinary.apiKey as string, 
  api_secret: config.private.cloudinary.apiSecret as string,
  secure: true
});

export default defineEventHandler(async (event) => {
    // Generate a secure signature for the upload request
    const timestamp = Math.round((new Date).getTime()/1000);
    const signature = cloudinary.utils.api_sign_request({
        timestamp: timestamp,
    }, config.private.cloudinary.apiSecret!);

    return {
        signature,
        timestamp
    };
});
