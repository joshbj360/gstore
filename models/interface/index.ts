import type { 
    Products, Orders, ProductVariant,
    CartItem, Media, OrderItem, Addresses, Like,
    Share, SocialMediaInfo, Tag, Category, Measurement,
    ZoneRate, ShippingZone, VerificationDocument, Review, 
    SellerProfile,
    Profile
} from '@prisma/client';

export interface IProduct extends Products {}
export interface IOrders extends Orders {}
export interface IProductVariant extends ProductVariant {}
export interface ICartItem extends CartItem {}
export interface IMedia extends Media {}
export interface IOrderItem extends OrderItem {}
export interface IAddress extends Addresses {}
export interface ILike extends Like {}  
export interface IShare extends Share {}
export interface IReview extends Review {}
export interface IVerificationDocument extends VerificationDocument {}
export interface ISocialMediaInfo extends SocialMediaInfo {}
export interface INotification extends Notification {}
export interface ITag extends Tag {}
export interface ICategory extends Category {}
export interface IMeasurement extends Measurement {}
export interface IZoneRate extends ZoneRate {}
export interface IShippingZone extends ShippingZone {}
export interface ISellerProfile extends SellerProfile  {}
export interface IProfile extends Profile  {} 


export enum EMediaType {

}

