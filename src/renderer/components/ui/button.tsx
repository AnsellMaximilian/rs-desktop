import * as React from "react";
import { clsx } from "clsx";

type Variant = "default" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

const variantStyles: Record<Variant, string> = {
  default:
    "bg-emerald-400 text-slate-950 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/40 focus-visible:outline-emerald-300",
  ghost:
    "bg-white/5 text-slate-100 border border-white/10 hover:border-emerald-200/70 hover:text-white focus-visible:outline-emerald-200",
  outline:
    "border border-white/15 text-slate-100 hover:border-emerald-200/80 hover:text-white focus-visible:outline-emerald-200",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
  icon: "p-2 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(base, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
