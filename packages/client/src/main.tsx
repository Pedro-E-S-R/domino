import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { PlayerCount, PublicMatchView } from '@domino/contracts';
import { CreateMatchScreen } from './app/CreateMatchScreen.js';
import { EndScreen } from './app/EndScreen.js';
import { GameScreen, type GameIntent } from './app/GameScreen.js';
import { HomeScreen } from './app/HomeScreen.js';
import { JoinMatchScreen } from './app/JoinMatchScreen.js';
import { LobbyScreen } from './app/LobbyScreen.js';
import { OfflineSetupScreen } from './app/OfflineSetupScreen.js';
import { RulesScreen } from './app/RulesScreen.js';
import { useOnlineSession } from './net/online-store.js';
import { useOfflineGame } from './offline/useOfflineGame.js';
import './styles/index.css';

const SERVER_URL =
  (import.meta.env['VITE_SERVER_URL'] as string | undefined) ?? 'http://localhost:4123';

type AppMode =
  | { kind: 'home' }
  | { kind: 'rules' }
  | { kind: 'online' }
  | { kind: 'offline-setup' }
  | { kind: 'offline-game'; playerCount: PlayerCount; nonce: number };

function ErrorToast({ message, onDismiss }: { message: string; onDismiss(): void }): JSX.Element {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-error text-on-error font-label-lg rounded-lg shadow-lg px-gutter py-2 flex items-center gap-3 max-w-[90vw]">
      <span className="material-symbols-outlined">error</span>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="material-symbols-outlined hover:opacity-80"
        aria-label="Dispensar"
      >
        close
      </button>
    </div>
  );
}

function amHostOf(view: PublicMatchView): boolean {
  return view.players[0]?.seat === 0;
}

function amReadyIn(view: PublicMatchView): boolean {
  return view.players[0]?.ready === true;
}

function OnlineApp({ onLeaveOnline }: { onLeaveOnline(): void }): JSX.Element {
  const { state, actions } = useOnlineSession(SERVER_URL);

  let body: JSX.Element;
  switch (state.screen) {
    case 'home':
      body = (
        <main className="min-h-screen flex items-center justify-center text-rich-wood">
          <button onClick={onLeaveOnline} className="text-primary underline font-label-lg">
            Voltar ao início
          </button>
        </main>
      );
      break;
    case 'rules':
      body = <RulesScreen onHome={onLeaveOnline} />;
      break;
    case 'create':
      body = (
        <CreateMatchScreen
          onCreate={(opts) => actions.createMatch(opts)}
          onBack={onLeaveOnline}
        />
      );
      break;
    case 'join':
      body = (
        <JoinMatchScreen
          onJoin={(code) => actions.joinMatch(code)}
          onBack={onLeaveOnline}
        />
      );
      break;
    case 'lobby':
      if (!state.view) {
        body = (
          <main className="min-h-screen flex items-center justify-center text-rich-wood">
            <span className="font-body-lg italic">Aguardando sala…</span>
          </main>
        );
      } else {
        body = (
          <LobbyScreen
            view={state.view}
            mySessionToken={null}
            amHost={amHostOf(state.view)}
            amReady={amReadyIn(state.view)}
            onToggleReady={actions.toggleReady}
            onStart={actions.startMatch}
            onLeave={() => {
              actions.leaveMatch();
              onLeaveOnline();
            }}
          />
        );
      }
      break;
    case 'game': {
      if (!state.view || !state.me) {
        body = (
          <main className="min-h-screen flex items-center justify-center text-rich-wood">
            <span className="font-body-lg italic">Carregando partida…</span>
          </main>
        );
      } else {
        const onIntent = (intent: GameIntent): void => {
          if (intent.type === 'LAY') actions.layTile(intent.tileId, intent.end);
          else if (intent.type === 'DRAW') actions.drawTile();
          else actions.passTurn();
        };
        body = <GameScreen view={state.view} me={state.me} onIntent={onIntent} />;
      }
      break;
    }
    case 'end':
      if (!state.result || !state.view) {
        body = (
          <main className="min-h-screen flex items-center justify-center text-rich-wood">
            <span className="font-body-lg italic">Carregando resultado…</span>
          </main>
        );
      } else {
        body = (
          <EndScreen
            result={state.result}
            players={state.view.players}
            canRematch={false}
            onRematch={onLeaveOnline}
            onHome={onLeaveOnline}
          />
        );
      }
      break;
  }
  return (
    <>
      {body}
      {state.errorToast && (
        <ErrorToast message={state.errorToast} onDismiss={actions.dismissError} />
      )}
    </>
  );
}

function OfflineApp({
  playerCount,
  nonce,
  onRestart,
  onHome,
}: {
  playerCount: PlayerCount;
  nonce: number;
  onRestart(): void;
  onHome(): void;
}): JSX.Element {
  void nonce;
  const { snapshot, layTile, drawTile, passTurn } = useOfflineGame(playerCount);

  if (snapshot.result !== null) {
    return (
      <EndScreen
        result={snapshot.result}
        players={snapshot.view.players}
        canRematch
        onRematch={onRestart}
        onHome={onHome}
      />
    );
  }

  const onIntent = (intent: GameIntent): void => {
    if (intent.type === 'LAY') layTile(intent.tileId, intent.end);
    else if (intent.type === 'DRAW') drawTile();
    else passTurn();
  };
  return <GameScreen view={snapshot.view} me={snapshot.me} onIntent={onIntent} />;
}

function App(): JSX.Element {
  const [mode, setMode] = useState<AppMode>({ kind: 'home' });
  const [onlineEntry, setOnlineEntry] = useState<'create' | 'join'>('create');
  void onlineEntry;

  switch (mode.kind) {
    case 'home':
      return (
        <HomeScreen
          onCreate={() => {
            setOnlineEntry('create');
            setMode({ kind: 'online' });
          }}
          onJoin={() => {
            setOnlineEntry('join');
            setMode({ kind: 'online' });
          }}
          onOffline={() => setMode({ kind: 'offline-setup' })}
          onRules={() => setMode({ kind: 'rules' })}
        />
      );
    case 'rules':
      return <RulesScreen onHome={() => setMode({ kind: 'home' })} />;
    case 'online':
      return <OnlineApp onLeaveOnline={() => setMode({ kind: 'home' })} />;
    case 'offline-setup':
      return (
        <OfflineSetupScreen
          onStart={(playerCount) =>
            setMode({ kind: 'offline-game', playerCount, nonce: Date.now() })
          }
          onBack={() => setMode({ kind: 'home' })}
        />
      );
    case 'offline-game':
      return (
        <OfflineApp
          playerCount={mode.playerCount}
          nonce={mode.nonce}
          onRestart={() =>
            setMode({ kind: 'offline-game', playerCount: mode.playerCount, nonce: Date.now() })
          }
          onHome={() => setMode({ kind: 'home' })}
        />
      );
  }
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('No #root element');
}
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
