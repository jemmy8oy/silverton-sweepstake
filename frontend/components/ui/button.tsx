import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border text-xs font-medium whitespace-nowrap transition-all outline-none select-none brutal-focus disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100",
        outline: "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100",
        secondary: "border-neutral-200 bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
        ghost: "border-transparent bg-transparent text-neutral-700 hover:bg-neutral-100",
        destructive: "border-red-500 bg-red-500 text-white hover:bg-red-600",
        link: "border-transparent bg-transparent px-0 text-[color:var(--color-signal-blue)] underline underline-offset-4 hover:text-foreground",
        accent: "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600",
      },
      size: {
        default: "min-h-8 gap-1.5 rounded-3xl px-3 py-1.5",
        xs: "min-h-7 gap-1 rounded-3xl px-2 py-1 text-[0.68rem]",
        sm: "min-h-7 gap-1.5 rounded-3xl px-2.5 py-1 text-xs",
        lg: "min-h-10 gap-2 rounded-3xl px-4 py-2 text-sm",
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
