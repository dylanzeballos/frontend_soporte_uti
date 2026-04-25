import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--radius-button)] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "button-primary-lively hover:-translate-y-0.5 hover:brightness-[1.03] focus-visible:-translate-y-0.5",
        outline:
          "bg-background/80 text-[var(--on-secondary-fixed)] shadow-[var(--shadow-1)] backdrop-blur-sm hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--secondary-container)_24%,var(--surface-lowest)_76%)] hover:text-[var(--on-secondary-fixed)] hover:shadow-[var(--shadow-2)] aria-expanded:bg-[color-mix(in_srgb,var(--secondary-container)_24%,var(--surface-lowest)_76%)] aria-expanded:text-[var(--on-secondary-fixed)] dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-[color-mix(in_srgb,var(--secondary-container)_26%,var(--surface-lowest)_74%)] text-[var(--on-secondary-fixed)] shadow-[var(--shadow-1)] backdrop-blur-sm hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--secondary-container)_34%,var(--surface-lowest)_66%)] hover:shadow-[var(--shadow-2)] aria-expanded:bg-[color-mix(in_srgb,var(--secondary-container)_34%,var(--surface-lowest)_66%)] aria-expanded:text-[var(--on-secondary-fixed)]",
        ghost:
          "hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--secondary-container)_22%,transparent)] hover:text-[var(--on-secondary-fixed)] aria-expanded:bg-[color-mix(in_srgb,var(--secondary-container)_22%,transparent)] aria-expanded:text-[var(--on-secondary-fixed)] dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive shadow-[var(--shadow-1)] hover:-translate-y-0.5 hover:bg-destructive/20 hover:shadow-[var(--shadow-2)] focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-1.5 px-4 in-data-[slot=button-group]:rounded-[var(--radius-button)] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 gap-1 rounded-[var(--radius-button)] px-2.5 text-xs in-data-[slot=button-group]:rounded-[var(--radius-button)] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 gap-1 rounded-[var(--radius-button)] px-3 in-data-[slot=button-group]:rounded-[var(--radius-button)] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        lg: "h-12 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9",
        "icon-xs":
          "size-8 rounded-[var(--radius-button)] in-data-[slot=button-group]:rounded-[var(--radius-button)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-10 rounded-[var(--radius-button)] in-data-[slot=button-group]:rounded-[var(--radius-button)]",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
