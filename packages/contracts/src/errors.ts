import { z } from 'zod';

export const ErrorCodeSchema = z.enum([
  'PROTOCOL_MISMATCH',
  'INVALID_PAYLOAD',
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'ROOM_IN_PROGRESS',
  'NOT_HOST',
  'NOT_YOUR_TURN',
  'ILLEGAL_MOVE',
  'NOT_IN_MATCH',
  'MATCH_ENDED',
  'HOST_DISCONNECTED',
  'RECONNECT_WINDOW_EXPIRED',
  'INTERNAL',
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ErrorPayloadSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string().min(1).max(500),
  detail: z.record(z.unknown()).optional(),
});
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;
