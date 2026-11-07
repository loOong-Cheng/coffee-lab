/**
 * Accessible action list: every spatial interaction has a keyboard-operable
 * equivalent that dispatches the SAME state-machine actions. Pure, so the
 * list itself is unit-tested.
 */
import type { LocalizedText } from '../../domain/contracts';
import type { HandId, ItemId, MissionAction, MissionState, ZoneId } from './types';
import { ACTION_LABEL, ITEM_NAME, ZONE_NAME, fmt } from './content';
import { cuesFor, heldItem, isAt, stepCue, zonesFor } from './reducer';

export interface PanelAction {
  id: string;
  label: LocalizedText;
  actions: MissionAction[];
  /** True when this action matches the current cue AND the tier currently shows cues. */
  recommended: boolean;
}

const HAND: HandId = 'pointer';

function placeLabel(item: ItemId, zone: ZoneId): LocalizedText {
  if (item === 'portafilter' && zone === 'group-head') return ACTION_LABEL.attach;
  if (item === 'portafilter' && zone === 'knock-box') return ACTION_LABEL.knock;
  if (item === 'tamper' && zone === 'basket') return ACTION_LABEL.tamp;
  return fmt(ACTION_LABEL.place, { item: ITEM_NAME[item], zone: ZONE_NAME[zone] });
}

export function availableActions(s: MissionState): PanelAction[] {
  if (s.status !== 'playing') return [];
  const cue = stepCue(s);
  const showCue = cuesFor(s).cues;
  const out: PanelAction[] = [];
  const push = (id: string, label: LocalizedText, actions: MissionAction[], matches: boolean) =>
    out.push({ id, label, actions, recommended: showCue && matches });

  if (!s.flags.located) {
    push('locate', ACTION_LABEL.locate, [{ type: 'LOCATE', target: 'espresso-machine', source: 'panel' }], cue?.kind === 'look');
  }

  const held = heldItem(s, HAND);
  if (held) {
    for (const zone of zonesFor(held)) {
      if (zone === 'basket' && !s.items.portafilter.heldBy && !isAt(s, 'portafilter', 'tamp-mat')) continue;
      if (isAt(s, held, zone)) continue;
      push(
        `place-${held}-${zone}`,
        placeLabel(held, zone),
        [{ type: 'RELEASE', hand: HAND, zone, distanceM: 0, angleDeg: 0, tiltDeg: 0, source: 'panel' }],
        cue?.kind === 'place' && cue.item === held && cue.zone === zone,
      );
    }
    push(
      `putback-${held}`,
      fmt(ACTION_LABEL.putBack, { item: ITEM_NAME[held] }),
      [{ type: 'RELEASE', hand: HAND, source: 'panel' }],
      false,
    );
  } else {
    for (const item of ['portafilter', 'tamper', 'cup'] as const) {
      push(
        `grab-${item}`,
        fmt(ACTION_LABEL.grab, { item: ITEM_NAME[item] }),
        [{ type: 'GRAB', item, hand: HAND, source: 'panel' }],
        cue?.kind === 'grab' && cue.item === item,
      );
    }
  }

  push('press-grinder', ACTION_LABEL.grinder, [{ type: 'PRESS', button: 'grinder', source: 'panel' }], cue?.kind === 'press' && cue.button === 'grinder');
  push('press-tare', ACTION_LABEL.tare, [{ type: 'PRESS', button: 'tare', source: 'panel' }], cue?.kind === 'press' && cue.button === 'tare');
  push(
    'press-brew',
    s.shot.status === 'running' ? ACTION_LABEL.stop : ACTION_LABEL.brew,
    [{ type: 'PRESS', button: 'brew', source: 'panel' }],
    cue?.kind === 'press' && cue.button === 'brew',
  );
  return out;
}
