import type { PropsWithChildren, ReactNode } from 'react';

/* ════════════════════════════════════════════════════════════
   LAYOUT
   ════════════════════════════════════════════════════════════ */

export function Container({ children }: PropsWithChildren) {
  return <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>;
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD
   ════════════════════════════════════════════════════════════ */

export function Card({
  children,
  className = '',
  elevated = false,
  noPadding = false,
}: PropsWithChildren<{ className?: string; elevated?: boolean; noPadding?: boolean }>) {
  return (
    <div
      className={
        'rounded-xl border border-border bg-card transition-all ' +
        (elevated ? 'shadow-md hover:shadow-lg ' : 'shadow-sm ') +
        (noPadding ? '' : 'p-5 ') +
        className
      }
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
  border = false,
}: PropsWithChildren<{ className?: string; border?: boolean }>) {
  return (
    <div
      className={
        'flex items-center justify-between gap-3 ' +
        (border ? 'border-b border-border pb-4 mb-4 ' : '') +
        className
      }
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={'mt-4 flex items-center justify-end gap-2 border-t border-border pt-4 ' + className}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: PropsWithChildren) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

export function CardValue({ children }: PropsWithChildren) {
  return (
    <div className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   STAT CARD (KPI)
   ════════════════════════════════════════════════════════════ */

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendDirection,
  accentColor = 'primary',
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  accentColor?: 'primary' | 'success' | 'danger' | 'warning';
}) {
  const iconBg = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success-light text-success',
    danger: 'bg-danger-light text-danger',
    warning: 'bg-warning-light text-warning',
  };
  const borderColor = {
    primary: 'border-l-primary',
    success: 'border-l-success',
    danger: 'border-l-danger',
    warning: 'border-l-warning',
  };
  const trendColorMap = {
    up: 'text-success bg-success-light',
    down: 'text-danger bg-danger-light',
    neutral: 'text-muted-foreground bg-muted',
  };
  const trendColor = trendDirection ? trendColorMap[trendDirection] : '';

  return (
    <Card className={'border-l-4 ' + borderColor[accentColor]} elevated>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </div>
          {subtitle && (
            <div className="mt-1.5 text-xs text-muted-foreground">{subtitle}</div>
          )}
          {trend && trendDirection && (
            <div className="mt-2 inline-flex items-center gap-1">
              <span
                className={
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ' +
                  trendColor
                }
              >
                {trendDirection === 'up' && '↑'}
                {trendDirection === 'down' && '↓'}
                {trend}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ' +
              iconBg[accentColor]
            }
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════
   BADGE (Status indicators)
   ════════════════════════════════════════════════════════════ */

export function Badge({
  children,
  variant = 'default',
  dot = false,
}: PropsWithChildren<{
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'primary';
  dot?: boolean;
}>) {
  const styles = {
    default: 'bg-muted text-muted-foreground border-border',
    success: 'bg-success-light text-success border-success/20',
    danger: 'bg-danger-light text-danger border-danger/20',
    warning: 'bg-warning-light text-warning border-warning/20',
    info: 'bg-info-light text-info border-info/20',
    primary: 'bg-primary-light text-primary border-primary/20',
  };
  const dotStyles = {
    default: 'bg-muted-foreground',
    success: 'bg-success',
    danger: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info',
    primary: 'bg-primary',
  };

  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ' +
        styles[variant]
      }
    >
      {dot && <span className={'h-1.5 w-1.5 rounded-full ' + dotStyles[variant]} />}
      {children}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   PILL (legacy compat)
   ════════════════════════════════════════════════════════════ */

export function Pill({ children }: PropsWithChildren) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   FORM CONTROLS
   ════════════════════════════════════════════════════════════ */

export function Label({
  children,
  htmlFor,
}: PropsWithChildren<{ htmlFor?: string }>) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-foreground"
    >
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        'h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition-all ' +
        'placeholder:text-muted-foreground/60 ' +
        'hover:border-muted-foreground/30 ' +
        'focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted ' +
        (props.className ?? '')
      }
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        'h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition-all ' +
        'hover:border-muted-foreground/30 ' +
        'focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted ' +
        (props.className ?? '')
      }
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={
        'min-h-[100px] w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none transition-all ' +
        'placeholder:text-muted-foreground/60 ' +
        'hover:border-muted-foreground/30 ' +
        'focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted ' +
        (props.className ?? '')
      }
    />
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full max-w-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg
          className="h-4 w-4 text-muted-foreground"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          'h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition-all ' +
          'placeholder:text-muted-foreground/60 ' +
          'hover:border-muted-foreground/30 ' +
          'focus:border-primary focus:ring-2 focus:ring-primary/20'
        }
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   BUTTONS
   ════════════════════════════════════════════════════════════ */

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
    size?: 'sm' | 'md' | 'lg';
  },
) {
  const { variant = 'primary', size = 'md', className = '', ...rest } = props;
  const sizeMap = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
  };
  const base =
    'inline-flex items-center justify-center rounded-lg font-medium transition-all ' +
    'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ' +
    sizeMap[size];
  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm',
    secondary: 'bg-card border border-border text-foreground hover:bg-muted shadow-sm',
    danger: 'bg-danger text-danger-foreground hover:bg-danger-hover shadow-sm',
    success: 'bg-success text-success-foreground hover:bg-success/90 shadow-sm',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted',
  };

  return (
    <button
      {...rest}
      className={`${base} ${variantStyles[variant]} ${className}`.trim()}
    />
  );
}

/* ════════════════════════════════════════════════════════════
   TABLE
   ════════════════════════════════════════════════════════════ */

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
};

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
}: {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}) {
  const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="finance-table w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ' +
                    (alignClass[col.align ?? 'left']) +
                    (col.className ? ' ' + col.className : '')
                  }
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="skeleton h-4 w-3/4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((row, i) => (
                  <tr
                    key={row.id ?? i}
                    onClick={() => onRowClick?.(row)}
                    className={
                      'transition-colors ' +
                      (onRowClick ? 'cursor-pointer hover:bg-primary-light/50 ' : '')
                    }
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={
                          'px-4 py-3 ' +
                          (alignClass[col.align ?? 'left']) +
                          (col.className ? ' ' + col.className : '')
                        }
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {!loading && data.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ERROR / EMPTY
   ════════════════════════════════════════════════════════════ */

export function ErrorBox({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
      <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
      {icon && <div className="text-muted-foreground/40">{icon}</div>}
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SKELETON
   ════════════════════════════════════════════════════════════ */

export function Skeleton({
  className = '',
}: {
  className?: string;
}) {
  return <div className={'skeleton ' + className} />;
}

/* ════════════════════════════════════════════════════════════
   MONEY (colour-coded finance display)
   ════════════════════════════════════════════════════════════ */

export function Money({
  amount,
  currency = 'LKR',
  colored = true,
  className = '',
}: {
  amount: number | string;
  currency?: string;
  colored?: boolean;
  className?: string;
}) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = isNaN(num) ? '—' : num.toLocaleString();
  const color = colored
    ? num > 0
      ? 'text-success'
      : num < 0
        ? 'text-danger'
        : 'text-foreground'
    : 'text-foreground';

  return (
    <span className={`tabular-nums font-semibold ${color} ${className}`}>
      {currency} {formatted}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   AVATAR
   ════════════════════════════════════════════════════════════ */

export function Avatar({
  name,
  size = 'md',
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeMap = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div
      className={
        'flex items-center justify-center rounded-full bg-primary/10 font-bold text-primary ' +
        sizeMap[size]
      }
    >
      {initial}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION DIVIDER
   ════════════════════════════════════════════════════════════ */

export function SectionTitle({
  children,
  count,
}: PropsWithChildren<{ count?: number }>) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-semibold text-foreground">{children}</h2>
      {typeof count === 'number' && (
        <Badge variant="primary">{count}</Badge>
      )}
    </div>
  );
}
