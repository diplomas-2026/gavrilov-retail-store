import React from 'react';
import { cn } from '../../lib/cn';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

const variants = {
  default: 'bg-primary text-primary-foreground shadow-soft hover:opacity-95',
  secondary: 'bg-secondary text-secondary-foreground hover:opacity-95',
  outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
  ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-95',
  link: 'bg-transparent underline-offset-4 hover:underline text-primary'
};

const sizes = {
  sm: 'h-9 px-3',
  md: 'h-10 px-4',
  lg: 'h-11 px-5',
  icon: 'h-10 w-10 px-0'
};

export const Button = React.forwardRef(function Button(
  { className, variant = 'default', size = 'md', type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

