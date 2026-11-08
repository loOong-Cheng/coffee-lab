import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DIAGRAM_PARTS } from '../../domain/contracts';
import { ESPRESSO_PINS, ESPRESSO_VIEWBOX, EspressoStationDiagram } from './EspressoStationDiagram';
import { POUROVER_PINS, POUROVER_VIEWBOX, PourOverStationDiagram } from './PourOverStationDiagram';

describe('station diagrams: one hotspot per contract part', () => {
  it.each([
    ['espresso-station', ESPRESSO_PINS],
    ['pourover-station', POUROVER_PINS],
  ] as const)('%s pins match DIAGRAM_PARTS exactly', (id, pins) => {
    expect(pins.map((p) => p.id).sort()).toEqual([...DIAGRAM_PARTS[id]].sort());
  });

  it.each([
    ['espresso', ESPRESSO_PINS, ESPRESSO_VIEWBOX],
    ['pourover', POUROVER_PINS, POUROVER_VIEWBOX],
  ] as const)('%s pins stay ≥44px apart when the diagram is only 340px wide (phone)', (_n, pins, vb) => {
    const scale = 340 / vb.width;
    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        const a = pins[i]!.pin;
        const b = pins[j]!.pin;
        const chebyshev = Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) * scale;
        expect(chebyshev, `${pins[i]!.id} vs ${pins[j]!.id}`).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

describe('EspressoStationDiagram', () => {
  it('explore mode: labelled, keyboard-focusable hotspots that select parts', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EspressoStationDiagram mode="explore" locale="en" onSelectPart={onSelect} selected="tamper" />);
    const list = screen.getByRole('list', { name: 'Parts' });
    const buttons = within(list).getAllByRole('button');
    expect(buttons).toHaveLength(DIAGRAM_PARTS['espresso-station'].length);
    // Label in name (WCAG 2.5.3): the visible pin number + name chip, e.g. "3 Group head".
    expect(screen.getByRole('button', { name: /^\d+ Group head$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^\d+ Tamper$/ })).toHaveAttribute('aria-pressed', 'true');

    await user.tab();
    expect(buttons[0]).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(buttons[1]).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(buttons[1]!.getAttribute('data-part'));

    await user.click(screen.getByRole('button', { name: /^\d+ Steam wand$/ }));
    expect(onSelect).toHaveBeenLastCalledWith('steam-wand');
  });

  it('quiz mode hides names in accessible labels until revealed', () => {
    render(
      <EspressoStationDiagram
        mode="quiz"
        locale="en"
        revealed={['portafilter']}
        incorrect={['cup']}
        onSelectPart={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Group head' })).not.toBeInTheDocument();
    const idx = ESPRESSO_PINS.findIndex((p) => p.id === 'group-head') + 1;
    expect(screen.getByRole('button', { name: `Part ${idx}` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Portafilter \(identified\)/ })).toBeInTheDocument();
    // No visible label leaks the answer either.
    expect(screen.queryByText('Group head')).not.toBeInTheDocument();
  });

  it('uses custom labels and Chinese defaults', () => {
    const { unmount } = render(<EspressoStationDiagram mode="explore" locale="zh" />);
    expect(screen.getByRole('button', { name: /^\d+ 冲煮头$/ })).toBeInTheDocument();
    expect(screen.getByRole('figure', { name: '意式咖啡工作台示意图' })).toBeInTheDocument();
    unmount();
    render(<EspressoStationDiagram mode="explore" labels={{ cup: 'Demitasse' }} />);
    expect(screen.getByRole('button', { name: /^\d+ Demitasse$/ })).toBeInTheDocument();
  });
});

describe('PourOverStationDiagram', () => {
  it('selects parts by click and exposes all 8 hotspots', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PourOverStationDiagram mode="explore" locale="en" onSelectPart={onSelect} highlighted={['dripper']} />);
    expect(screen.getAllByRole('button')).toHaveLength(8);
    await user.click(screen.getByRole('button', { name: /^\d+ Gooseneck kettle$/ }));
    expect(onSelect).toHaveBeenCalledWith('gooseneck-kettle');
  });

  it('can render as a plain illustration with no hotspots', () => {
    render(<PourOverStationDiagram mode="explore" showPins={false} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
