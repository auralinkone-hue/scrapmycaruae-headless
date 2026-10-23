/** Guidance only: selecting a condition never edits or submits the QuoteForm. */
export function initializeUnwantedConditions(root: HTMLElement) {
  if (root.dataset.conditionsReady) return;
  root.dataset.conditionsReady = 'true';
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-unwanted-condition]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-unwanted-panel]')];
  const select = (button: HTMLButtonElement) => {
    if (!buttons.includes(button)) return;
    for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
    for (const panel of panels) panel.hidden = panel.id !== button.getAttribute('aria-controls');
    root.dataset.condition = button.dataset.unwantedCondition;
  };
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', (event) => {
      const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 };
      if (!(event.key in offsets) && !['Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + offsets[event.key] + buttons.length) % buttons.length;
      buttons[next].focus(); select(buttons[next]);
    });
  });
}
