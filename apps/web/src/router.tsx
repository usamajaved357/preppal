import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { z } from 'zod';
import { Layout } from './components/Layout';
import { CartPage } from './routes/Cart';
import { CheckoutPage } from './routes/Checkout';
import { HomePage } from './routes/Home';
import { LegalPage } from './routes/Legal';
import { OrderPlacedPage } from './routes/OrderPlaced';
import { ProductPage } from './routes/Product';
import { TrackPage } from './routes/Track';

/** Code-based routes (no generated route tree to keep in sync). Add new pages here. */
const root = createRootRoute({ component: Layout });

const routes = [
  createRoute({ getParentRoute: () => root, path: '/', component: HomePage }),
  createRoute({ getParentRoute: () => root, path: '/p/$slug', component: ProductPage }),
  createRoute({ getParentRoute: () => root, path: '/cart', component: CartPage }),
  createRoute({ getParentRoute: () => root, path: '/checkout', component: CheckoutPage }),
  createRoute({ getParentRoute: () => root, path: '/order/$number', component: OrderPlacedPage }),
  // Policy pages (content in lib/legal.ts)
  createRoute({
    getParentRoute: () => root,
    path: '/delivery',
    component: () => <LegalPage slug="delivery" />,
  }),
  createRoute({
    getParentRoute: () => root,
    path: '/refunds',
    component: () => <LegalPage slug="refunds" />,
  }),
  createRoute({
    getParentRoute: () => root,
    path: '/privacy',
    component: () => <LegalPage slug="privacy" />,
  }),
  createRoute({ getParentRoute: () => root, path: '/terms', component: () => <LegalPage slug="terms" /> }),
  createRoute({
    getParentRoute: () => root,
    path: '/track',
    component: TrackPage,
    validateSearch: z.object({ number: z.string().optional() }),
  }),
];

export const router = createRouter({
  routeTree: root.addChildren(routes),
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
