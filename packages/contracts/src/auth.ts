import { z } from 'zod';
import { SessionTokenSchema } from './room.js';

export const SocketAuthPayloadSchema = z.object({
  protocolVersion: z.string().min(1),
  sessionToken: SessionTokenSchema,
});
export type SocketAuthPayload = z.infer<typeof SocketAuthPayloadSchema>;

export const SessionResponseSchema = z.object({
  sessionToken: SessionTokenSchema,
  issuedAt: z.number().int().positive(),
  protocolVersion: z.string().min(1),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
