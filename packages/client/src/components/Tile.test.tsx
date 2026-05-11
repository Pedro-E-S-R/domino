import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { findTileByPips } from '@domino/engine';
import { Board } from './Board.js';
import { Hand } from './Hand.js';
import { Tile } from './Tile.js';
import { boardLayoutFor } from './boardLayout.js';

function tileNode(container: HTMLElement, tileId: number): HTMLElement | null {
  return container.querySelector<HTMLElement>(`[data-tile-id="${tileId}"]`);
}

describe('boardLayoutFor', () => {
  it('returns "vertical" for every double', () => {
    for (let v = 0; v <= 6; v++) {
      const id = findTileByPips(v as 0, v as 0).id;
      expect(boardLayoutFor(id)).toBe('vertical');
    }
  });

  it('returns "horizontal" for non-doubles', () => {
    expect(boardLayoutFor(findTileByPips(0, 1).id)).toBe('horizontal');
    expect(boardLayoutFor(findTileByPips(3, 5).id)).toBe('horizontal');
    expect(boardLayoutFor(findTileByPips(4, 6).id)).toBe('horizontal');
  });
});

describe('Board tile orientation on the table', () => {
  it('renders a non-double tile (6-4) horizontally — no "vertical" layout attr', () => {
    const tileId = findTileByPips(6, 4).id;
    const { container } = render(
      <Board
        board={[{ tileId, orientation: 'normal' }]}
        leftEnd={4}
        rightEnd={6}
      />,
    );
    const node = tileNode(container, tileId);
    expect(node).not.toBeNull();
    expect(node?.getAttribute('data-layout')).toBe('horizontal');
    expect(node?.getAttribute('data-layout')).not.toBe('vertical');
  });

  it('renders a double tile (6-6) vertically — transversal — on the board', () => {
    const tileId = findTileByPips(6, 6).id;
    const { container } = render(
      <Board
        board={[{ tileId, orientation: 'normal' }]}
        leftEnd={6}
        rightEnd={6}
      />,
    );
    const node = tileNode(container, tileId);
    expect(node).not.toBeNull();
    expect(node?.getAttribute('data-layout')).toBe('vertical');
  });

  it('renders the highest double (6-6) as the opening tile vertically', () => {
    const tileId = findTileByPips(6, 6).id;
    const { container } = render(
      <Board
        board={[{ tileId, orientation: 'normal' }]}
        leftEnd={6}
        rightEnd={6}
      />,
    );
    expect(tileNode(container, tileId)?.getAttribute('data-layout')).toBe('vertical');
  });

  it('renders a mixed chain with doubles vertical and non-doubles horizontal', () => {
    const sixFour = findTileByPips(6, 4).id;
    const sixSix = findTileByPips(6, 6).id;
    const fourTwo = findTileByPips(4, 2).id;
    const { container } = render(
      <Board
        board={[
          { tileId: sixFour, orientation: 'normal' },
          { tileId: sixSix, orientation: 'normal' },
          { tileId: fourTwo, orientation: 'normal' },
        ]}
        leftEnd={6}
        rightEnd={2}
      />,
    );
    expect(tileNode(container, sixFour)?.getAttribute('data-layout')).toBe('horizontal');
    expect(tileNode(container, sixSix)?.getAttribute('data-layout')).toBe('vertical');
    expect(tileNode(container, fourTwo)?.getAttribute('data-layout')).toBe('horizontal');
  });
});

describe('Hand tile orientation in the player hand', () => {
  it('renders a double (5-5) in the hand horizontally — never vertical', () => {
    const tileId = findTileByPips(5, 5).id;
    const { container } = render(<Hand hand={[tileId]} legalMoves={[]} disabled />);
    const node = tileNode(container, tileId);
    expect(node).not.toBeNull();
    expect(node?.getAttribute('data-layout')).toBe('horizontal');
    expect(node?.getAttribute('data-layout')).not.toBe('vertical');
  });

  it('renders a non-double (3-1) in the hand horizontally', () => {
    const tileId = findTileByPips(3, 1).id;
    const { container } = render(<Hand hand={[tileId]} legalMoves={[]} disabled />);
    expect(tileNode(container, tileId)?.getAttribute('data-layout')).toBe('horizontal');
  });

  it('mixes doubles and non-doubles in the hand — all stay horizontal', () => {
    const ids = [
      findTileByPips(6, 6).id,
      findTileByPips(5, 5).id,
      findTileByPips(3, 1).id,
      findTileByPips(0, 0).id,
    ];
    const { container } = render(<Hand hand={ids} legalMoves={[]} disabled />);
    for (const id of ids) {
      expect(tileNode(container, id)?.getAttribute('data-layout')).toBe('horizontal');
    }
  });
});

describe('Tile layout default and explicit overrides', () => {
  it('defaults to horizontal layout when no layout prop is passed', () => {
    const tileId = findTileByPips(6, 6).id;
    const { container } = render(<Tile tileId={tileId} />);
    expect(tileNode(container, tileId)?.getAttribute('data-layout')).toBe('horizontal');
  });

  it('respects an explicit vertical layout prop', () => {
    const tileId = findTileByPips(6, 4).id;
    const { container } = render(<Tile tileId={tileId} layout="vertical" />);
    expect(tileNode(container, tileId)?.getAttribute('data-layout')).toBe('vertical');
  });
});
