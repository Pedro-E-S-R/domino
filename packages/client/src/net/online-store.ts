import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type {
  End,
  ErrorPayload,
  MatchEndedEvent,
  MatchResult,
  MatchStateEvent,
  PrivatePlayerView,
  PublicMatchView,
  RoomStateEvent,
  TileId,
} from '@domino/contracts';
import { createGameSocket, type GameSocket } from './socket.js';
import { getOrCreateSession } from './session.js';

export type Screen = 'home' | 'create' | 'join' | 'lobby' | 'game' | 'end' | 'rules';

export interface OnlineState {
  screen: Screen;
  connecting: boolean;
  view: PublicMatchView | null;
  me: PrivatePlayerView | null;
  result: MatchResult | null;
  errorToast: string | null;
}

type Action =
  | { type: 'NAV'; screen: Screen }
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED' }
  | { type: 'ROOM_STATE'; view: PublicMatchView; me: PrivatePlayerView | null }
  | { type: 'MATCH_STATE'; view: PublicMatchView; me: PrivatePlayerView }
  | { type: 'MATCH_ENDED'; result: MatchResult; view: PublicMatchView }
  | { type: 'ERROR_TOAST'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_MATCH' };

const initialState: OnlineState = {
  screen: 'home',
  connecting: true,
  view: null,
  me: null,
  result: null,
  errorToast: null,
};

function reducer(state: OnlineState, action: Action): OnlineState {
  switch (action.type) {
    case 'NAV':
      return { ...state, screen: action.screen, errorToast: null };
    case 'CONNECTED':
      return { ...state, connecting: false };
    case 'DISCONNECTED':
      return { ...state, connecting: true };
    case 'ROOM_STATE': {
      const next: OnlineState = { ...state, view: action.view, me: action.me };
      if (action.view.status === 'playing' && state.screen !== 'game') next.screen = 'game';
      else if (action.view.status === 'lobby' && state.screen === 'home') next.screen = 'lobby';
      return next;
    }
    case 'MATCH_STATE': {
      const next: OnlineState = { ...state, view: action.view, me: action.me };
      if (action.view.status === 'playing' && state.screen !== 'game') next.screen = 'game';
      return next;
    }
    case 'MATCH_ENDED':
      return { ...state, view: action.view, result: action.result, screen: 'end' };
    case 'ERROR_TOAST':
      return { ...state, errorToast: action.message };
    case 'CLEAR_ERROR':
      return { ...state, errorToast: null };
    case 'CLEAR_MATCH':
      return { ...state, view: null, me: null, result: null };
  }
}

export interface OnlineActions {
  nav(screen: Screen): void;
  createMatch(opts: { mode: 'online' | 'lan'; playerCount: 2 | 4 }): void;
  joinMatch(roomCode: string): void;
  toggleReady(ready: boolean): void;
  startMatch(): void;
  leaveMatch(): void;
  layTile(tileId: TileId, end: End): void;
  drawTile(): void;
  passTurn(): void;
  dismissError(): void;
  goHome(): void;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface UseOnlineSessionOptions {
  initialScreen?: Screen;
}

export function useOnlineSession(
  serverUrl: string,
  options: UseOnlineSessionOptions = {},
): {
  state: OnlineState;
  actions: OnlineActions;
} {
  const startScreen = options.initialScreen ?? 'home';
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    screen: startScreen,
  });
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const socketRef = useRef<GameSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let s: GameSocket | null = null;
    (async () => {
      try {
        const session = await getOrCreateSession(serverUrl);
        if (cancelled) return;
        s = createGameSocket(serverUrl, session.token);
        socketRef.current = s;
        setSocket(s);
        s.on('connect', () => dispatch({ type: 'CONNECTED' }));
        s.on('disconnect', () => dispatch({ type: 'DISCONNECTED' }));
        s.on('connect_error', (err: Error) => {
          const msg = err?.message ?? 'erro desconhecido';
          dispatch({
            type: 'ERROR_TOAST',
            message: `Não conseguiu conectar em ${serverUrl}: ${msg}. Verifique o endereço do servidor.`,
          });
        });
        s.on('room:state', (evt: RoomStateEvent) =>
          dispatch({ type: 'ROOM_STATE', view: evt.view, me: evt.me }),
        );
        s.on('match:state', (evt: MatchStateEvent) =>
          dispatch({ type: 'MATCH_STATE', view: evt.view, me: evt.me }),
        );
        s.on('match:ended', (evt: MatchEndedEvent) =>
          dispatch({ type: 'MATCH_ENDED', result: evt.result, view: evt.view }),
        );
        s.on('error', (evt: ErrorPayload) => {
          if (evt.code === 'RECONNECT_WINDOW_EXPIRED') {
            dispatch({ type: 'CLEAR_MATCH' });
            dispatch({ type: 'NAV', screen: 'home' });
            dispatch({
              type: 'ERROR_TOAST',
              message: 'Você ficou ausente por muito tempo e a partida continuou sem você.',
            });
            return;
          }
          dispatch({ type: 'ERROR_TOAST', message: evt.message });
        });
      } catch (err) {
        if (!cancelled) dispatch({ type: 'ERROR_TOAST', message: `Falha de conexão: ${String(err)}` });
      }
    })();
    return () => {
      cancelled = true;
      if (s) s.disconnect();
      socketRef.current = null;
    };
  }, [serverUrl]);

  const emit = useCallback((event: string, payload: unknown) => {
    const s = socketRef.current;
    if (!s) return;
    s.emit(event, payload);
  }, []);

  const actions: OnlineActions = {
    nav: (screen) => dispatch({ type: 'NAV', screen }),
    createMatch: (opts) => {
      emit('room:create', opts);
      dispatch({ type: 'NAV', screen: 'lobby' });
    },
    joinMatch: (roomCode) => {
      emit('room:join', { roomCode });
      dispatch({ type: 'NAV', screen: 'lobby' });
    },
    toggleReady: (ready) => emit('room:ready', { ready }),
    startMatch: () => emit('room:start', {}),
    leaveMatch: () => emit('room:leave', {}),
    layTile: (tileId, end) =>
      emit('move:lay', { moveId: uuid(), tileId, end }),
    drawTile: () => emit('move:draw', { moveId: uuid() }),
    passTurn: () => emit('move:pass', { moveId: uuid() }),
    dismissError: () => dispatch({ type: 'CLEAR_ERROR' }),
    goHome: () => {
      emit('room:leave', {});
      dispatch({ type: 'CLEAR_MATCH' });
      dispatch({ type: 'NAV', screen: 'home' });
    },
  };

  return { state, actions };
}

export const _socket_unused = (s: GameSocket | null): void => void s;
