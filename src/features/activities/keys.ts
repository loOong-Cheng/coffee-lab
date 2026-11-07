/** Keyboard shortcuts must not fire while typing or operating a composite widget. */
export function isTypingTarget(el: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined' || !(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'INPUT') return true;
  return !!el.closest('[role="radiogroup"], [role="slider"], [role="listbox"], [role="dialog"], [role="alertdialog"]');
}
