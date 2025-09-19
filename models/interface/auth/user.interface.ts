import type { ProductInterface } from "../products/product.interface";
import type { MediaInterface } from '../products/media.interface';

export interface UserInterface {
  readonly id: string
  displayName?: string
  email: string | undefined
  phone?: string | undefined
  provider?: string
  providerType?: string
  createdAt?: string
  lastSignIn?: string
}
export interface UserProfileInterface {
  id: string;
  email: string;
  role: string;
  username?: string;
  avatar?: string;
  provider?:string
  created_at?: string;
  updated_at?: string;
}

export interface SellerStoreInterface {
  profileId: string
  store_name: string | undefined
  store_description: string;
  store_logo?: string;
  store_banner?: string;
  store_location?: string;
  store_phone?: string;
  store_website?: string;
  media?: MediaInterface[];
  store_socials?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string
  };
  created_at?: string;
  products?: ProductInterface[];
  ratings?: {
    average: number;
    count: number;
  };
  reviews?: {
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
  }[];
  followers_count?: number;
  is_verified?: boolean;
  verification_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  verification_reason?: string;
  verification_documents?: {
    id: string;
    type: string;
    url: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
    updated_at: string;
  }[];
}

export const defaultSellerProfile: SellerStoreInterface = {
    profileId: '0',
    store_name: 'Store name',
    store_description: 'Store description',
    store_logo: '',
    store_banner: '',
    store_location: 'Store location',
    store_phone: '0800000000',
    store_website: 'Store website',
    store_socials: {
        facebook: '@facebook',
        twitter: '@twitter',
        instagram: '@instagram',
        linkedin: '@linkedin'
    },
    products: [],
    ratings: {
        average: 0,
        count: 0
    },
    reviews: [],
    followers_count: 0,
    created_at: new Date().toISOString(),
    is_verified: false,
    verification_status: 'PENDING',
    verification_reason: '',
    verification_documents: []
    };