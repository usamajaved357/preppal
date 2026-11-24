import type { ComponentType, SVGProps } from 'react';
import { IconBox, IconOrders, IconPin, IconSettings, IconStack, IconTag, IconUsers } from './icons';

export type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  hint: string;
};

/** Sidebar + ⌘K palette share this list. */
export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Daily',
    items: [
      { to: '/', label: 'Orders', icon: IconOrders, hint: 'Today and tomorrow’s deliveries, prep list' },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { to: '/products', label: 'Products', icon: IconBox, hint: 'Add, edit, price and remove products' },
      { to: '/categories', label: 'Categories', icon: IconTag, hint: 'Group products on the storefront' },
      { to: '/inventory', label: 'Inventory', icon: IconStack, hint: 'Stock, daily limits, city prices' },
    ],
  },
  {
    group: 'Setup',
    items: [
      { to: '/areas', label: 'Delivery areas', icon: IconPin, hint: 'Cities, areas and delivery fees' },
      {
        to: '/team',
        label: 'Team & riders',
        icon: IconUsers,
        hint: 'Admins who sign in, riders who deliver',
      },
      { to: '/settings', label: 'Settings', icon: IconSettings, hint: 'Cutoff, pause orders, announcement' },
    ],
  },
];
