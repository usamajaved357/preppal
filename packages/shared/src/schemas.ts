import { z } from 'zod';
import { PK_PHONE_REGEX, PRODUCT_BADGES, ROLES } from './constants';
import { ORDER_STATUSES } from './order-status';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const slug = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only');
const pkr = z.number().int().min(0).max(1_000_000);

/** Accepts 03xx-xxxxxxx, +923xx…, 923xx… and normalises to 03XXXXXXXXX. */
export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, '').replace(/^\+?92/, '0'))
  .refine((v) => PK_PHONE_REGEX.test(v), 'Enter a valid mobile number, e.g. 03001234567');

// ───────────── Storefront ─────────────

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: phoneSchema,
  }),
  address: z.object({
    cityId: z.string().min(1),
    areaId: z.string().min(1),
    line1: z.string().trim().min(3).max(200),
    landmark: z.string().trim().max(120).optional().default(''),
  }),
  deliveryDate: isoDate,
  notes: z.string().trim().max(300).optional().default(''),
  items: z
    .array(z.object({ variantId: z.string().min(1), qty: z.number().int().min(1).max(50) }))
    .min(1)
    .max(30),
});
export type CreateOrderInput = z.input<typeof createOrderSchema>;

export const trackOrderSchema = z.object({
  number: z.string().trim().min(3).max(20),
  phone: phoneSchema,
});

// ───────────── Admin ─────────────

/** DELETE /admin/categories/:id?moveTo= — products in the category move to `moveTo` first. */
export const categoryDeleteQuerySchema = z.object({ moveTo: z.string().min(1).optional() });

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug,
  description: z.string().max(200).optional().default(''),
  imageKey: z.string().max(300).optional().default(''),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug,
  categoryId: z.string().min(1),
  shortDescription: z.string().max(160).default(''),
  description: z.string().max(4000).default(''),
  howToUse: z.string().max(2000).default(''),
  ingredients: z.string().max(1000).default(''),
  storage: z.string().max(500).default(''),
  badge: z.enum(PRODUCT_BADGES).nullable().default(null),
  imageKeys: z.array(z.string().max(300)).max(8).default([]),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  sortOrder: z.number().int().default(0),
});

export const variantInputSchema = z.object({
  label: z.string().trim().min(1).max(40),
  sku: z.string().trim().min(2).max(40),
  pricePkr: pkr,
  unitNote: z.string().max(40).default(''),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const inventoryInputSchema = z.object({
  isAvailable: z.boolean(),
  /** null = made to order (no stock tracking). */
  stockQty: z.number().int().min(0).nullable(),
  /** null = no daily cap. Caps qty sold per delivery date. */
  dailyLimit: z.number().int().min(1).nullable(),
  /** null = use variant price. */
  priceOverridePkr: pkr.nullable(),
});

export const areaInputSchema = z.object({
  cityId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  deliveryFeePkr: pkr,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const cityInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug,
  isActive: z.boolean().default(false),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(300).optional().default(''),
});

export const settingsSchema = z.object({
  cutoffHour: z.number().int().min(0).max(23),
  deliveryByLabel: z.string().min(1).max(20),
  maxDaysAhead: z.number().int().min(1).max(7),
  minOrderPkr: pkr,
  whatsappNumber: z.string().regex(/^92\d{10}$/, 'Use 92XXXXXXXXXX'),
  instagramHandle: z.string().max(40),
  alertEmails: z.array(z.string().email()).max(10).default([]),
  announcement: z.string().trim().max(160).default(''),
  ordersPaused: z.boolean().default(false),
  pauseMessage: z.string().trim().max(200).default(''),
});
export type Settings = z.infer<typeof settingsSchema>;

export const adminUserInputSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().trim().min(2).max(60),
  role: z.enum(ROLES),
  isActive: z.boolean().default(true),
});

export const riderInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: phoneSchema,
  isActive: z.boolean().default(true),
});
