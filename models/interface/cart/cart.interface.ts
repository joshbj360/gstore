import { type ProductInterface, type ProductVariantInterface } from "../../interface/products/product.interface";

export interface CartItemInterface {
    id: string;
    product: ProductInterface;

    variant: ProductVariantInterface;
    quantity: number;
}