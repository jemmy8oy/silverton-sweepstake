import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border-2 border-foreground text-[0.68rem] font-black whitespace-nowrap uppercase tracking-[0.12em] transition-all outline-none select-none brutal-focus disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
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
        default: "min-h-9 gap-1.5 px-3 py-2",
        xs: "min-h-7 gap-1 px-2 py-1 text-[0.58rem]",
        sm: "min-h-8 gap-1.5 px-2.5 py-1.5 text-[0.62rem]",
        lg: "min-h-10 gap-2 px-4 py-2.5 text-xs",
        icon: "size-9",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
