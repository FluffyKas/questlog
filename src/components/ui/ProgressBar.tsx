'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  segments?: number;
  color?: 'hp' | 'xp' | 'gold' | 'mana' | 'primary' | 'info' | 'error';
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorClasses = {
  hp: 'bg-hp',
  xp: 'bg-xp',
  gold: 'bg-gold',
  mana: 'bg-mana',
  primary: 'bg-primary',
  info: 'bg-info',
  error: 'bg-error',
};

const emptyColorClasses = {
  hp: 'bg-hp/20',
  xp: 'bg-xp/20',
  gold: 'bg-gold/20',
  mana: 'bg-mana/20',
  primary: 'bg-primary/20',
  info: 'bg-info/20',
  error: 'bg-error/20',
};

const sizeClasses = {
  sm: 'h-3',
  md: 'h-5',
  lg: 'h-7',
};

export function ProgressBar({
  value,
  max = 100,
  segments = 20,
  color = 'primary',
  label,
  showValue = false,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);
  const filledSegments = Math.round((percent / 100) * segments);

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              {label}
            </span>
          )}
          {showValue && (
            <span className="font-mono text-xs text-on-surface-variant">
              {Math.floor(value)} / {Math.floor(max)}
            </span>
          )}
        </div>
      )}
      <div className={`bevel-inset flex gap-[2px] p-[2px] bg-surface-lowest ${sizeClasses[size]}`}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 ${i < filledSegments ? colorClasses[color] : emptyColorClasses[color]}`}
          />
        ))}
      </div>
    </div>
  );
}
