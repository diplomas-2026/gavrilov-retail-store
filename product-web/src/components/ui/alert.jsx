import { cn } from '../../lib/cn';

const variants = {
  default: 'border-border bg-card text-foreground',
  info: 'border-sky-100 bg-sky-50 text-sky-800',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-100 bg-amber-50 text-amber-900',
  danger: 'border-rose-100 bg-rose-50 text-rose-800'
};

export function Alert({ className, variant = 'default', ...props }) {
  return (
    <div className={cn('rounded-xl border p-4 text-sm shadow-sm', variants[variant], className)} {...props} />
  );
}

export function AlertTitle({ className, ...props }) {
  return <div className={cn('mb-1 font-extrabold', className)} {...props} />;
}

export function AlertDescription({ className, ...props }) {
  return <div className={cn('text-sm opacity-90', className)} {...props} />;
}

