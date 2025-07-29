import type { SocialMediaInterface } from "../socialMedia/socialMedia.interface";
import  { type CategoryInterface, defaultCategory, } from "./category.interface";
import { defaultMeasurement, type MeasurementInterface} from "./measurement.interface";
import type { MediaInterface } from "./media.interface";
import type { TagInterface } from "./tag.interface";  

export interface ProductInterface {
    readonly id: number;
    title: string;
    description?: string 
    price: number;
    category?: CategoryInterface
    measurement?: MeasurementInterface
    sizes?: string[] 
    tags?: TagInterface[];
    media: MediaInterface[];
    stock: number | 0
    slug: string
    discount?: number ;
    created_at?: Date | null
    updated_at?: Date | null;
    sellerId?: string | undefined
    store_name: string
    socialMedia?: SocialMediaInterface
      rating?: number;
  reviewCount?: number;
}

export interface ProductFileInterface {
    name: string
    format: string
    file: File
}

export const defaultProduct: ProductInterface = {
    id: 0,
    title: '',
    description: '',
    stock: 0,
    price: 0,
    slug: '',
    measurement: defaultMeasurement,
    sizes: [],
    tags: [],
    media: [],
    store_name: "GrandeurStore"
}