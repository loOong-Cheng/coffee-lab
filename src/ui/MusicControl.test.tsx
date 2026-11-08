import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MUSIC_MOOD_IDS } from '../audio';
import type { MusicMoodId } from '../audio';
import { MusicControl } from './MusicControl';

function Harness({ all = false, onChange = vi.fn() }: { all?: boolean; onChange?: (k: string, v: unknown) => void }) {
  const [playing, setPlaying] = useState(false);
  const [mood, setMood] = useState<MusicMoodId>('cafe');
  const [volume, setVolume] = useState(0.7);
  const [sfx, setSfx] = useState(true);
  return (
    <>
      <button>before</button>
      <MusicControl
        locale="en"
        playing={playing}
        onPlayingChange={(v) => {
          setPlaying(v);
          onChange('playing', v);
        }}
        mood={mood}
        onMoodChange={(m) => {
          setMood(m);
          onChange('mood', m);
        }}
        moods={all ? MUSIC_MOOD_IDS : undefined}
        volume={volume}
        onVolumeChange={(v) => {
          setVolume(v);
          onChange('volume', v);
        }}
        sfx={sfx}
        onSfxChange={setSfx}
      />
    </>
  );
}

describe('MusicControl (compact)', () => {
  it('toggles music with a labelled, pressed-state button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const play = screen.getByRole('button', { name: 'Background music' });
    expect(play).toHaveAttribute('aria-pressed', 'false');
    await user.click(play);
    expect(play).toHaveAttribute('aria-pressed', 'true');
    expect(onChange).toHaveBeenCalledWith('playing', true);
  });

  it('opens a settings popover (aria-expanded), offers only persisted moods by default, closes on Esc', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /Music mood: Café jazz/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const group = screen.getByRole('radiogroup', { name: 'Mood' });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(3);
    await user.click(within(group).getByRole('radio', { name: /Focus/ }));
    expect(onChange).toHaveBeenCalledWith('mood', 'focus');
    expect(screen.getByRole('button', { name: /Music mood: Focus/ })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Music mood/ })).toHaveFocus();
  });

  it('shows culture moods with their inspiration when allowed, and a labelled volume slider', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness all onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /Music mood/ }));
    const group = screen.getByRole('radiogroup', { name: 'Mood' });
    expect(within(group).getAllByRole('radio')).toHaveLength(6);
    expect(within(group).getByRole('radio', { name: /Japan · Jazz kissa/ })).toBeInTheDocument();
    expect(screen.getByText(/jazz kissa — cafés devoted to playing jazz records/)).toBeInTheDocument();
    const slider = screen.getByRole('slider', { name: /Volume/ });
    expect(slider).toHaveAttribute('aria-valuetext', '70%');
    fireEvent.change(slider, { target: { value: '40' } });
    expect(onChange).toHaveBeenCalledWith('volume', 0.4);
    expect(screen.getByRole('switch', { name: 'Sound effects' })).toHaveAttribute('aria-checked', 'true');
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /Music mood/ }));
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'before' }));
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });
});

describe('MusicControl (panel)', () => {
  it('renders inline controls in Chinese', () => {
    render(
      <MusicControl
        variant="panel"
        locale="zh"
        playing
        onPlayingChange={() => {}}
        mood="focus"
        onMoodChange={() => {}}
        volume={1}
        onVolumeChange={() => {}}
      />,
    );
    expect(screen.getByRole('group', { name: '音乐与声音' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: '播放背景音乐' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /专注/ })).toHaveAttribute('aria-checked', 'true');
  });
});
