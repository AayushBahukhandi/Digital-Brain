import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95",
  {
      variants: {
        variant: {
          default: "bg-gradient-to-r from-primary to-primary-dark text-white hover:from-primary-dark hover:to-secondary shadow-primary/25 hover:shadow-primary/40",
          destructive:
            "bg-gradient-to-r from-error to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-red-500/25 hover:shadow-red-500/40",
          outline:
            "border-2 border-slate-600 bg-slate-800/50 backdrop-blur-sm text-slate-200 hover:bg-slate-700/50 hover:border-primary hover:text-white shadow-slate-500/25 hover:shadow-primary/25",
          secondary:
            "bg-gradient-to-r from-secondary to-secondary-dark text-white hover:from-secondary-dark hover:to-accent shadow-secondary/25 hover:shadow-secondary/40",
          ghost: "hover:bg-slate-800/50 hover:text-white backdrop-blur-sm",
          link: "text-primary underline-offset-4 hover:underline hover:text-primary-hover",
        },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-lg px-4 text-sm",
        lg: "h-14 rounded-xl px-8 text-lg",
        icon: "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }