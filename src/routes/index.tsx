import { LoginPage } from '@/features/auth/pages';
import { DashboardPage } from '@/features/dashboard/pages';
import { AdminReportsPage } from '@/features/reports/pages';
import { TicketRequestPage, TicketsAdminPage, TicketsPage } from '@/features/tickets/pages';
import { ServiceCreatePage, ServicesEntryPage, ServicesListPage } from '@/features/services/pages';
import { RoleCreatePage, RolesEntryPage, RolesListPage } from '@/features/roles/pages';
import { UnitCreatePage, UnitsEntryPage, UnitsListPage } from '@/features/units/pages';
import { KanbanPage } from '@/features/kanban/pages/kanban-page';
import {
  TechnicianAssignmentsPage,
  TechnicianDashboardPage,
  TechnicianKanbanPage,
  TechnicianPendingTicketsPage,
  TechnicianReportsPage,
} from '@/features/technician/pages';
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
    path: '/technician/dashboard',
    element: <TechnicianDashboardPage />,
    protected: true,
  },
  {
    path: '/technician/kanban',
    element: <TechnicianKanbanPage />,
    protected: true,
  },
  {
    path: '/technician/assignments',
    element: <TechnicianAssignmentsPage />,
    protected: true,
  },
  {
    path: '/technician/pending',
    element: <TechnicianPendingTicketsPage />,
    protected: true,
  },
  {
    path: '/technician/reports',
    element: <TechnicianReportsPage />,
    protected: true,
  },
  {
    path: '/admin/users',
    element: <UsersAdminPage />,
    protected: true,
  },
  {
    path: '/admin/reports',
    element: <AdminReportsPage />,
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
    path: '/admin/units/list',
    element: <UnitsListPage />,
    protected: true,
  },
  {
    path: '/admin/units',
    element: <UnitsEntryPage />,
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
    path: '/admin/services/list',
    element: <ServicesListPage />,
    protected: true,
  },
  {
    path: '/admin/services',
    element: <ServicesEntryPage />,
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
    path: '/admin/roles/list',
    element: <RolesListPage />,
    protected: true,
  },
  {
    path: '/admin/roles',
    element: <RolesEntryPage />,
    protected: true,
  },
];

export const defaultRoute = '/dashboard';
