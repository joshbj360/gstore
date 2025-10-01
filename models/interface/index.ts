// models/interface/products/product.interface.ts
import type { 
  Products, Orders, ProductVariant, CartItem, Media, OrderItem, Addresses, Like,
  Share, SocialMediaInfo, Tag, Category, Measurement, ZoneRate, ShippingZone,
  VerificationDocument, Review, SellerProfile, Profile, Notification
} from '@prisma/client';

export enum EMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
}

export enum EProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum EOrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export enum EVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum ENotificationType {
  ORDER = 'ORDER',
  REVIEW = 'REVIEW',
  PRODUCT = 'PRODUCT',
  GENERAL = 'GENERAL',
}

export interface IProduct extends Products {
  category?: { category: ICategory }[];
  tags?: { tag: ITag }[];
  media?: IMedia[];
  measurement?: IMeasurement | null;
  variants?: IProductVariant[];
  likes?: ILike[];
  notifications?: INotification[];
  seller?: IProfile;
  sellerProfile?: ISellerProfile | null;
  reviews?: IReview[];
  share?: IShare[];
  socialMedia?: ISocialMediaInfo[];
  shippingZone?: IShippingZone | null;
}

export interface IOrders extends Orders {
  notifications: INotification[];
  orderItem: IOrderItem[];
}

export interface IProductVariant extends ProductVariant {
  cartItems?: ICartItem[];
  orderItems?: IOrderItem[];
}

export interface ICartItem extends CartItem {
  product: IProduct; // Added product reference
  variant: IProductVariant;
  user?: IProfile;
}
export interface IPartialCartItem {
  variantId: number;
  quantity: number;
  userId: string;
}

export interface IMedia extends Media {
  product?: IProduct | null;
  seller?: ISellerProfile;

}

export interface IOrderItem extends OrderItem {
  order: IOrders;
  variant: IProductVariant;
}

export interface IAddress extends Addresses {
  user: IProfile;
}

export interface ILike extends Like {
  product: IProduct;
  profile: IProfile;
}

export interface IShare extends Share {
  product: IProduct;
  profile: IProfile;
}

export interface IReview extends Review {
  product: IProduct;
  sellerProfile: ISellerProfile;
  user: IProfile;
  notifications: INotification[];
}

export interface IVerificationDocument extends VerificationDocument {
  sellerProfile: ISellerProfile;
}

export interface ISocialMediaInfo extends SocialMediaInfo {
  product?: IProduct | null;
  profile?: IProfile | null;
}

export interface INotification extends Notification {
  order?: IOrders | null;
  product?: IProduct | null;
  review?: IReview | null;
  profile: IProfile;
}

export interface ITag extends Tag {
  products: { product: IProduct }[];
}

export interface ICategory extends Category {
  products: { product: IProduct }[];
}

export interface IMeasurement extends Measurement {
  product?: IProduct | null;
}

export interface IZoneRate extends ZoneRate {
  zone: IShippingZone;
}

export interface IShippingZone extends ShippingZone {
  seller: ISellerProfile;
  rates: IZoneRate[];
  products: IProduct[];
}

export interface ISellerProfile extends SellerProfile {
  profile: IProfile;
  media?: IMedia[];
  reviews?: IReview[];
  verificationDocuments?: IVerificationDocument[];
  shippingZones?: IShippingZone[];
  products?: IProduct[];
}

export interface IProfile extends Profile {
  likes: ILike[];
  notifications: INotification[];
  products: IProduct[];
  reviews: IReview[];
  sellerProfile?: ISellerProfile | null;
  shares: IShare[];
  socialMedia: ISocialMediaInfo[];
  cartItems: ICartItem[];
}

export const defaultMeasurement: IMeasurement = {
  id: 0,
  productId: 0,
  weight: 0,
  length: 0,
  width: 0,
  height: 0
};

export const defaultCategory: ICategory = {
  id: 0,
  name: '',
  created_at: new Date(),
  updated_at: new Date(),
  slug: '', 
  products: [],
  thumbnailCatUrl: ''
};


export const defaultTag: ITag = {
  id: 0,
  name: '',
  products: [],
  created_at: new Date(),
  updated_at: new Date()
};

export const defaultProduct: IProduct = {
  id: 0,
  title: '',
  description: '',
  price: 0,
  discount: 0,
  slug: '',
  created_at: new Date(),
  updated_at: new Date(),
  sellerId: '',
  status: EProductStatus.DRAFT,
  media: [],
  category: [],
  tags: [],
  variants: [],
  measurement: null,
  shippingZone: null,
  store_slug: '',
  soldCount: 0,
  shippingZoneId: ''
};