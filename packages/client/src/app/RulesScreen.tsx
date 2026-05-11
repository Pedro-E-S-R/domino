import { BotecoButton } from '../components/BotecoButton.js';

export interface RulesScreenProps {
  onHome: () => void;
}

export function RulesScreen({ onHome }: RulesScreenProps): JSX.Element {
  return (
    <main className="min-h-screen bg-surface px-margin-mobile py-margin-mobile">
      <header className="flex items-center justify-between mb-gutter">
        <h1 className="font-sans font-black text-headline-lg text-rich-wood">Regras</h1>
        <button
          onClick={onHome}
          className="material-symbols-outlined text-rich-wood p-2 rounded-full hover:bg-rich-wood/10"
          aria-label="Voltar"
        >
          close
        </button>
      </header>

      <article className="bg-soft-cream rounded-xl border-2 border-rich-wood/30 p-margin-mobile space-y-4 text-rich-wood font-body-md">
        <section>
          <h2 className="font-headline-md text-headline-md mb-2">Peças</h2>
          <p>
            Jogamos com o conjunto duplo-seis: 28 peças, de 0-0 a 6-6. Cada jogador recebe 7
            peças no início da partida; as peças restantes formam o <em>monte</em>.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md mb-2">Quem começa</h2>
          <p>
            Quem tiver a maior dupla (6-6, 5-5...) abre a partida. Se ninguém tiver dupla,
            começa quem tiver a peça de maior soma; desempate pelo maior lado.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md mb-2">Jogada</h2>
          <p>
            Encaixe uma peça em uma das pontas, casando o valor. Duplas ficam transversais mas
            mantêm o mesmo valor nas duas pontas.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md mb-2">Comprar e passar</h2>
          <p>
            Sem jogada possível e com monte? Compre uma peça. Sem jogada e monte vazio? Passe a
            vez. Quando todos passam em sequência, é <strong>tranca</strong>.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md mb-2">Fim de jogo</h2>
          <p>
            <strong>Bate:</strong> o primeiro a zerar a mão vence.
            <br />
            <strong>Tranca:</strong> vence quem tem menor soma de pontos na mão (empate é
            possível).
          </p>
        </section>
      </article>

      <div className="mt-margin-mobile">
        <BotecoButton variant="primary" icon="home" onClick={onHome}>
          Voltar ao início
        </BotecoButton>
      </div>
    </main>
  );
}
