import { z } from 'zod';
import { ModeSchema, MoveIdSchema, PlayerCountSchema, RoomCodeSchema } from './room.js';
import { EndSchema, MatchResultSchema, PrivatePlayerViewSchema, PublicMatchViewSchema, SeatSchema, TileIdSchema } from './views.js';
import { ErrorPayloadSchema } from './errors.js';

export const RoomCreatePayloadSchema = z.object({
  mode: ModeSchema,
  playerCount: PlayerCountSchema,
});
export type RoomCreatePayload = z.infer<typeof RoomCreatePayloadSchema>;

export const RoomJoinPayloadSchema = z.object({
  roomCode: RoomCodeSchema,
});
export type RoomJoinPayload = z.infer<typeof RoomJoinPayloadSchema>;

export const RoomReadyPayloadSchema = z.object({
  ready: z.boolean(),
});
export type RoomReadyPayload = z.infer<typeof RoomReadyPayloadSchema>;

export const RoomLeavePayloadSchema = z.object({}).strict();
export type RoomLeavePayload = z.infer<typeof RoomLeavePayloadSchema>;

export const RoomStartPayloadSchema = z.object({}).strict();
export type RoomStartPayload = z.infer<typeof RoomStartPayloadSchema>;

export const RoomRematchPayloadSchema = z.object({}).strict();
export type RoomRematchPayload = z.infer<typeof RoomRematchPayloadSchema>;

export const MoveLayPayloadSchema = z.object({
  moveId: MoveIdSchema,
  tileId: TileIdSchema,
  end: EndSchema,
});
export type MoveLayPayload = z.infer<typeof MoveLayPayloadSchema>;

export const MoveDrawPayloadSchema = z.object({
  moveId: MoveIdSchema,
});
export type MoveDrawPayload = z.infer<typeof MoveDrawPayloadSchema>;

export const MovePassPayloadSchema = z.object({
  moveId: MoveIdSchema,
});
export type MovePassPayload = z.infer<typeof MovePassPayloadSchema>;

export const ClientToServerEvents = {
  'room:create': RoomCreatePayloadSchema,
  'room:join': RoomJoinPayloadSchema,
  'room:ready': RoomReadyPayloadSchema,
  'room:leave': RoomLeavePayloadSchema,
  'room:start': RoomStartPayloadSchema,
  'room:rematch': RoomRematchPayloadSchema,
  'move:lay': MoveLayPayloadSchema,
  'move:draw': MoveDrawPayloadSchema,
  'move:pass': MovePassPayloadSchema,
} as const;
export type ClientToServerEventName = keyof typeof ClientToServerEvents;

export const RoomStateEventSchema = z
  .object({
    view: PublicMatchViewSchema,
    me: PrivatePlayerViewSchema.nullable(),
  })
  .strict();
export type RoomStateEvent = z.infer<typeof RoomStateEventSchema>;

export const MatchStartedEventSchema = z
  .object({
    opener: SeatSchema,
    turnDeadlineMs: z.number().int().positive(),
  })
  .strict();
export type MatchStartedEvent = z.infer<typeof MatchStartedEventSchema>;

export const LastActionSchema = z
  .object({
    actor: SeatSchema,
    kind: z.enum(['LAY', 'DRAW', 'PASS']),
    tileId: TileIdSchema.optional(),
    end: EndSchema.optional(),
  })
  .strict();
export type LastAction = z.infer<typeof LastActionSchema>;

export const MatchStateEventSchema = z
  .object({
    view: PublicMatchViewSchema,
    me: PrivatePlayerViewSchema,
    lastAction: LastActionSchema.nullable(),
  })
  .strict();
export type MatchStateEvent = z.infer<typeof MatchStateEventSchema>;

export const MatchTurnEventSchema = z
  .object({
    currentSeat: SeatSchema,
    turnDeadlineMs: z.number().int().positive(),
  })
  .strict();
export type MatchTurnEvent = z.infer<typeof MatchTurnEventSchema>;

export const MatchEndedEventSchema = z
  .object({
    result: MatchResultSchema,
    view: PublicMatchViewSchema,
  })
  .strict();
export type MatchEndedEvent = z.infer<typeof MatchEndedEventSchema>;

export const ServerToClientEvents = {
  'room:state': RoomStateEventSchema,
  'match:started': MatchStartedEventSchema,
  'match:state': MatchStateEventSchema,
  'match:turn': MatchTurnEventSchema,
  'match:ended': MatchEndedEventSchema,
  error: ErrorPayloadSchema,
} as const;
export type ServerToClientEventName = keyof typeof ServerToClientEvents;
