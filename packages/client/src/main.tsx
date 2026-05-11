import { StrictMode, useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HomeScreen } from './app/HomeScreen.js';
import { RulesScreen } from './app/RulesScreen.js';
import './styles/index.css';

type Screen = 'home' | 'rules' | 'create' | 'join' | 'lobby' | 'game' | 'end';

function App(): JSX.Element {
  const [screen, setScreen] = useState<Screen>('home');
  const goHome = useCallback(() => setScreen('home'), []);

  switch (screen) {
    case 'home':
      return (
        <HomeScreen
          onCreate={() => setScreen('create')}
          onJoin={() => setScreen('join')}
          onOffline={() => setScreen('game')}
          onRules={() => setScreen('rules')}
        />
      );
    case 'rules':
      return <RulesScreen onHome={goHome} />;
    default:
      return (
        <main className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
          <div className="text-center">
            <p className="font-body-lg text-secondary">Tela "{screen}" ainda não implementada.</p>
            <button className="mt-4 text-primary underline" onClick={goHome}>
              Voltar
            </button>
          </div>
        </main>
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
