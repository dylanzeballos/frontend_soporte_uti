import { useState } from "react";
import { MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type UserRole = "admin" | "cliente" | "tecnico";

type UserRow = {
  id: number;
  ci: string;
  phone?: string;
  cell?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive: boolean;
  corporation: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

const UNIT_OPTIONS = [
  "Ing. Financiera",
  "Ing. Sistemas",
  "Ing. Comercial",
  "Ing. Industrial",
  "Contaduría Pública",
  "Administración de Empresas",
];

const ROLE_OPTIONS: UserRole[] = ["admin", "cliente", "tecnico"];

const roleBadgeClass: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  cliente: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  tecnico: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const initialUsers: UserRow[] = [
  {
    id: 1,
    ci: "12345678",
    phone: "22445566",
    cell: "70000001",
    firstName: "Carlos",
    lastName: "Mamani",
    email: "carlos@umss.edu.bo",
    password: "secret123",
    isActive: true,
    corporation: "Ing. Sistemas",
    role: "admin",
    createdAt: "2026-01-03T09:15:00.000Z",
    updatedAt: "2026-01-03T09:15:00.000Z",
  },
  {
    id: 2,
    ci: "87654321",
    phone: "22334455",
    cell: "70000002",
    firstName: "Lucia",
    lastName: "Quispe",
    email: "lucia@umss.edu.bo",
    password: "secret123",
    isActive: true,
    corporation: "Ing. Financiera",
    role: "cliente",
    createdAt: "2026-01-10T11:20:00.000Z",
    updatedAt: "2026-02-01T08:00:00.000Z",
  },
  {
    id: 3,
    ci: "5512344",
    phone: "22114455",
    cell: "70000003",
    firstName: "Jorge",
    lastName: "Arias",
    email: "jorge@umss.edu.bo",
    password: "secret123",
    isActive: true,
    corporation: "Ing. Comercial",
    role: "tecnico",
    createdAt: "2026-01-14T14:40:00.000Z",
    updatedAt: "2026-02-10T09:45:00.000Z",
  },
  {
    id: 4,
    ci: "9123456",
    phone: "22667788",
    cell: "70000004",
    firstName: "Maria",
    lastName: "Soria",
    email: "maria.soria@umss.edu.bo",
    password: "secret123",
    isActive: false,
    corporation: "Contaduría Pública",
    role: "cliente",
    createdAt: "2026-01-25T10:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: 5,
    ci: "3344556",
    phone: "22330011",
    cell: "70000005",
    firstName: "Diego",
    lastName: "Vargas",
    email: "diego@umss.edu.bo",
    password: "secret123",
    isActive: true,
    corporation: "Administración de Empresas",
    role: "tecnico",
    createdAt: "2026-02-02T13:10:00.000Z",
    updatedAt: "2026-02-15T13:10:00.000Z",
  },
  {
    id: 6,
    ci: "7788990",
    phone: "22887766",
    cell: "70000006",
    firstName: "Paola",
    lastName: "Luna",
    email: "paola@umss.edu.bo",
    password: "secret123",
    isActive: true,
    corporation: "Ing. Industrial",
    role: "admin",
    createdAt: "2026-02-08T16:30:00.000Z",
    updatedAt: "2026-02-28T16:30:00.000Z",
  },
];

export function UsersAdminPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [newUser, setNewUser] = useState({
    ci: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    cell: "",
    role: "cliente" as UserRole,
    corporation: UNIT_OPTIONS[0],
  });

  const resetForm = () => {
    setNewUser({
      ci: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      cell: "",
      role: "cliente",
      corporation: UNIT_OPTIONS[0],
    });
    setEditingUserId(null);
  };

  const handleCreateOrUpdate = () => {
    if (!newUser.ci || !newUser.firstName || !newUser.lastName || !newUser.email) return;

    if (editingUserId !== null) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUserId
            ? {
                ...user,
                ci: newUser.ci,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                password: newUser.password || user.password,
                phone: newUser.phone || undefined,
                cell: newUser.cell || undefined,
                role: newUser.role,
                corporation: newUser.corporation,
                updatedAt: new Date().toISOString(),
              }
            : user
        )
      );
      resetForm();
      setShowCreate(false);
      return;
    }

    const nextId = users.length ? Math.max(...users.map((user) => user.id)) + 1 : 1;
    const now = new Date().toISOString();
    setUsers((prev) => [
      {
        id: nextId,
        ci: newUser.ci,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        password: newUser.password || "secret123",
        phone: newUser.phone || undefined,
        cell: newUser.cell || undefined,
        isActive: true,
        role: newUser.role,
        corporation: newUser.corporation,
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ]);
    resetForm();
    setShowCreate(false);
  };

  const handleEdit = (user: UserRow) => {
    setEditingUserId(user.id);
    setNewUser({
      ci: user.ci,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      phone: user.phone || "",
      cell: user.cell || "",
      role: user.role,
      corporation: user.corporation,
    });
    setShowCreate(true);
  };

  const handleDelete = (id: number) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const handleContact = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Registrar usuarios</h1>
        <Button onClick={() => {
          if (showCreate) resetForm();
          setShowCreate(!showCreate);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar usuario
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUserId ? "Editar usuario" : "Nuevo usuario"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                placeholder="CI"
                value={newUser.ci}
                onChange={(e) => setNewUser({ ...newUser, ci: e.target.value })}
              />
              <Input
                placeholder="Nombre"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
              />
              <Input
                placeholder="Apellido"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
              />
              <Input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
              <Input
                type="password"
                placeholder={editingUserId ? "Password (opcional)" : "Password"}
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
              <Input
                placeholder="Teléfono"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              />
              <Input
                placeholder="Celular"
                value={newUser.cell}
                onChange={(e) => setNewUser({ ...newUser, cell: e.target.value })}
              />
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={newUser.corporation ?? ""}
                onValueChange={(value) => setNewUser({ ...newUser, corporation: value ?? UNIT_OPTIONS[0] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unidad" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateOrUpdate}>{editingUserId ? "Actualizar" : "Guardar"}</Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowCreate(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Listado de usuarios ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>CI</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.ci}</TableCell>
                    <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", roleBadgeClass[user.role])}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.corporation}</TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>{user.cell || "-"}</TableCell>
                    <TableCell>{user.isActive ? "Activo" : "Inactivo"}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString("es-BO")}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} aria-label="Editar usuario">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleContact(user.email)} aria-label="Contactar usuario">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} aria-label="Eliminar usuario">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
