import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { Shell } from './components/Shell';
import { InventoryPage } from './routes/Inventory';
import { OrdersPage } from './routes/orders/OrdersPage';
import { ProductEditPage } from './routes/products/ProductEditPage';
import { ProductsPage } from './routes/products/ProductsPage';
import { AreasPage } from './routes/setup/Areas';
import { SettingsPage } from './routes/setup/Settings';
import { TeamPage } from './routes/setup/Team';

const root = createRootRoute({ component: Shell });

export const router = createRouter({
  routeTree: root.addChildren([
    createRoute({ getParentRoute: () => root, path: '/', component: OrdersPage }),
    createRoute({ getParentRoute: () => root, path: '/products', component: ProductsPage }),
    createRoute({ getParentRoute: () => root, path: '/products/$id', component: ProductEditPage }),
    createRoute({ getParentRoute: () => root, path: '/inventory', component: InventoryPage }),
    createRoute({ getParentRoute: () => root, path: '/areas', component: AreasPage }),
    createRoute({ getParentRoute: () => root, path: '/team', component: TeamPage }),
    createRoute({ getParentRoute: () => root, path: '/settings', component: SettingsPage }),
  ]),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
