# React Clean Architecture por Features

Arquitectura frontend escalable basada en **features**, hooks reutilizables, validación con Zod + React Hook Form, páginas como meras compositoras de componentes y separación limpia de lógica de negocio.

**Cuándo usar este skill:**  
Cuando el usuario pida "crear proyecto react con clean architecture", "organizar features", "hooks con zod", "useApi hook", "páginas que solo rendericen", "componentes globales", "handlers fuera de páginas", o cualquier combinación de estas prácticas.

---

## 1. Estructura de carpetas

```
src/
├── features/               # Cada funcionalidad es un feature autocontenido
│   ├── auth/
│   │   ├── components/     # Solo componentes de UI específicos de auth
│   │   ├── hooks/          # Hooks de estado y llamadas a API (useLogin, useSignup)
│   │   ├── services/       # Lógica de negocio y comunicación con API
│   │   ├── types/          # Tipos e interfaces de auth
│   │   └── validations/    # Schemas de Zod para formularios
│   ├── products/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── validations/
│   └── ...
├── hooks/                  # Hooks globales reutilizables (useApi, useMediaQuery, etc.)
├── components/             # Componentes UI globales (botones, modales, inputs, etc.)
├── pages/                  # Componentes de página (solo componen features y pasan props)
├── services/               # Servicios globales (ej. cliente HTTP)
├── utils/                  # Funciones utilitarias puras
└── App.tsx / main.tsx
```

**Reglas de carpeta obligatorias:**
- Nunca pongas lógica de negocio dentro de `pages/` o `components/`.
- Cada feature expone un barril `index.ts` que re‑exporta solo lo necesario.
- Los componentes globales (`components/`) no pueden importar nada de un feature (son independientes).

---

## 2. Hook genérico `useApi` (base para todas las peticiones)

Crea **un solo hook `useApi`** que maneje estado de carga, error y datos. Todos los hooks de feature deben estar construidos sobre él.

```ts
// src/hooks/useApi.ts
import { useState, useCallback } from 'react';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (
    promise: Promise<T>,
    options?: UseApiOptions<T>
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await promise;
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Algo salió mal';
      setError(message);
      options?.onError?.(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, error, isLoading, execute, reset };
}
```

**Principio:** `useApi` es genérico; nunca recibe lógica de negocio. Los hooks de cada feature le pasan la promesa concreta (fetch, axios, etc.).

---

## 3. Hooks por feature (encapsulan las llamadas a la API)

Cada hook de feature usa `useApi` y expone funciones semánticas. Ejemplo para auth:

```ts
// src/features/auth/hooks/useLogin.ts
import { useApi } from '@/hooks/useApi';
import { loginService } from '../services/authService';
import type { LoginCredentials, User } from '../types';

export function useLogin() {
  const { execute, ...rest } = useApi<User>();

  const login = (credentials: LoginCredentials) => {
    return execute(loginService(credentials));   // loginService devuelve una promesa
  };

  return { login, ...rest };
}
```

El servicio (`loginService`) contiene la lógica de llamada HTTP pura, sin estado.

---

## 4. Validaciones con Zod + React Hook Form

Dentro de cada feature, en la carpeta `validations/`, define todos los schemas de Zod.

```ts
// src/features/auth/validations/loginSchema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

El componente de formulario usa `useForm` con el resolver de Zod y recibe el hook del feature.

```tsx
// src/features/auth/components/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../validations/loginSchema';
import { useLogin } from '../hooks/useLogin';

export function LoginForm() {
  const { login, isLoading, error } = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input label="Email" {...register('email')} error={errors.email?.message} />
      <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
      <Button type="submit" loading={isLoading}>Iniciar sesión</Button>
      {error && <Alert type="error">{error}</Alert>}
    </form>
  );
}
```

- Los inputs (`Input`, `Button`, etc.) vienen de `@/components` (globales).
- **Nunca escribas `onSubmit` inline largo; extráelo a una función aparte si crece.**
- Las páginas **no deben contener esta lógica de formulario**.

---

## 5. Páginas como simples compositoras

Las páginas solo renderizan componentes del feature y pasan props. Nunca contienen lógica de negocio, solo obtienen datos iniciales (ej. usando un hook del feature si es necesario) y los distribuyen.

```tsx
// src/pages/LoginPage.tsx
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <LoginForm />
    </main>
  );
}
```

Si la página necesita cargar datos antes de mostrar algo, extrae la carga a un componente contenedor dentro del feature (no en la página).

---

## 6. Handlers y lógica fuera de páginas / componentes

- Los manejadores de eventos complejos (p.ej. `handleSubmit`, `handleSearch`) se definen dentro del hook del feature o en un archivo `handlers/` propio del feature.
- No coloques funciones con muchas líneas directamente en el JSX.
- Si varios componentes comparten una misma lógica de manejo de eventos, extráela a un hook personalizado (ej. `useSearchHandler`).

```ts
// src/features/search/hooks/useSearchHandler.ts
export function useSearchHandler() {
  const { execute, ...rest } = useApi<SearchResults>();

  const handleSearch = (query: string) => {
    // Lógica de validación adicional, transformación, etc.
    const sanitized = query.trim();
    return execute(searchService(sanitized));
  };

  return { handleSearch, ...rest };
}
```

---

## 7. Principios SOLID, Clean y DRY

- **Single Responsibility:** cada hook hace una sola cosa, cada componente una sola presentación.
- **Open/Closed:** los servicios (ej. `authService`) son fácilmente reemplazables sin tocar hooks.
- **Liskov:** si creas variantes de un hook, la interfaz debe ser compatible.
- **Interface Segregation:** no pases datos que el componente no necesita; usa tipos mínimos.
- **Dependency Inversion:** los hooks dependen de una abstracción (`useApi`), no de `fetch` directamente.
- **DRY:** esquemas Zod, tipos y lógica de validación se escriben una sola vez. Si dos features necesitan el mismo campo (ej. email), crea un esquema compartido en `utils/validations/`.
- **Clean:** separación estricta entre UI, estado y servicios.

---

## 8. Lista de verificación antes de finalizar cualquier feature

- [ ] Las páginas no contienen `useState`, `useEffect`, ni lógica condicional compleja.
- [ ] Los formularios usan `react-hook-form` + `zodResolver`.
- [ ] Las llamadas a la API están dentro de hooks de feature que usan `useApi`.
- [ ] Los servicios (`services/`) no usan hooks; solo devuelven promesas.
- [ ] Los componentes globales (`components/`) no importan nada de `features/`.
- [ ] No se repiten esquemas de validación ni lógica de negocio.
- [ ] Los handlers con más de 5 líneas están extraídos a funciones separadas.
```