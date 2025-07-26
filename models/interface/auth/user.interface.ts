import type { ProductInterface } from "../products/product.interface";

export interface UserInterface {
  id?: string
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
  profile_id?: string
  store_name: string | undefined
  store_description: string;
  store_logo?: string;
  store_banner?: string;
  store_location?: string;
  store_phone?: string;
  store_website?: string;
  store_socials?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string
  };
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
    profile_id: '1',
    store_name: 'Grandeur Store',
    store_description: 'Grandeur luxury store. We make you look GRAND!',
    store_logo: '',
    store_banner: '',
    store_location: '',
    store_phone: '',
    store_website: '',
    store_socials: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: ''
    },
    products: [],
    ratings: {
        average: 0,
        count: 0
    },
    reviews: [],
    is_verified: false,
    verification_status: 'PENDING',
    verification_reason: '',
    verification_documents: []
    };