import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border-2 border-foreground text-xs font-black whitespace-nowrap uppercase tracking-[0.14em] transition-all outline-none select-none brutal-focus disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-background hover:text-foreground brutal-offset",
        outline: "bg-background text-foreground hover:bg-primary hover:text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "border-transparent bg-transparent text-foreground hover:border-foreground hover:bg-secondary",
        destructive: "bg-destructive text-destructive-foreground hover:bg-background hover:text-destructive",
        link: "border-transparent bg-transparent px-0 text-[color:var(--color-signal-blue)] underline underline-offset-4 hover:text-foreground",
        accent: "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground brutal-offset",
      },
      size: {
        default: "min-h-11 gap-2 px-4 py-2.5",
        xs: "min-h-8 gap-1.5 px-2.5 py-1.5 text-[0.65rem]",
        sm: "min-h-9 gap-1.5 px-3 py-2 text-[0.7rem]",
        lg: "min-h-12 gap-2 px-5 py-3 text-sm",
        icon: "size-11",
        "icon-xs": "size-8",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
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
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }), variant !== "link" && "shadow-none")}
      {...props}
    />
  )
}

export { Button, buttonVariants }
