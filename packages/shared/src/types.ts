import type { Pkr } from './money';
import type { OrderStatus } from './order-status';

/** Shapes returned by the public API. The API maps DB rows to these; frontends rely on them only. */

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
}

export interface VariantDto {
  id: string;
  label: string;
  unitNote: string;
  pricePkr: Pkr;
  available: boolean;
}

export interface ProductCardDto {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  badge: string | null;
  imageUrl: string | null;
  categorySlug: string;
  fromPricePkr: Pkr | null;
  variants: VariantDto[];
}

export interface ProductDetailDto extends ProductCardDto {
  description: string;
  howToUse: string;
  ingredients: string;
  storage: string;
  imageUrls: string[];
}

export interface CityDto {
  id: string;
  name: string;
  slug: string;
}

export interface AreaDto {
  id: string;
  name: string;
  deliveryFeePkr: Pkr;
}

export interface PublicSettingsDto {
  cutoffHour: number;
  deliveryByLabel: string;
  minOrderPkr: Pkr;
  whatsappNumber: string;
  instagramHandle: string;
  deliveryDates: string[];
  msUntilCutoff: number;
}

export interface OrderCreatedDto {
  orderNumber: string;
  totalPkr: Pkr;
  deliveryDate: string;
  whatsappUrl: string;
}

export interface OrderTrackDto {
  orderNumber: string;
  status: OrderStatus;
  deliveryDate: string;
  totalPkr: Pkr;
  items: { name: string; variantLabel: string; qty: number; lineTotalPkr: Pkr }[];
  history: { status: OrderStatus; at: string }[];
}
