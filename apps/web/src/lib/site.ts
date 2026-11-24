/** Static marketing content for the storefront. Product data comes from the API. */
export const HERO_SLIDES = [
  {
    image: '/images/products/ginger-garlic-paste.jpg',
    alt: 'Preppal ginger-garlic paste tub',
    caption: 'Ginger-Garlic Paste — ground fresh every morning',
  },
  {
    image: '/images/site/karahi.jpg',
    alt: 'Chicken karahi cooking',
    caption: 'Your karahi, minus the prep work',
  },
  {
    image: '/images/products/peeled-garlic.jpg',
    alt: 'Preppal peeled and chopped garlic packs',
    caption: 'Peeled & chopped garlic, ready for the pan',
  },
  {
    image: '/images/products/marinated-fish.jpg',
    alt: 'Preppal marinated fish',
    caption: 'Marinated fish — spiced and ready to fry',
  },
] as const;

export const TRUST_POINTS = [
  { title: 'Prepared fresh daily', body: 'Made the morning of delivery' },
  { title: 'Hygienically packed', body: 'Sealed, labelled packs' },
  { title: 'Next-day delivery', body: 'Order by 11 PM, get it by 5 PM' },
  { title: 'Cash on delivery', body: 'Pay when it arrives' },
] as const;

export const STEPS = [
  {
    title: 'Pick your prep',
    body: 'Pastes, peeled garlic, masala bases, marinated fish or a meal pack of your choice.',
    image: '/images/site/mortar.jpg',
  },
  {
    title: 'Order by 11 PM',
    body: 'We take orders a night ahead so everything is prepared fresh in the morning.',
    image: '/images/site/chopping.jpg',
  },
  {
    title: 'Get it by 5 PM',
    body: 'Delivered to your door across Sahiwal. Pay the rider in cash.',
    image: '/images/site/karahi.jpg',
  },
] as const;

export const INSTAGRAM_TILES = [
  '/images/products/ginger-garlic-paste.jpg',
  '/images/products/peeled-garlic.jpg',
  '/images/products/marinated-fish.jpg',
  '/images/products/cheesy-chicken-cones.jpg',
  '/images/products/chopped-methi.jpg',
] as const;

export const BADGE_STYLE: Record<string, string> = {
  Bestseller: 'bg-forest text-white',
  'Eid special': 'bg-terra text-white',
  Ramazan: 'bg-terra text-white',
  Limited: 'bg-terra text-white',
};
export const badgeClass = (badge: string) => BADGE_STYLE[badge] ?? 'bg-white text-forest';

/** Hours 0–23 → "11 PM" (cutoff copy comes from admin settings). */
export const formatHour = (h: number) => {
  if (h === 0) return '12 midnight';
  if (h === 12) return '12 noon';
  return `${h % 12} ${h < 12 ? 'AM' : 'PM'}`;
};

/** "923285228505" → "0328 5228505" */
export const formatWhatsapp = (n: string) => n.replace(/^92/, '0').replace(/^(\d{4})(\d+)$/, '$1 $2');
