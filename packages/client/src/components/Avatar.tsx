export interface AvatarProps {
  avatarId: string;
  displayName: string;
  size?: 'sm' | 'md' | 'lg';
  connected?: boolean;
}

const PALETTE = ['#D4A574', '#1b4d2e', '#7c572d', '#45260f', '#9ed3aa', '#efbc9b'];

function colorFor(avatarId: string): string {
  let h = 0;
  for (let i = 0; i < avatarId.length; i++) {
    h = (h * 31 + avatarId.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(h) % PALETTE.length] as string;
}

function initialsFor(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '?';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

const SIZE_CLASS: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-8 h-8 text-label-sm',
  md: 'w-10 h-10 text-label-lg',
  lg: 'w-16 h-16 text-headline-md',
};

export function Avatar({ avatarId, displayName, size = 'md', connected = true }: AvatarProps): JSX.Element {
  return (
    <div
      className={`rounded-full border-2 border-secondary-fixed flex items-center justify-center text-white font-bold ${SIZE_CLASS[size]} ${connected ? '' : 'opacity-40 grayscale'}`}
      style={{ background: colorFor(avatarId) }}
      title={displayName}
      aria-label={`Avatar de ${displayName}`}
    >
      {initialsFor(displayName)}
    </div>
  );
}
