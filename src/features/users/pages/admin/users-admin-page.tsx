import { FilterX, Plus, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserFormComponent } from '@/features/users/components/forms/UserFormComponent';
import { UsersTable } from '@/features/users/components/tables/UsersTable';
import { useUsersAdmin } from '@/features/users/hooks/useUsersAdmin';

export function UsersAdminPage() {
  const usersAdmin = useUsersAdmin();

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--radius-panel)] border border-primary/10 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_45%),var(--card)] px-5 py-5 shadow-[var(--shadow-1)] sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Gestión administrativa
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Usuarios</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Alta, edición, archivo, búsqueda y filtros sobre datos reales de `/api/users`.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="h-10 px-3">
              Total: {usersAdmin.total}
            </Badge>
            <Button onClick={usersAdmin.startCreate} disabled={usersAdmin.showForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo usuario
            </Button>
          </div>
        </div>
      </section>

      {usersAdmin.showForm ? (
        <UserFormComponent
          key={usersAdmin.editingUser?.id ?? 'new-user'}
          initialValues={usersAdmin.formValues}
          mode={usersAdmin.editingUser ? 'edit' : 'create'}
          roles={usersAdmin.roles}
          corporations={usersAdmin.corporations}
          isSubmitting={usersAdmin.isSaving}
          onSubmit={usersAdmin.submitForm}
          onCancel={usersAdmin.cancelForm}
        />
      ) : null}

      <Card className="border-border/70 bg-card/95">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Filtros
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="user-search">Buscar</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="user-search"
                  className="pl-10"
                  value={usersAdmin.filters.search}
                  placeholder="Nombre, email, CI, teléfono..."
                  onChange={(event) => usersAdmin.setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role-filter">Rol</Label>
              <Select
                value={usersAdmin.filters.roleId}
                onValueChange={(value) => usersAdmin.setRoleId(value ?? 'all')}
              >
                <SelectTrigger id="user-role-filter">
                  <SelectValue placeholder="Rol">
                    {usersAdmin.filters.roleId === 'all'
                      ? 'Todos los roles'
                      : usersAdmin.roles.find((role) => String(role.id) === usersAdmin.filters.roleId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {usersAdmin.roles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-corporation-filter">Corporación</Label>
              <Select
                value={usersAdmin.filters.corporationId}
                onValueChange={(value) => usersAdmin.setCorporationId(value ?? 'all')}
              >
                <SelectTrigger id="user-corporation-filter">
                  <SelectValue placeholder="Corporación">
                    {usersAdmin.filters.corporationId === 'all'
                      ? 'Todas las corporaciones'
                      : usersAdmin.corporations.find(
                          (corporation) => String(corporation.id) === usersAdmin.filters.corporationId
                        )?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las corporaciones</SelectItem>
                  {usersAdmin.corporations.map((corporation) => (
                    <SelectItem key={corporation.id} value={String(corporation.id)}>
                      {corporation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full" variant="outline" onClick={usersAdmin.resetFilters}>
                <FilterX className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <UsersTable
        users={usersAdmin.users}
        total={usersAdmin.total}
        page={usersAdmin.page}
        totalPages={usersAdmin.totalPages}
        isLoading={usersAdmin.isLoading || usersAdmin.isFetching}
        isDeleting={usersAdmin.isDeleting}
        onEdit={usersAdmin.startEdit}
        onArchive={usersAdmin.archiveUser}
        onPreviousPage={() => usersAdmin.setPage(usersAdmin.page - 1)}
        onNextPage={() => usersAdmin.setPage(usersAdmin.page + 1)}
      />
    </div>
  );
}
