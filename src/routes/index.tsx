import { LoginPage } from '@/features/auth/pages';
import { DashboardPage } from '@/features/dashboard/pages';
import { TicketsPage } from '@/features/tickets/pages';
import { UnitCreatePage, UnitsListPage } from '@/features/units/pages';
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
];

export const defaultRoute = '/dashboard';
