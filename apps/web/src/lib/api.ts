import type {
  AreaDto,
  CategoryDto,
  CityDto,
  CreateOrderInput,
  OrderCreatedDto,
  OrderTrackDto,
  ProductCardDto,
  ProductDetailDto,
  PublicSettingsDto,
} from '@preppal/shared';
import { queryOptions } from '@tanstack/react-query';

export const CITY = 'sahiwal'; // Multi-city later: read from a city picker / cookie.

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = (body as { error?: { code: string; message: string; details?: unknown } }).error;
    throw new ApiError(res.status, e?.code ?? 'http_error', e?.message ?? 'Request failed', e?.details);
  }
  return body as T;
}

export const api = {
  settings: () => request<PublicSettingsDto>('/settings'),
  categories: () => request<CategoryDto[]>('/categories'),
  products: (category?: string) =>
    request<ProductCardDto[]>(`/products?city=${CITY}${category ? `&category=${category}` : ''}`),
  product: (slug: string) => request<ProductDetailDto>(`/products/${slug}?city=${CITY}`),
  areas: () => request<{ city: CityDto; areas: AreaDto[] }>(`/cities/${CITY}/areas`),
  createOrder: (input: CreateOrderInput) =>
    request<OrderCreatedDto>('/orders', { method: 'POST', body: JSON.stringify(input) }),
  track: (number: string, phone: string) =>
    request<OrderTrackDto>(
      `/orders/track?number=${encodeURIComponent(number)}&phone=${encodeURIComponent(phone)}`,
    ),
  notify: (phone: string, topic: string) =>
    request<{ ok: true }>('/notify', { method: 'POST', body: JSON.stringify({ phone, topic }) }),
};

export const q = {
  settings: () => queryOptions({ queryKey: ['settings'], queryFn: api.settings, staleTime: 60_000 }),
  categories: () =>
    queryOptions({ queryKey: ['categories'], queryFn: api.categories, staleTime: 5 * 60_000 }),
  products: () =>
    queryOptions({ queryKey: ['products', CITY], queryFn: () => api.products(), staleTime: 60_000 }),
  product: (slug: string) => queryOptions({ queryKey: ['product', slug], queryFn: () => api.product(slug) }),
  areas: () => queryOptions({ queryKey: ['areas', CITY], queryFn: api.areas, staleTime: 5 * 60_000 }),
};
