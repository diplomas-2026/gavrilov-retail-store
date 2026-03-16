import React from 'react';
import { cn } from '../../lib/cn';

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-24 w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});

