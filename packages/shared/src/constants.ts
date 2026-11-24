/** Business timezone. All cutoff and delivery-date maths happen in this zone. */
export const BUSINESS_TZ = 'Asia/Karachi';

/** Fallback values; the live values come from the `settings` table. */
export const DEFAULT_SETTINGS = {
  /** Hour (0–23, business TZ) after which tonight's orders roll to the day after tomorrow. */
  cutoffHour: 23,
  /** Latest delivery time shown to customers. */
  deliveryByLabel: '5 PM',
  /** How many delivery days ahead a customer may choose, counted from the earliest day. */
  maxDaysAhead: 2,
  /** Minimum basket subtotal in PKR (0 = none). */
  minOrderPkr: 0,
  whatsappNumber: '923285228505',
  instagramHandle: 'preppal.swl',
  /** Optional line shown in the storefront's top bar (empty = the default cutoff message). */
  announcement: '',
  /** Temporarily stop new orders (holidays, stock-outs). Checkout shows `pauseMessage`. */
  ordersPaused: false,
  pauseMessage: "We're taking a short break. Ordering opens again soon — message us on WhatsApp.",
} as const;

export const ROLES = ['owner', 'staff', 'rider'] as const;
export type Role = (typeof ROLES)[number];

export const PRODUCT_BADGES = [
  'Bestseller',
  'New',
  'Seasonal',
  'Limited',
  'Eid special',
  'Ramazan',
  'Ready to fry',
  'Winter special',
] as const;

/** Pakistani mobile: 03XXXXXXXXX (11 digits). Normalised form stored in DB. */
export const PK_PHONE_REGEX = /^03\d{9}$/;
