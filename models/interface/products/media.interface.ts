export interface MediaInterface {
    id?: string; // Primary Key
    productId?: string; // Foreign Key
    url: string; // Array of URLs
    thumbnailUrl?: string; // Thumbnail URL
    type: MediaType // Type of media
    format: string; // Format of media
    altText?: string; // Alt text for media
    caption?: string; // Caption for media
    createdAt?: Date; // Optional property
    updatedAt?: Date; // Optional property
    focalPoint?: {
        x: number,
        y: number
    },
    size?: number
}


export enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO'     // Audio type
}

export const AllowedExtensions = {
    IMAGE: ['jpg', 'jpeg', 'png', 'gif'],
    VIDEO: ['mp4', 'webm', 'ogg'],
    AUDIO: ['mp3', 'wav', 'ogg']
};