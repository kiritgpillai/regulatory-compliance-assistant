import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-inverse hover:bg-secondary",
        secondary:
          "border-transparent bg-surface text-primary hover:bg-hover-bg",
        destructive:
          "border-transparent bg-error text-inverse hover:bg-secondary",
        outline: "text-primary border-border",
        success:
          "border-transparent bg-success text-inverse hover:bg-secondary",
        warning:
          "border-transparent bg-warning text-inverse hover:bg-secondary",
        info:
          "border-transparent bg-info text-inverse hover:bg-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 