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
import { getDefaultRouteForUser } from '@/features/users/schemas';

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
      const user = await login(data.email, data.password);
      navigate(getDefaultRouteForUser(user), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticacion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-scene relative min-h-screen overflow-hidden bg-slate-950">
      <video
        className="login-video pointer-events-none absolute inset-0 h-full w-full object-fill"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden="true"
      >
        <source src="/FondoLogin.mp4" type="video/mp4" />
      </video>

      <div className="login-video-tint absolute inset-0" />
      <div className="login-video-glow absolute inset-0" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="login-shell w-full max-w-md border-white/20 bg-white/12 py-0 text-white backdrop-blur-lg">
          <div className="login-form-panel rounded-[2rem] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(246,248,252,0.92)_100%)] text-slate-900">
            <CardHeader className="space-y-5 px-6 pb-0 pt-8 text-center sm:px-8">
              <div className="flex justify-center">
                <div className="login-logo-ring rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_36px_rgba(15,23,42,0.12)]">
                  <img
                    src="/LogoFCE.webp"
                    alt="UTI"
                    className="h-20 w-auto drop-shadow-[0_10px_18px_rgba(15,23,42,0.16)]"
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
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-7 px-6 pb-0 pt-8 sm:px-8">
                {error && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive shadow-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="nombre@utdt.edu"
                        className="h-14 border-slate-200/80 bg-white/92 pl-11 text-slate-900 placeholder:text-slate-400"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="********"
                        className="h-14 border-slate-200/80 bg-white/92 pl-11 pr-12 text-slate-900 placeholder:text-slate-400"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                        aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-5 px-6 pb-8 pt-8 sm:px-8 sm:pb-9">
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full rounded-[1.1rem] text-base font-semibold shadow-[0_18px_40px_rgba(17,34,68,0.22)]"
                  disabled={isLoading}
                >
                  {isLoading ? 'Ingresando...' : 'Iniciar sesion'}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </CardFooter>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
