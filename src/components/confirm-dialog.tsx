import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: 'destructive' | 'default';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  isLoading = false,
  variant = 'destructive',
}: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0"
        />
        <DialogPrimitive.Popup
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-(--radius-panel) border border-border/60 bg-background p-6 shadow-lg transition-all duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-7'
          )}
        >
          <div className="space-y-4">
            {/* Header con icono */}
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'rounded-full p-2.5 shrink-0',
                  variant === 'destructive'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                  {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm text-muted-foreground leading-6">
                  {description}
                </DialogPrimitive.Description>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={isLoading} onClick={() => onOpenChange(false)}>
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={variant}
                disabled={isLoading}
                onClick={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
              >
                {isLoading ? 'Procesando...' : actionLabel}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
