/**
 * World-space text panels (Babylon GUI on meshes). Readable in a headset:
 * ≥ ~2 cm glyphs at ~1 m, high-contrast dark cards, bilingual via the
 * current locale. Text only re-renders when its content key changes.
 */
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';

export const COLORS = {
  card: 'rgba(36, 24, 17, 0.94)',
  edge: '#c98a3b',
  text: '#fbf3e4',
  muted: '#d9c6b0',
  success: '#7fd28e',
  warn: '#f0b93a',
  mistake: '#ff9f8f',
  info: '#9cc8ee',
  button: '#5a3a26',
  buttonHi: '#8c4a1f',
};

const FONT = 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
const WRAP_WORD = 1; // TextWrapping.WordWrap (const enum; numeric under isolatedModules)

/** Split so CJK wraps per character and Latin per word (wordDivider = ''). */
export function splitForWrap(line: string): string[] {
  return line.match(/[　-〿㐀-鿿＀-￯]|[^\s　-〿㐀-鿿＀-￯]+\s*|\s+/g) ?? [line];
}

export function text(t: string, size: number, color = COLORS.text, bold = false): TextBlock {
  const tb = new TextBlock();
  tb.text = t;
  tb.fontFamily = FONT;
  tb.fontSize = size;
  tb.color = color;
  tb.fontWeight = bold ? '700' : '400';
  tb.textWrapping = WRAP_WORD;
  tb.wordSplittingFunction = splitForWrap;
  tb.wordDivider = '';
  tb.resizeToFit = true;
  tb.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  tb.paddingBottom = `${Math.round(size * 0.25)}px`;
  return tb;
}

export function button(name: string, label: string, onClick: () => void, wide = false): Button {
  const b = Button.CreateSimpleButton(name, label);
  b.width = wide ? '230px' : '170px';
  b.height = '72px';
  b.color = COLORS.text;
  b.background = COLORS.button;
  b.cornerRadius = 14;
  b.thickness = 2;
  b.fontFamily = FONT;
  b.fontSize = 30;
  b.paddingLeft = '6px';
  b.paddingRight = '6px';
  b.onPointerEnterObservable.add(() => (b.background = COLORS.buttonHi));
  b.onPointerOutObservable.add(() => (b.background = COLORS.button));
  b.onPointerClickObservable.add(onClick);
  return b;
}

export interface Panel {
  mesh: Mesh;
  adt: AdvancedDynamicTexture;
  card: Rectangle;
  stack: StackPanel;
  key: string;
}

export function createPanel(scene: Scene, name: string, widthM: number, heightM: number, px: number, parent: TransformNode): Panel {
  const mesh = MeshBuilder.CreatePlane(name, { width: widthM, height: heightM }, scene);
  mesh.parent = parent;
  const pxH = Math.round((px * heightM) / widthM);
  const adt = AdvancedDynamicTexture.CreateForMesh(mesh, px, pxH, false);
  const card = new Rectangle(`${name}-card`);
  card.background = COLORS.card;
  card.color = COLORS.edge;
  card.thickness = 3;
  card.cornerRadius = 22;
  adt.addControl(card);
  const stack = new StackPanel(`${name}-stack`);
  stack.isVertical = true;
  stack.width = `${px - 56}px`;
  stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  stack.paddingTop = '22px';
  card.addControl(stack);
  return { mesh, adt, card, stack, key: '' };
}

export function clearStack(p: Panel): void {
  for (const c of [...p.stack.children]) {
    p.stack.removeControl(c);
    c.dispose();
  }
}

export function row(buttons: Button[], height = 84): StackPanel {
  const r = new StackPanel();
  r.isVertical = false;
  r.height = `${height}px`;
  r.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  for (const b of buttons) r.addControl(b);
  return r;
}

/** Small billboard name tag (guided tier "tool tags"). */
export function createTag(scene: Scene, name: string, label: string, parent: TransformNode): { mesh: Mesh; set(label: string): void } {
  const mesh = MeshBuilder.CreatePlane(name, { width: 0.16, height: 0.04 }, scene);
  mesh.parent = parent;
  mesh.billboardMode = TransformNode.BILLBOARDMODE_ALL;
  mesh.isPickable = false;
  const adt = AdvancedDynamicTexture.CreateForMesh(mesh, 512, 128, false);
  const card = new Rectangle();
  card.background = 'rgba(36,24,17,0.82)';
  card.color = COLORS.edge;
  card.thickness = 2;
  card.cornerRadius = 40;
  card.width = '100%';
  adt.addControl(card);
  const tb = new TextBlock();
  tb.fontFamily = FONT;
  tb.fontSize = 56;
  tb.color = COLORS.text;
  tb.text = label;
  card.addControl(tb);
  return {
    mesh,
    set(l: string) {
      if (tb.text !== l) tb.text = l;
    },
  };
}
