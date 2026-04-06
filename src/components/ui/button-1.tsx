import React from "react";
import { Spinner } from "@/components/ui/spinner-1";
import clsx from "clsx";

const sizes = [
  {
    tiny: "px-1.5 h-6 text-sm",
    small: "px-1.5 h-8 text-sm",
    medium: "px-2.5 h-10 text-sm",
    large: "px-3.5 h-12 text-base",
  },
  {
    tiny: "w-6 h-6 text-sm",
    small: "w-8 h-8 text-sm",
    medium: "w-10 h-10 text-sm",
    large: "w-12 h-12 text-base",
  },
];

const types = {
  primary:
    "bg-gray-1000 hover:bg-gray-1000-h text-background-100 fill-background-100",
  secondary:
    "bg-background-100 hover:bg-gray-alpha-200 text-gray-1000 fill-gray-1000 border border-gray-alpha-400",
  tertiary: "bg-none hover:bg-gray-alpha-200 text-gray-1000 fill-gray-1000",
  error: "bg-red-800 hover:bg-red-900 text-white fill-white",
  warning: "bg-amber-800 hover:bg-amber-850 text-black fill-black",
};

const shapes = {
  square: {
    tiny: "rounded",
    small: "rounded-md",
    medium: "rounded-md",
    large: "rounded-lg",
  },
  circle: {
    tiny: "rounded-[100%]",
    small: "rounded-[100%]",
    medium: "rounded-[100%]",
    large: "rounded-[100%]",
  },
  rounded: {
    tiny: "rounded-[100px]",
    small: "rounded-[100px]",
    medium: "rounded-[100px]",
    large: "rounded-[100px]",
  },
};

export interface ButtonProps {
  size?: keyof (typeof sizes)[0];
  type?: keyof typeof types;
  variant?: "styled" | "unstyled";
  shape?: keyof typeof shapes;
  svgOnly?: boolean;
  children?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  shadow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  ref?: React.Ref<HTMLButtonElement>;
  className?: string;
}

export const Button = ({
  size = "medium",
  type = "primary",
  variant = "styled",
  shape = "square",
  svgOnly = false,
  children,
  prefix,
  suffix,
  shadow = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  ref,
  className,
  ...rest
}: ButtonProps) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus-visible:shadow-focus-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variant === "styled" && types[type],
        variant === "styled" && sizes[svgOnly ? 1 : 0][size],
        variant === "styled" && shapes[shape][size],
        shadow && "shadow-border-small",
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? <Spinner size={16} /> : prefix}
      <span className={clsx(svgOnly && "sr-only")}>{children}</span>
      {!loading && suffix}
    </button>
  );
};
