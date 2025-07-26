import type { ProductInterface } from "./product.interface";

export interface CategoryInterface {
    id?: number;
    name: string;
    thumbnailCatUrl?: string;   // Optional property
    description?: string;   // Optional property
    products?: ProductInterface[];
    createdAt?: Date;   // Optional property
    updatedAt?: Date;   // Optional property
}


// export interface ProductCategoryInterface {
//     productId: number
//     categoryId: number
//     product?: ProductInterface
//     category?: CategoryInterface
// }
export const defaultCategory: CategoryInterface = {
    name: '',
    thumbnailCatUrl: '',
}