export const canUsePageShortcut = (event: KeyboardEvent) =>
  !event.repeat &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.shiftKey &&
  !(event.target instanceof HTMLElement &&
    event.target.closest('button, a, input, textarea, select, [contenteditable], [role=dialog], [role=alertdialog]'))
