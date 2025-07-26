import { type ProductInterface } from "../../interface/products/product.interface";

export interface CartInterface {
    id: number;
    product: ProductInterface;
    quantity: number;
    selectedSizes?: string[];
    selectedColors?: string[];
    selectedMaterials?: string[];
}