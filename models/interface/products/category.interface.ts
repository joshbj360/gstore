import type { ProductInterface } from "./product.interface";

export interface CategoryInterface {
    id?: number;
    name: string;
    slug: string;
    thumbnailCatUrl?: string;   // Optional property
    description?: string;   // Optional property
    products?: ProductInterface[];
    createdAt?: Date;   // Optional property
    updatedAt?: Date;   // Optional property
}

// }
export const defaultCategory: CategoryInterface = {
    name: '',
    slug: '',
    thumbnailCatUrl: '',
}