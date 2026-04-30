import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ref, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "control-shell flex min-h-36 w-full border border-transparent px-4 py-3.5 text-base shadow-[var(--shadow-1)] transition-[color,box-shadow,transform,background] duration-200 outline-none placeholder:text-muted-foreground/90 hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] focus-visible:-translate-y-0.5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:shadow-[var(--shadow-2)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
