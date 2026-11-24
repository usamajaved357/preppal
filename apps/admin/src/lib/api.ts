/** Thin fetch wrapper for /api/admin/*. Errors carry the API's { error: { code, message } }. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    ...init,
    headers: isForm ? init?.headers : { 'content-type': 'application/json', ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = (body as { error?: { code: string; message: string } }).error;
    throw new ApiError(res.status, e?.code ?? 'http_error', e?.message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export const get = <T>(p: string) => http<T>(p);
export const send = <T = { ok: true }>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  p: string,
  body?: unknown,
) => http<T>(p, { method, body: body instanceof FormData ? body : JSON.stringify(body ?? {}) });

// Row shapes from the admin API (mirror packages/db schema).
export interface AdminOrder {
  id: string;
  number: string;
  customerName: string;
  customerPhone: string;
  areaName: string;
  addressLine1: string;
  landmark: string;
  notes: string;
  deliveryDate: string;
  status: import('@preppal/shared').OrderStatus;
  subtotalPkr: number;
  deliveryFeePkr: number;
  totalPkr: number;
  codCollected: boolean;
  riderId: string | null;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    variantLabel: string;
    qty: number;
    unitPricePkr: number;
    lineTotalPkr: number;
  }[];
}

export interface AdminOrderDetail extends AdminOrder {
  history: { id: string; status: string; note: string; byEmail: string | null; createdAt: string }[];
}

export interface AdminRider {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  orderCount?: number;
}

export interface AdminVariant {
  id: string;
  productId: string;
  label: string;
  sku: string;
  pricePkr: number;
  unitNote: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminProduct {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  howToUse: string;
  ingredients: string;
  storage: string;
  badge: string | null;
  imageKeys: string[];
  imageUrls: (string | null)[];
  status: 'draft' | 'active' | 'archived';
  sortOrder: number;
  variants: AdminVariant[];
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageKey: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface AdminCity {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  areaCount: number;
}

/** Body accepted by POST/PUT /admin/products (mirrors productInputSchema). */
export const productBody = (p: AdminProduct) => ({
  name: p.name,
  slug: p.slug,
  categoryId: p.categoryId,
  shortDescription: p.shortDescription,
  description: p.description,
  howToUse: p.howToUse,
  ingredients: p.ingredients,
  storage: p.storage,
  badge: p.badge,
  imageKeys: p.imageKeys,
  status: p.status,
  sortOrder: p.sortOrder,
});
