/** Static marketing content for the storefront. Product data comes from the API. */
/**
 * Hero photos from Unsplash (free Unsplash License, no attribution required), loaded from Unsplash's CDN at the
 * size each screen needs. `tag` is the small label above the caption.
 */
const unsplash = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=78&w=${w}`;

export interface HeroSlide {
  src: string;
  srcSet: string;
  alt: string;
  tag: string;
  caption: string;
}

const slide = (id: string, alt: string, tag: string, caption: string): HeroSlide => ({
  src: unsplash(id, 1400),
  srcSet: `${unsplash(id, 800)} 800w, ${unsplash(id, 1400)} 1400w, ${unsplash(id, 2000)} 2000w`,
  alt,
  tag,
  caption,
});

export const HERO_SLIDES: HeroSlide[] = [
  slide(
    '1694579740719-0e601c5d2437',
    'Chicken karahi simmering with fresh coriander',
    'Karahi night',
    'Your karahi, minus the prep work',
  ),
  slide(
    '1555939594-58d7cb561ad1',
    'Grilled kababs and vegetables on a platter',
    'Kabab base',
    'Kababs ready for the grill in minutes',
  ),
  slide(
    '1596797038530-2c107229654b',
    'Red curry in a black pan topped with coriander',
    'Masala bases',
    'Slow-cooked taste without the slow prep',
  ),
  slide(
    '1742599361539-f096753d1100',
    'Creamy chicken curry with green chillies',
    'Fresh paste',
    'Ginger-garlic paste, ground every morning',
  ),
  slide(
    '1512010151537-2cf5c638ad51',
    'Daal in a clay handi with fried garnish',
    'Ghar ka khana',
    'Comfort food, ready when you are',
  ),
  slide(
    '1596040033229-a9821ebd058d',
    'Whole spices arranged on a white table',
    'Measured spices',
    'The right masala, every single time',
  ),
  slide(
    '1495461199391-8c39ab674295',
    'Fresh ginger and turmeric on a wooden board',
    'Peeled & chopped',
    'Peeled, chopped and ready for the pan',
  ),
  slide(
    '1768179669433-bd9d52949c20',
    'Chicken curry with rice and salad',
    'Dinner, sorted',
    'From our kitchen to your handi, next day',
  ),
];

export const TRUST_POINTS = [
  { title: 'Prepared fresh daily', body: 'Made the morning of delivery' },
  { title: 'Hygienically packed', body: 'Sealed, labelled packs' },
  { title: 'Next-day delivery', body: 'Order tonight, get it tomorrow' },
  { title: 'Cash on delivery', body: 'Pay when it arrives' },
] as const;

/** "How it works" steps; times and city come from admin settings. */
export const stepsFor = (i: { cutoff: string; by: string; city: string }) => [
  {
    title: 'Pick your prep',
    body: 'Pastes, peeled garlic, masala bases, marinated fish or a meal pack of your choice.',
    image: '/images/site/mortar.jpg',
  },
  {
    title: `Order by ${i.cutoff}`,
    body: 'We take orders a night ahead so everything is prepared fresh in the morning.',
    image: '/images/site/chopping.jpg',
  },
  {
    title: `Get it by ${i.by}`,
    body: `Delivered to your door across ${i.city}. Pay the rider in cash.`,
    image: '/images/site/karahi.jpg',
  },
];

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
