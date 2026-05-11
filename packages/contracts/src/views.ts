import { z } from 'zod';
import { ModeSchema, PlayerCountSchema, RoomCodeSchema } from './room.js';

export const PipValueSchema = z
  .number()
  .int()
  .min(0)
  .max(6) as z.ZodType<0 | 1 | 2 | 3 | 4 | 5 | 6>;
export type PipValue = z.infer<typeof PipValueSchema>;

export const TileIdSchema = z.number().int().min(0).max(27);
export type TileId = z.infer<typeof TileIdSchema>;

export const SeatSchema = z.number().int().min(0).max(3) as z.ZodType<0 | 1 | 2 | 3>;
export type Seat = z.infer<typeof SeatSchema>;

export const EndSchema = z.enum(['left', 'right']);
export type End = z.infer<typeof EndSchema>;

export const PlayerSummarySchema = z.object({
  seat: SeatSchema,
  displayName: z.string().min(1).max(40),
  avatarId: z.string().min(1).max(40),
  connected: z.boolean(),
  handCount: z.number().int().min(0).max(28),
  ready: z.boolean().optional(),
});
export type PlayerSummary = z.infer<typeof PlayerSummarySchema>;

export const LaidTileSchema = z.object({
  tileId: TileIdSchema,
  orientation: z.enum(['normal', 'flipped']),
});
export type LaidTile = z.infer<typeof LaidTileSchema>;

export const OutcomeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('domino'), winner: SeatSchema }),
  z.object({ kind: z.literal('block'), winner: SeatSchema }),
  z.object({ kind: z.literal('tied-block'), tied: z.array(SeatSchema).min(2) }),
]);
export type Outcome = z.infer<typeof OutcomeSchema>;

export const MatchResultSchema = z.object({
  outcome: OutcomeSchema,
  pipsBySeat: z.array(z.number().int().min(0)).min(2).max(4),
});
export type MatchResult = z.infer<typeof MatchResultSchema>;

export const StatusSchema = z.enum(['lobby', 'playing', 'ended']);
export type MatchStatus = z.infer<typeof StatusSchema>;

export const PublicMatchViewSchema = z
  .object({
    roomCode: RoomCodeSchema,
    mode: ModeSchema,
    playerCount: PlayerCountSchema,
    status: StatusSchema,
    players: z.array(PlayerSummarySchema).min(0).max(4),
    board: z.array(LaidTileSchema),
    leftEnd: PipValueSchema.nullable(),
    rightEnd: PipValueSchema.nullable(),
    boneyardCount: z.number().int().min(0).max(28),
    currentSeat: SeatSchema.nullable(),
    turnDeadlineMs: z.number().int().positive().nullable(),
    result: MatchResultSchema.nullable(),
  })
  .strict();
export type PublicMatchView = z.infer<typeof PublicMatchViewSchema>;

export const LegalMoveSchema = z.object({
  tileId: TileIdSchema,
  ends: z.array(EndSchema).min(1).max(2),
});
export type LegalMove = z.infer<typeof LegalMoveSchema>;

export const PrivatePlayerViewSchema = z
  .object({
    mySeat: SeatSchema,
    myHand: z.array(TileIdSchema).min(0).max(28),
    legalMoves: z.array(LegalMoveSchema),
  })
  .strict();
export type PrivatePlayerView = z.infer<typeof PrivatePlayerViewSchema>;
