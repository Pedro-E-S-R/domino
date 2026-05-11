import { BotecoButton } from '../components/BotecoButton.js';

export interface HomeScreenProps {
  onCreate: () => void;
  onJoin: () => void;
  onOffline: () => void;
  onRules: () => void;
  onServerConfig: () => void;
  serverLabel: string;
}

export function HomeScreen({
  onCreate,
  onJoin,
  onOffline,
  onRules,
  onServerConfig,
  serverLabel,
}: HomeScreenProps): JSX.Element {
  return (
    <main className="relative z-10 flex flex-col items-center justify-center px-margin-mobile pt-10 pb-24 min-h-screen">
      <div className="mb-12 flex flex-col items-center">
        <div className="w-32 h-32 mb-6 rounded-full bg-rich-wood text-amber-gold flex items-center justify-center shadow-xl">
          <span className="material-symbols-outlined" style={{ fontSize: 72 }}>
            casino
          </span>
        </div>
        <h1 className="font-sans font-black text-display-lg text-rich-wood tracking-tight drop-shadow-sm">
          Dominó
        </h1>
        <p className="font-sans text-body-lg text-secondary italic opacity-80">
          A tradição do boteco na sua tela
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-5">
        <BotecoButton variant="secondary" icon="add_circle" onClick={onCreate}>
          Criar Partida
        </BotecoButton>
        <BotecoButton variant="secondary" icon="meeting_room" onClick={onJoin}>
          Entrar em Partida
        </BotecoButton>
        <BotecoButton variant="primary" icon="sports_esports" onClick={onOffline}>
          Jogar Offline
        </BotecoButton>
      </div>

      <button
        onClick={onRules}
        className="mt-8 text-secondary font-label-lg hover:underline transition-all flex items-center gap-2"
      >
        <span className="material-symbols-outlined">menu_book</span>
        Como jogar
      </button>

      <button
        onClick={onServerConfig}
        className="mt-3 text-rich-wood/70 text-label-sm hover:text-rich-wood transition-all flex items-center gap-1 font-mono"
        aria-label="Configurar servidor"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>dns</span>
        {serverLabel}
      </button>
    </main>
  );
}
