import { useState } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Eye, EyeOff, KeyRound, Loader2, Save, User2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/hooks/useApi';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PasswordStep = 'idle' | 'validating' | 'entering-new' | 'saving';

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth();

  // Password change state
  const [passwordStep, setPasswordStep] = useState<PasswordStep>('idle');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isLoading = passwordStep === 'validating' || passwordStep === 'saving';

  function resetPasswordForm() {
    setPasswordStep('idle');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  }

  function handleClose(value: boolean) {
    if (!value) {
      resetPasswordForm();
    }
    onOpenChange(value);
  }

  async function handleValidateCurrentPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword.trim() || !user?.email) return;

    setPasswordStep('validating');

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, password: currentPassword }),
          credentials: 'include',
        }
      );

      if (!res.ok) {
        toast.error('Contraseña actual incorrecta. Intenta de nuevo.');
        setPasswordStep('idle');
        return;
      }

      setPasswordStep('entering-new');
    } catch {
      toast.error('Error al verificar la contraseña. Intenta de nuevo.');
      setPasswordStep('idle');
    }
  }

  async function handleSaveNewPassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    if (!user?.id) return;

    setPasswordStep('saving');

    try {
      const result = await fetchApi(`/users/${user.id}`, 'PATCH', {
        password: newPassword,
      });

      if (result === null) {
        setPasswordStep('entering-new');
        return;
      }

      toast.success('Contraseña actualizada correctamente.');
      resetPasswordForm();
    } catch {
      toast.error('No se pudo actualizar la contraseña. Intenta de nuevo.');
      setPasswordStep('entering-new');
    }
  }

  const roleName =
    typeof user?.role === 'object' && user?.role !== null
      ? (user.role as { name?: string }).name ?? '—'
      : (user?.role as string | null | undefined) ?? '—';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0"
        />
        <DialogPrimitive.Popup
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-(--radius-panel) border border-border/60 bg-background p-6 shadow-lg',
            'transition-all duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
            'sm:p-7 max-h-[90svh] overflow-y-auto'
          )}
        >
          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogPrimitive.Title className="flex items-center gap-2 text-base font-semibold text-foreground">
                <User2 className="h-5 w-5 text-primary" />
                Mi perfil
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                Información de tu cuenta y opciones de seguridad.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              render={
                <button
                  type="button"
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Cerrar"
                />
              }
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {/* ── Account info ── */}
          <div className="space-y-3 rounded-lg border bg-muted/30 px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nombre
              </p>
              <p className="text-sm font-medium text-foreground">
                {user?.name || '—'}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Correo electrónico
              </p>
              <p className="text-sm text-foreground">{user?.email || '—'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Rol
              </p>
              <p className="text-sm capitalize text-foreground">{roleName}</p>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="my-5 border-t border-border/60" />

          {/* ── Change password ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Cambiar contraseña</span>
            </div>

            {/* Step 1 — verify current password */}
            {(passwordStep === 'idle' || passwordStep === 'validating') && (
              <form onSubmit={handleValidateCurrentPassword} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="profile-current-password">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="profile-current-password"
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="Ingresa tu contraseña actual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isLoading}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !currentPassword.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar contraseña'
                  )}
                </Button>
              </form>
            )}

            {/* Step 2 — enter new password */}
            {(passwordStep === 'entering-new' || passwordStep === 'saving') && (
              <form onSubmit={handleSaveNewPassword} className="space-y-3">
                <p className="rounded-md bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-400">
                  ✓ Contraseña actual verificada. Ingresa tu nueva contraseña.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="profile-new-password">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="profile-new-password"
                      type={showNew ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      className="pr-10"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-confirm-password">Confirmar nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="profile-confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repite la nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetPasswordForm}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !newPassword || !confirmPassword}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar contraseña
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
