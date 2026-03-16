import { cn } from '../../lib/cn';

const variants = {
  default: 'bg-secondary text-secondary-foreground',
  outline: 'border border-border bg-transparent text-foreground',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  warning: 'bg-amber-50 text-amber-800 border border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border border-rose-100',
  info: 'bg-sky-50 text-sky-700 border border-sky-100'
};

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

