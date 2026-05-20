import React from 'react';
import { cn } from '../lib/utils';

export const Button = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Button.displayName = "Button";

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border bg-white text-slate-950 shadow-sm", className)}
    {...props}
  />
));
Card.displayName = "Card";
