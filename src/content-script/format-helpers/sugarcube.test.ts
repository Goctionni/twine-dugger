import { afterEach, expect, it } from 'vite-plus/test';

import sugarcubeHelpers from './sugarcube';

class FakePassage {
  readonly title: string;
  readonly element: HTMLElement;
  constructor(title: string, element: HTMLElement) {
    this.title = title;
    this.element = element;
  }
}

function installSugarCube(story: Record<string, unknown>) {
  Object.assign(window, {
    SugarCube: {
      State: { variables: {}, passage: 'Start' },
      Engine: { play: () => {} },
      Story: {
        ifId: 'id',
        has: (name: string) => name in passages,
        get: () => undefined,
        ...story,
      },
      Passage: FakePassage,
    },
  });
  const passages: Record<string, unknown> = {};
  return passages;
}

afterEach(() => {
  delete (window as { SugarCube?: unknown }).SugarCube;
});

it('adds a passage with Story.add when the version has it', () => {
  const added: unknown[] = [];
  const passages = installSugarCube({ add: (passage: unknown) => added.push(passage) });
  (window as any).SugarCube.Story.passages = passages;

  sugarcubeHelpers.setPassage({ name: 'New', source: 'Hello', tags: ['a', 'b'] });
  expect(added).toEqual([{ name: 'New', text: 'Hello', tags: ['a', 'b'] }]);
});

it('makes the passage from an element when the version has no Story.add', () => {
  const passages = installSugarCube({});
  (window as any).SugarCube.Story.passages = passages;

  sugarcubeHelpers.setPassage({ name: 'New', source: 'Hello', tags: ['a', 'b'] });
  const passage = passages.New as FakePassage;
  expect(passage).toBeInstanceOf(FakePassage);
  expect(passage.title).toBe('New');
  expect(passage.element.tagName.toLowerCase()).toBe('tw-passagedata');
  expect(passage.element.getAttribute('tags')).toBe('a b');
  expect(passage.element.textContent).toBe('Hello');
});
