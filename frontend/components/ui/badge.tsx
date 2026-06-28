import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex min-h-5 w-fit shrink-0 items-center justify-center gap-1 rounded-xl border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all brutal-focus has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-neutral-200 bg-neutral-100 text-neutral-700",
        secondary: "border-neutral-200 bg-neutral-100 text-neutral-700",
        destructive: "border-red-500 bg-red-500 text-white",
        outline: "border-neutral-200 bg-neutral-100 text-neutral-500",
        ghost: "border-transparent bg-transparent text-foreground",
        link: "border-transparent bg-transparent px-0 text-[color:var(--color-signal-blue)] underline underline-offset-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
