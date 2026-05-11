import { createContextMenuHandler } from './ContextMenu';

interface InputContextMenuOptions<T> {
  getInput: () => HTMLInputElement | null;
  getRawValue: () => string;
  applyRawValue: (value: string) => void;
  isDisabled?: () => boolean;
  isReadOnly?: () => boolean;
  parseAndApplyValue?: (value: string) => void;
}

export function createInputContextMenuHandler(options: InputContextMenuOptions<unknown>) {
  const selectedText = () => {
    const input = options.getInput();
    if (!input) return options.getRawValue();
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    return start === end ? options.getRawValue() : options.getRawValue().slice(start, end);
  };

  const updateSelection = (value: string) => {
    const input = options.getInput();
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const newValue = `${options.getRawValue().slice(0, start)}${value}${options.getRawValue().slice(end)}`;
    if (options.parseAndApplyValue) {
      options.parseAndApplyValue(newValue);
    } else {
      options.applyRawValue(newValue);
    }
    setTimeout(() => {
      const position = start + value.length;
      if (typeof input.setSelectionRange === 'function' && input.type !== 'number') {
        input.setSelectionRange(position, position);
      }
    }, 0);
  };

  const removeSelection = () => updateSelection('');

  const isInactive = () => (options.isDisabled?.() ?? false) || (options.isReadOnly?.() ?? false);

  const tryWriteText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const writeText = async (text: string) => {
    return await tryWriteText(text);
  };

  return createContextMenuHandler([
    {
      label: 'Copy',
      onClick: async () => {
        const text = selectedText();
        await writeText(text);
      },
    },
    {
      label: 'Cut',
      onClick: async () => {
        if (isInactive()) return;
        const success = await writeText(selectedText());
        if (success) removeSelection();
      },
      disabled: () => isInactive(),
    },
  ]);
}
