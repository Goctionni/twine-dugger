const mockSiblings = [
  ['character', 'inventory', 'settings', 'flags'],
  ['stats', 'skills', 'traits'],
  ['fitness', 'strength', 'charisma', 'luck'],
];

/** Mock: the names next to the crumb at `index` of `path` (without the root), itself included */
export function getSiblings(_path: string[], index: number): string[] {
  return mockSiblings[index % mockSiblings.length]!;
}
