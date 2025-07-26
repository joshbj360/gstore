import type { ProductInterface } from "./product.interface";

export interface TagInterface {
    id?: number;
    name: string;
    products?: ProductInterface[];
    createdAt?: Date;   // Optional property
    updatedAt?: Date;   // Optional property
}

export const defaultTag: TagInterface = {
    name: ''
}