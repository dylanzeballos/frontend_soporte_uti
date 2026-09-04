import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ref, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "control-shell h-12 w-full min-w-0 border border-transparent px-4 py-2.5 text-base shadow-[var(--shadow-1)] transition-[color,box-shadow,transform,background] duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/90 hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] focus-visible:-translate-y-0.5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:shadow-[var(--shadow-2)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
