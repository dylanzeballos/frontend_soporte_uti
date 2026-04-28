import { LoginPage } from '@/features/auth/pages';
import { DashboardPage } from '@/features/dashboard/pages';
import { TicketRequestPage, TicketsAdminPage, TicketsPage } from '@/features/tickets/pages';
import { ServiceCreatePage, ServicesListPage } from '@/features/services/pages';
import { RoleCreatePage, RolesListPage } from '@/features/roles/pages';
import { UnitCreatePage, UnitsListPage } from '@/features/units/pages';
import { KanbanPage } from '@/features/kanban/pages';
import { UsersAdminPage } from '@/features/users/pages';
import type { ReactNode } from 'react';

export interface AppRoute {
  path: string;
  element: ReactNode;
  protected?: boolean;
}

export const routes: AppRoute[] = [
  {
    path: '/login',
    element: <LoginPage />,
    protected: false,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
    protected: true,
  },
  {
    path: '/tickets',
    element: <TicketsPage />,
    protected: true,
  },
  {
    path: '/tickets/request',
    element: <TicketRequestPage />,
    protected: true,
  },
  {
    path: '/tickets/admin',
    element: <TicketsAdminPage />,
    protected: true,
  },
  {
    path: '/kanban',
    element: <KanbanPage />,
    protected: true,
  },
  {
    path: '/admin/users',
    element: <UsersAdminPage />,
    protected: true,
  },
  {
    path: '/admin/units/create',
    element: <UnitCreatePage />,
    protected: true,
  },
  {
    path: '/admin/units/:id/edit',
    element: <UnitCreatePage />,
    protected: true,
  },
  {
    path: '/admin/units',
    element: <UnitsListPage />,
    protected: true,
  },
  {
    path: '/admin/services/create',
    element: <ServiceCreatePage />,
    protected: true,
  },
  {
    path: '/admin/services/:id/edit',
    element: <ServiceCreatePage />,
    protected: true,
  },
  {
    path: '/admin/services',
    element: <ServicesListPage />,
    protected: true,
  },
  {
    path: '/admin/roles/create',
    element: <RoleCreatePage />,
    protected: true,
  },
  {
    path: '/admin/roles/:id/edit',
    element: <RoleCreatePage />,
    protected: true,
  },
  {
    path: '/admin/roles',
    element: <RolesListPage />,
    protected: true,
  },
];

export const defaultRoute = '/dashboard';
