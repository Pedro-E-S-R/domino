import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CreateMatchScreen } from './app/CreateMatchScreen.js';
import { EndScreen } from './app/EndScreen.js';
import { GameScreen, type GameIntent } from './app/GameScreen.js';
import { HomeScreen } from './app/HomeScreen.js';
import { JoinMatchScreen } from './app/JoinMatchScreen.js';
import { LobbyScreen } from './app/LobbyScreen.js';
import { RulesScreen } from './app/RulesScreen.js';
import { useOnlineSession } from './net/online-store.js';
import type { PublicMatchView } from '@domino/contracts';
import './styles/index.css';

const SERVER_URL =
  (import.meta.env['VITE_SERVER_URL'] as string | undefined) ?? 'http://localhost:4123';

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

function App(): JSX.Element {
  const { state, actions } = useOnlineSession(SERVER_URL);
  let body: JSX.Element;
  switch (state.screen) {
    case 'home':
      body = (
        <HomeScreen
          onCreate={() => actions.nav('create')}
          onJoin={() => actions.nav('join')}
          onOffline={() => actions.nav('game')}
          onRules={() => actions.nav('rules')}
        />
      );
      break;
    case 'rules':
      body = <RulesScreen onHome={() => actions.nav('home')} />;
      break;
    case 'create':
      body = (
        <CreateMatchScreen
          onCreate={(opts) => actions.createMatch(opts)}
          onBack={() => actions.nav('home')}
        />
      );
      break;
    case 'join':
      body = (
        <JoinMatchScreen
          onJoin={(code) => actions.joinMatch(code)}
          onBack={() => actions.nav('home')}
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
            onLeave={actions.goHome}
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
            onRematch={actions.goHome}
            onHome={actions.goHome}
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

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('No #root element');
}
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
