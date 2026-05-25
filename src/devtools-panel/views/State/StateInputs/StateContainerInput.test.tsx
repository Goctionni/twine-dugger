/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('../../../ui/display/TypeIcon', () => ({
  TypeIcon: (props: { type: string }) => <span data-testid={`type-${props.type}`} />,
}));

vi.mock('./StateStringInput', () => ({
  StateStringInput: () => <span data-testid="input-string" />,
}));

vi.mock('./StateNumberInput', () => ({
  StateNumberInput: () => <span data-testid="input-number" />,
}));

vi.mock('./StateBooleanInput', () => ({
  StateBooleanInput: () => <span data-testid="input-boolean" />,
}));

import { StateContainerInput } from './StateContainerInput';

afterEach(() => cleanup());

describe('StateContainerInput', () => {
  it('should render primitive children with appropriate input components', () => {
    const keys = ['name', 'hp', 'alive', 'nested'] as const;
    const values: Record<string, unknown> = {
      name: 'Avery',
      hp: 10,
      alive: true,
      nested: { x: 1 },
    };

    render(() => (
      <StateContainerInput
        path={['player']}
        keys={keys as any}
        getKeyValue={(key) => values[String(key)] as any}
      />
    ));

    expect(screen.getByTestId('input-string')).toBeTruthy();
    expect(screen.getByTestId('input-number')).toBeTruthy();
    expect(screen.getByTestId('input-boolean')).toBeTruthy();
    expect(screen.queryByText('nested')).toBeNull();
  });
});
