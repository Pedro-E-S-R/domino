import { z } from 'zod';

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' as const;
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_REGEX = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

export const RoomCodeSchema = z.string().regex(ROOM_CODE_REGEX);
export type RoomCode = z.infer<typeof RoomCodeSchema>;

export const SessionTokenSchema = z.string().regex(/^[0-9a-f]{32}$/);
export type SessionToken = z.infer<typeof SessionTokenSchema>;

export const MoveIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
export type MoveId = z.infer<typeof MoveIdSchema>;

export const ModeSchema = z.enum(['online', 'lan']);
export type Mode = z.infer<typeof ModeSchema>;

export const PlayerCountSchema = z.union([z.literal(2), z.literal(4)]);
export type PlayerCount = z.infer<typeof PlayerCountSchema>;
