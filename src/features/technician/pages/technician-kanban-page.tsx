import { Navigate } from 'react-router-dom';

import { useAuth } from '@/components/auth-context';
import { KanbanPage } from '@/features/kanban/pages';
import { getDefaultRouteForUser, isAgent } from '@/features/users/schemas';

export function TechnicianKanbanPage() {
  const { user } = useAuth();

  if (!user) return null;
  if (!isAgent(user)) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  return (
    <KanbanPage
      assignedToId={user.id}
      title="Kanban tecnico"
      description="Mueve y prioriza solo los tickets que estan asignados a tu cuenta."
      emptyMessage="No tienes tickets asignados para mostrar en este tablero."
      badgeLabel="asignaciones"
    />
  );
}
