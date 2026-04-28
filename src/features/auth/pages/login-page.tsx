import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-context';
import { loginSchema, type LoginForm } from '@/features/auth/schemas/login.schema';

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticacion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[url('/fce-ilustration.png')] bg-cover bg-center bg-no-repeat p-4">
      <Card className="relative z-10 w-full max-w-md border-transparent shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src="/LogoFCE.webp" alt="UTI" className="h-16 w-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Gestor Soporte UTI</CardTitle>
            <CardDescription>Ingresá tus credenciales para acceder al sistema</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@utdt.edu"
                  className="pl-9"
                  {...register('email')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                Gestor Soporte UTI
              </CardTitle>
              <CardDescription className="mx-auto max-w-sm text-sm leading-6 text-slate-600 sm:text-base">
                Ingresa tus credenciales.
              </CardDescription>
            </div>
          </CardContent>
          <CardFooter className="mt-2 flex flex-col gap-4 pt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
