'use client';

type BadgeVariant = 'xp' | 'gold' | 'stat' | 'level' | 'default';

const variantClasses: Record<BadgeVariant, string> = {
  xp: 'bg-xp/20 text-xp border-xp/40',
  gold: 'bg-gold/20 text-gold border-gold/40',
  stat: 'bg-mana/20 text-mana border-mana/40',
  level: 'bg-primary/20 text-primary border-primary/40',
  default: 'bg-surface-high text-on-surface-variant border-outline-variant',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5
      font-mono text-xs border
      ${variantClasses[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
}
