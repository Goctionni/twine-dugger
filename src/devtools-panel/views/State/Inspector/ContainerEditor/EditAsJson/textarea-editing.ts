/** Tab indents the line at the caret, or the lines that are selected. Shift+Tab takes it back */
function indent(area: HTMLTextAreaElement, isBack: boolean) {
  const { value, selectionStart: start, selectionEnd: end } = area;
  const hasSeveralLines = value.slice(start, end).includes('\n');
  if (!isBack && !hasSeveralLines) {
    area.setRangeText('  ', start, end, 'end');
    return;
  }

  const firstLineStart = value.lastIndexOf('\n', start - 1) + 1;
  // A selection that ends right after a line break leaves the next line out
  const lastSelected = end > start && value[end - 1] === '\n' ? end - 1 : end;
  const lastLineEnd = value.indexOf('\n', lastSelected);
  const lines = value.slice(firstLineStart, lastLineEnd === -1 ? value.length : lastLineEnd);
  const changedLines = lines
    .split('\n')
    .map((line) => (isBack ? line.replace(/^( {1,2}|\t)/, '') : `  ${line}`))
    .join('\n');

  // 'preserve' keeps the edit in the undo history
  area.setRangeText(changedLines, firstLineStart, firstLineStart + lines.length, 'preserve');
  if (hasSeveralLines) {
    area.setSelectionRange(firstLineStart, firstLineStart + changedLines.length);
  } else {
    // The caret stays where it was in the text, so it moves with the removed spaces
    const removed = lines.length - changedLines.length;
    const caret = Math.max(firstLineStart, start - removed);
    area.setSelectionRange(caret, caret);
  }
}

const getLineBeforeCaret = ({ value, selectionStart }: HTMLTextAreaElement) =>
  value.slice(value.lastIndexOf('\n', selectionStart - 1) + 1, selectionStart);

/** Enter starts the new line like the one before it, two spaces further in after a { or [ */
function insertNewLine(area: HTMLTextAreaElement) {
  const { value, selectionStart: start, selectionEnd: end } = area;
  const lineBefore = getLineBeforeCaret(area);
  const indentation = /^[ \t]*/.exec(lineBefore)![0];
  const opensBlock = /[{[]\s*$/.test(lineBefore);
  const closesBlock = /^[}\]]/.test(value.slice(end));

  const inner = opensBlock ? `${indentation}  ` : indentation;
  // Between a { and a }: the closing one goes to a line of its own
  const text = opensBlock && closesBlock ? `\n${inner}\n${indentation}` : `\n${inner}`;
  area.setRangeText(text, start, end, 'end');
  const caret = start + 1 + inner.length;
  area.setSelectionRange(caret, caret);
}

/** A } or ] that starts a line goes one level (two spaces) back: the line was indented for an item */
function insertClosingBracket(area: HTMLTextAreaElement, bracket: string) {
  const { selectionStart: start, selectionEnd: end } = area;
  const spacesRemoved = Math.min(2, getLineBeforeCaret(area).length);
  area.setRangeText(bracket, start - spacesRemoved, end, 'end');
}

/**
 * The keys that make the text easier to write as JSON: Tab, Enter and a closing bracket. Gives
 * whether the key was one of them, and so is done (the text of the area has changed)
 */
export function handleJsonTextKey(
  event: KeyboardEvent & { currentTarget: HTMLTextAreaElement },
): boolean {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return false;
  const area = event.currentTarget;
  if (event.key === 'Tab') indent(area, event.shiftKey);
  else if (event.key === 'Enter' && !event.shiftKey) insertNewLine(area);
  else if ((event.key === '}' || event.key === ']') && /^ +$/.test(getLineBeforeCaret(area))) {
    insertClosingBracket(area, event.key);
  } else return false;
  event.preventDefault();
  return true;
}
