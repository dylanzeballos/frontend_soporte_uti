import { useEffect, useRef, useState } from "react";
import {
  FilterX,
  Plus,
  Search,
  SlidersHorizontal,
  UserCog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserFormComponent } from "@/features/users/components/forms/UserFormComponent";
import { UsersTable } from "@/features/users/components/tables/UsersTable";
import { useUsersAdmin } from "@/features/users/hooks/useUsersAdmin";
import type { User } from "@/features/users/schemas";

function getDisplayName(user: User): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.name || user.email;
}

export function UsersAdminPage() {
  const usersAdmin = useUsersAdmin();
  const formRef = useRef<HTMLDivElement>(null);

  // Confirm-dialog state for archive action
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [userToArchive, setUserToArchive] = useState<User | null>(null);

  // Auto-scroll to the form when it opens
  useEffect(() => {
    if (usersAdmin.showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [usersAdmin.showForm]);

  const handleArchiveRequest = (user: User) => {
    setUserToArchive(user);
    setArchiveDialogOpen(true);
  };

  const handleConfirmArchive = () => {
    if (userToArchive) {
      usersAdmin.archiveUser(userToArchive);
      setUserToArchive(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Header ── */}
      <section className="lively-hero rounded-(--radius-panel) px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10">
          <div className="editorial-kicker">
            <UserCog className="inline-block h-3.5 w-3.5" />
            &nbsp;Administración
          </div>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.02em] text-foreground">
                Usuarios
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Alta, edición, archivo y búsqueda de usuarios del sistema.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
              <Badge variant="outline" className="h-10 px-3 text-sm">
                Total: {usersAdmin.total}
              </Badge>
              <Button
                onClick={usersAdmin.startCreate}
                disabled={usersAdmin.showForm}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo usuario
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Inline form (create / edit) ── */}
      {usersAdmin.showForm ? (
        <div ref={formRef}>
          <UserFormComponent
            key={usersAdmin.editingUser?.id ?? "new-user"}
            initialValues={usersAdmin.formValues}
            mode={usersAdmin.editingUser ? "edit" : "create"}
            roles={usersAdmin.roles}
            corporations={usersAdmin.corporations}
            isSubmitting={usersAdmin.isSaving}
            onSubmit={usersAdmin.submitForm}
            onCancel={usersAdmin.cancelForm}
          />
        </div>
      ) : null}

      {/* ── Filters ── */}
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
                onValueChange={(value) => usersAdmin.setRoleId(value ?? "all")}
              >
                <SelectTrigger id="user-role-filter">
                  <SelectValue placeholder="Rol">
                    {usersAdmin.filters.roleId === "all"
                      ? "Todos los roles"
                      : usersAdmin.roles.find(
                          (role) =>
                            String(role.id) === usersAdmin.filters.roleId,
                        )?.name}
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
              <Label htmlFor="user-corporation-filter">Unidad</Label>
              <Select
                value={usersAdmin.filters.corporationId}
                onValueChange={(value) =>
                  usersAdmin.setCorporationId(value ?? "all")
                }
              >
                <SelectTrigger
                  id="user-corporation-filter"
                  className="h-auto min-h-12 py-2 whitespace-normal *:data-[slot=select-value]:line-clamp-none"
                >
                  <SelectValue placeholder="Unidad">
                    {usersAdmin.filters.corporationId === "all"
                      ? "Todas las Unidades"
                      : usersAdmin.corporations.find(
                          (corporation) =>
                            String(corporation.id) ===
                            usersAdmin.filters.corporationId,
                        )?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className="w-max max-w-[32rem]"
                >
                  <SelectItem
                    value="all"
                    className="[&_*]:whitespace-normal! [&_*]:break-words!"
                  >
                    Todas las Unidades
                  </SelectItem>
                  {usersAdmin.corporations.map((corporation) => (
                    <SelectItem
                      key={corporation.id}
                      value={String(corporation.id)}
                      className="[&_*]:whitespace-normal! [&_*]:break-words!"
                    >
                      {corporation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                className="w-full"
                variant="outline"
                onClick={usersAdmin.resetFilters}
              >
                <FilterX className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <UsersTable
        users={usersAdmin.users}
        total={usersAdmin.total}
        page={usersAdmin.page}
        totalPages={usersAdmin.totalPages}
        isLoading={usersAdmin.isLoading || usersAdmin.isFetching}
        isDeleting={usersAdmin.isDeleting}
        onEdit={usersAdmin.startEdit}
        onArchive={handleArchiveRequest}
        onPreviousPage={() => usersAdmin.setPage(usersAdmin.page - 1)}
        onNextPage={() => usersAdmin.setPage(usersAdmin.page + 1)}
      />

      {/* ── Confirm archive dialog ── */}
      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archivar usuario"
        description={`¿Estás seguro de que deseas archivar al usuario "${userToArchive ? getDisplayName(userToArchive) : ""}"? Esta acción desactivará su acceso al sistema.`}
        actionLabel="Archivar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmArchive}
        isLoading={usersAdmin.isDeleting}
        variant="destructive"
      />
    </div>
  );
}
