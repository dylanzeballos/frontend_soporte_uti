import { LoginPage } from '@/features/auth/pages';
import { DashboardPage } from '@/features/dashboard/pages';
import { TicketRequestPage, TicketsAdminPage, TicketsPage } from '@/features/tickets/pages';
import { KanbanPage } from '@/features/kanban/pages';
import { UsersAdminPage } from '@/features/users/pages';
import { UnitsAdminPage, ServicesAdminPage, RolesAdminPage } from '@/features/admin/pages';
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
    path: '/admin/units',
    element: <UnitsAdminPage />,
    protected: true,
  },
  {
    path: '/admin/services',
    element: <ServicesAdminPage />,
    protected: true,
  },
  {
    path: '/admin/roles',
    element: <RolesAdminPage />,
    protected: true,
  },
];

export const defaultRoute = '/dashboard';
