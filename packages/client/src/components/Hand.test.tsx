import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { findTileByPips } from '@domino/engine';
import { Hand } from './Hand.js';

afterEach(() => cleanup());

describe('Hand — choosing the end when a tile fits both sides', () => {
  it('plays immediately when there is only one legal end', () => {
    const onPlay = vi.fn();
    const tileId = findTileByPips(0, 3).id;
    const { container } = render(
      <Hand
        hand={[tileId]}
        legalMoves={[{ tileId, ends: ['left'] }]}
        onPlay={onPlay}
        leftEnd={0}
        rightEnd={5}
      />,
    );
    const tileNode = container.querySelector<HTMLElement>(`[data-tile-id="${tileId}"]`);
    expect(tileNode).not.toBeNull();
    fireEvent.click(tileNode!);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledWith(tileId, 'left');
    expect(screen.queryByTestId('end-choice-dialog')).toBeNull();
  });

  it('opens the choice dialog when the tile fits both ends', () => {
    const onPlay = vi.fn();
    const tileId = findTileByPips(5, 3).id;
    const { container } = render(
      <Hand
        hand={[tileId]}
        legalMoves={[{ tileId, ends: ['left', 'right'] }]}
        onPlay={onPlay}
        leftEnd={5}
        rightEnd={3}
      />,
    );
    fireEvent.click(container.querySelector<HTMLElement>(`[data-tile-id="${tileId}"]`)!);
    expect(onPlay).not.toHaveBeenCalled();
    const dialog = screen.getByTestId('end-choice-dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toMatch(/3-5/);
    expect(dialog.textContent).toMatch(/Esquerda \(5\)/);
    expect(dialog.textContent).toMatch(/Direita \(3\)/);
  });

  it('chooses "Esquerda" → calls onPlay with end=left and dismisses dialog', () => {
    const onPlay = vi.fn();
    const tileId = findTileByPips(5, 3).id;
    const { container } = render(
      <Hand
        hand={[tileId]}
        legalMoves={[{ tileId, ends: ['left', 'right'] }]}
        onPlay={onPlay}
        leftEnd={5}
        rightEnd={3}
      />,
    );
    fireEvent.click(container.querySelector<HTMLElement>(`[data-tile-id="${tileId}"]`)!);
    fireEvent.click(screen.getByText(/Esquerda \(5\)/));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledWith(tileId, 'left');
    expect(screen.queryByTestId('end-choice-dialog')).toBeNull();
  });

  it('chooses "Direita" → calls onPlay with end=right and dismisses dialog', () => {
    const onPlay = vi.fn();
    const tileId = findTileByPips(5, 3).id;
    const { container } = render(
      <Hand
        hand={[tileId]}
        legalMoves={[{ tileId, ends: ['left', 'right'] }]}
        onPlay={onPlay}
        leftEnd={5}
        rightEnd={3}
      />,
    );
    fireEvent.click(container.querySelector<HTMLElement>(`[data-tile-id="${tileId}"]`)!);
    fireEvent.click(screen.getByText(/Direita \(3\)/));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledWith(tileId, 'right');
    expect(screen.queryByTestId('end-choice-dialog')).toBeNull();
  });

  it('cancels without calling onPlay', () => {
    const onPlay = vi.fn();
    const tileId = findTileByPips(5, 3).id;
    const { container } = render(
      <Hand
        hand={[tileId]}
        legalMoves={[{ tileId, ends: ['left', 'right'] }]}
        onPlay={onPlay}
        leftEnd={5}
        rightEnd={3}
      />,
    );
    fireEvent.click(container.querySelector<HTMLElement>(`[data-tile-id="${tileId}"]`)!);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onPlay).not.toHaveBeenCalled();
    expect(screen.queryByTestId('end-choice-dialog')).toBeNull();
  });

  it('does not open the dialog when the hand is disabled', () => {
    const onPlay = vi.fn();
    const tileId = findTileByPips(5, 3).id;
    const { container } = render(
      <Hand
        hand={[tileId]}
        legalMoves={[{ tileId, ends: ['left', 'right'] }]}
        onPlay={onPlay}
        disabled
        leftEnd={5}
        rightEnd={3}
      />,
    );
    fireEvent.click(container.querySelector<HTMLElement>(`[data-tile-id="${tileId}"]`)!);
    expect(onPlay).not.toHaveBeenCalled();
    expect(screen.queryByTestId('end-choice-dialog')).toBeNull();
  });
});
