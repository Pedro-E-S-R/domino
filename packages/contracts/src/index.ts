export { PROTOCOL_VERSION } from './version.js';
export type { ProtocolVersion } from './version.js';

export {
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  ROOM_CODE_REGEX,
  RoomCodeSchema,
  SessionTokenSchema,
  MoveIdSchema,
  ModeSchema,
  PlayerCountSchema,
} from './room.js';
export type { RoomCode, SessionToken, MoveId, Mode, PlayerCount } from './room.js';

export {
  PipValueSchema,
  TileIdSchema,
  SeatSchema,
  EndSchema,
  PlayerSummarySchema,
  LaidTileSchema,
  OutcomeSchema,
  MatchResultSchema,
  StatusSchema,
  PublicMatchViewSchema,
  LegalMoveSchema,
  PrivatePlayerViewSchema,
} from './views.js';
export type {
  PipValue,
  TileId,
  Seat,
  End,
  PlayerSummary,
  LaidTile,
  Outcome,
  MatchResult,
  MatchStatus,
  PublicMatchView,
  LegalMove,
  PrivatePlayerView,
} from './views.js';

export { ErrorCodeSchema, ErrorPayloadSchema } from './errors.js';
export type { ErrorCode, ErrorPayload } from './errors.js';

export { SocketAuthPayloadSchema, SessionResponseSchema } from './auth.js';
export type { SocketAuthPayload, SessionResponse } from './auth.js';

export {
  RoomCreatePayloadSchema,
  RoomJoinPayloadSchema,
  RoomReadyPayloadSchema,
  RoomLeavePayloadSchema,
  RoomStartPayloadSchema,
  MoveLayPayloadSchema,
  MoveDrawPayloadSchema,
  MovePassPayloadSchema,
  ClientToServerEvents,
  RoomStateEventSchema,
  MatchStartedEventSchema,
  MatchStateEventSchema,
  MatchTurnEventSchema,
  MatchEndedEventSchema,
  LastActionSchema,
  ServerToClientEvents,
} from './events.js';
export type {
  RoomCreatePayload,
  RoomJoinPayload,
  RoomReadyPayload,
  RoomLeavePayload,
  RoomStartPayload,
  MoveLayPayload,
  MoveDrawPayload,
  MovePassPayload,
  ClientToServerEventName,
  RoomStateEvent,
  MatchStartedEvent,
  MatchStateEvent,
  MatchTurnEvent,
  MatchEndedEvent,
  LastAction,
  ServerToClientEventName,
} from './events.js';
