import type { ReactNode } from 'react';

export type BotecoButtonVariant = 'primary' | 'secondary' | 'wood';

export interface BotecoButtonProps {
  variant?: BotecoButtonVariant;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<BotecoButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-primary-container to-primary border-b-4 border-[#00210e] text-white',
  secondary:
    'bg-gradient-to-b from-[#E5B584] to-amber-gold border-b-4 border-[#A67C4E] text-white',
  wood:
    'bg-gradient-to-b from-tertiary-container to-tertiary border-b-4 border-[#2f1502] text-secondary-fixed',
};

export function BotecoButton({
  variant = 'secondary',
  icon,
  onClick,
  disabled,
  children,
  type = 'button',
  fullWidth = true,
}: BotecoButtonProps): JSX.Element {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'py-5 rounded-xl shadow-lg flex items-center justify-center gap-3 font-bold text-headline-md transition-all btn-active',
        fullWidth ? 'w-full' : '',
        VARIANT_CLASS[variant],
        disabled ? 'opacity-40 cursor-not-allowed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon ? <span className="material-symbols-outlined">{icon}</span> : null}
      {children}
    </button>
  );
}
