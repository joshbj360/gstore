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
    tags?: TagInterface[];
    media: MediaInterface[];
    variants: ProductVariantInterface[]
    slug: string
    discount?: number ;
    created_at?: Date | null
    updated_at?: Date | null;
    sellerId?: string | undefined
    store_name: string
    socialMedia?: SocialMediaInterface
    rating?: number;
  reviewCount?: number;
  likeCount?: number;
 soldCount?: number;
 shippingZoneId?: string
}

export interface ProductVariantInterface {
    id?: number
    size: string
    stock: number
    price?: number

    productID?: number
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
    variants: [
        {
            id: 0,
            size: '',
            stock: 0,
            price: 0,
            productID: 0
        }
    ],
    price: 0,
    slug: '',
    measurement: defaultMeasurement,
    tags: [],
    media: [],
    store_name: "GrandeurStore"
}