import { io as createIo, type Socket } from 'socket.io-client';
import { PROTOCOL_VERSION, type SessionToken } from '@domino/contracts';

export type GameSocket = Socket;

export function createGameSocket(serverUrl: string, sessionToken: SessionToken): GameSocket {
  return createIo(serverUrl, {
    auth: { protocolVersion: PROTOCOL_VERSION, sessionToken },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling'],
  });
}
