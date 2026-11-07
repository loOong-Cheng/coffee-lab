import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { EvidenceKind, Guidance } from '../../domain/contracts';
import { getAnnouncerText } from './announcer';
import { Button, IconButton } from './Button';
import { Callout } from './Callout';
import { Dialog } from './Dialog';
import { EvidenceBadge, evidenceLabel } from './EvidenceBadge';
import { FeedbackPanel } from './FeedbackPanel';
import { GuidanceBadge, GuidanceSelector } from './Guidance';
import { ProgressBar, ProgressRing, StepProgress } from './Progress';
import { SegmentedControl } from './SegmentedControl';
import { Switch } from './Switch';
import { Chip } from './Tag';

function Seg({ onChange }: { onChange?: (v: string) => void }) {
  const [v, setV] = useState('b');
  return (
    <SegmentedControl
      label="Brew method"
      value={v}
      onChange={(x) => {
        setV(x);
        onChange?.(x);
      }}
      options={[
        { value: 'a', label: 'Espresso' },
        { value: 'b', label: 'Pour-over' },
        { value: 'c', label: 'Moka', disabled: true },
        { value: 'd', label: 'Press' },
      ]}
    />
  );
}

describe('SegmentedControl', () => {
  it('exposes radiogroup semantics with a single tab stop on the checked option', () => {
    render(<Seg />);
    const group = screen.getByRole('radiogroup', { name: 'Brew method' });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(4);
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, 0, -1, -1]);
  });

  it('arrow keys move focus AND selection, skip disabled options and wrap; Home/End jump', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Seg onChange={onChange} />);
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Pour-over' })).toHaveFocus();

    await user.keyboard('{ArrowRight}'); // skips disabled "Moka"
    expect(screen.getByRole('radio', { name: 'Press' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Press' })).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{ArrowRight}'); // wraps
    expect(screen.getByRole('radio', { name: 'Espresso' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Press' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('radio', { name: 'Espresso' })).toHaveAttribute('aria-checked', 'true');
    await user.keyboard('{End}');
    expect(screen.getByRole('radio', { name: 'Press' })).toHaveAttribute('aria-checked', 'true');
    expect(onChange.mock.calls.map((c) => c[0])).toEqual(['d', 'a', 'd', 'a', 'd']);
  });
});

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open help</button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Need help?" description="Step tips">
        <button>First action</button>
        <button>Second action</button>
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('moves focus in, traps Tab, closes on Esc and returns focus to the opener', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const opener = screen.getByRole('button', { name: 'Open help' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Need help?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Step tips');
    expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Second action' })).toHaveFocus();
    await user.tab(); // wraps to the close button (first in DOM order)
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Second action' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('close button closes; non-dismissible dialogs ignore Esc', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <Dialog open onClose={onClose} title="Confirm" locale="zh">
        <p>body</p>
      </Dialog>,
    );
    await user.click(screen.getByRole('button', { name: '关闭' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(
      <Dialog open onClose={onClose} title="Confirm" dismissible={false} footer={<button>OK</button>}>
        <p>body</p>
      </Dialog>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('EvidenceBadge', () => {
  const cases: Array<[EvidenceKind, string, string]> = [
    ['self_report', '自我报告', 'Self-reported'],
    ['assessed_answer', '答题评估', 'Assessed answer'],
    ['simulated', '模拟练习', 'Simulated'],
    ['observed_by_app', '应用记录', 'Recorded by app'],
  ];
  it.each(cases)('%s → zh "%s" / en "%s"', (kind, zh, en) => {
    expect(evidenceLabel(kind, 'zh')).toBe(zh);
    expect(evidenceLabel(kind, 'en')).toBe(en);
    const { unmount } = render(<EvidenceBadge kind={kind} locale="en" />);
    expect(screen.getByText(en)).toBeInTheDocument();
    unmount();
    render(<EvidenceBadge kind={kind} locale="zh" showDetail />);
    expect(screen.getByText(zh)).toBeInTheDocument();
  });

  it('self-report detail says the app cannot see the kitchen', () => {
    render(<EvidenceBadge kind="self_report" locale="en" showDetail />);
    expect(screen.getByText(/can't see your kitchen/)).toBeInTheDocument();
  });
});

describe('Guidance', () => {
  it('badge shows words, selector switches tier', async () => {
    const user = userEvent.setup();
    function H() {
      const [g, setG] = useState<Guidance>('guided');
      return (
        <>
          <GuidanceBadge level={g} locale="en" />
          <GuidanceSelector value={g} onChange={setG} locale="en" variant="full" />
        </>
      );
    }
    render(<H />);
    expect(screen.getByRole('radiogroup', { name: 'Guidance level' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Independent/ }));
    expect(screen.getByRole('radio', { name: /Independent/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getAllByText('Independent').length).toBeGreaterThan(1);
  });
});

describe('small primitives', () => {
  it('IconButton has an accessible name; Button forwards clicks unless busy', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      <>
        <IconButton icon="sound-off" label="Mute sound" pressed />
        <Button onClick={onClick}>Next</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Mute sound' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <Button onClick={onClick} busy>
        Next
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Switch toggles aria-checked; Chip toggles aria-pressed', async () => {
    const user = userEvent.setup();
    function H() {
      const [on, setOn] = useState(false);
      const [sel, setSel] = useState(false);
      return (
        <>
          <Switch checked={on} onChange={setOn} label="Music" description="Off by default" />
          <Chip selected={sel} onChange={setSel}>
            I own this
          </Chip>
        </>
      );
    }
    render(<H />);
    const sw = screen.getByRole('switch', { name: 'Music' });
    expect(sw).toHaveAccessibleDescription('Off by default');
    await user.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    const chip = screen.getByRole('button', { name: 'I own this' });
    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('progress components expose labelled progressbars', () => {
    render(
      <>
        <ProgressBar value={0.5} label="Espresso path" valueText="3 of 6 lessons" />
        <ProgressRing value={1} label="Lesson mastery" />
        <StepProgress current={2} total={8} locale="zh" />
      </>,
    );
    const bar = screen.getByRole('progressbar', { name: 'Espresso path' });
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuetext', '3 of 6 lessons');
    expect(screen.getByRole('progressbar', { name: 'Lesson mastery' })).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('第 3 步，共 8 步')).toBeInTheDocument();
  });

  it('Callout shows its kind in words (not colour only)', () => {
    render(
      <Callout kind="safety" locale="zh">
        蒸汽很烫
      </Callout>,
    );
    expect(screen.getByRole('note')).toHaveTextContent('安全提示');
  });

  it('FeedbackPanel states the result in words and announces it', async () => {
    vi.useFakeTimers();
    render(
      <FeedbackPanel status="incorrect" locale="en" why>
        A faster shot usually means the grind is too coarse.
      </FeedbackPanel>,
    );
    expect(screen.getByText("Not quite — here's why")).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(getAnnouncerText()).toContain('Not quite');
    expect(getAnnouncerText()).toContain('grind is too coarse');
    vi.useRealTimers();
  });
});
