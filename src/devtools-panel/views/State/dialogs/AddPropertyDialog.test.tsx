import { cleanup, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

let mockActiveState: unknown;
vi.mock('../../../store', () => ({
  getActiveState: () => mockActiveState,
}));

import { AddPropertyDialog } from './AddPropertyDialog';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockActiveState = undefined;
});

describe('AddPropertyDialog', () => {
  it('keeps entered value for string type', async () => {
    const onConfirm = vi.fn<(name: string, value: unknown) => void>();
    const user = userEvent.setup();

    render(() => <AddPropertyDialog path={[]} onConfirm={onConfirm} />);

    await user.type(screen.getByPlaceholderText('Value'), 'alpha');
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0]?.[1]).toBe('alpha');
  });

  it('keeps entered value for number type', async () => {
    const onConfirm = vi.fn<(name: string, value: unknown) => void>();
    const user = userEvent.setup();

    render(() => <AddPropertyDialog path={[]} onConfirm={onConfirm} />);

    await user.selectOptions(screen.getByRole('combobox'), 'number');
    await user.type(screen.getByPlaceholderText('Value'), '42');
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0]?.[1]).toBe(42);
  });

  it('keeps entered value for boolean type', async () => {
    const onConfirm = vi.fn<(name: string, value: unknown) => void>();
    const user = userEvent.setup();

    render(() => <AddPropertyDialog path={[]} onConfirm={onConfirm} />);

    await user.selectOptions(screen.getByRole('combobox'), 'boolean');
    await user.selectOptions(screen.getAllByRole('combobox')[1]!, 'false');
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0]?.[1]).toBe(false);
  });

  it('creates empty object for object type', async () => {
    const onConfirm = vi.fn<(name: string, value: unknown) => void>();
    const user = userEvent.setup();

    render(() => <AddPropertyDialog path={[]} onConfirm={onConfirm} />);

    await user.selectOptions(screen.getByRole('combobox'), 'object');
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0]?.[1]).toEqual({});
  });

  it('creates empty array for array type', async () => {
    const onConfirm = vi.fn<(name: string, value: unknown) => void>();
    const user = userEvent.setup();

    render(() => <AddPropertyDialog path={[]} onConfirm={onConfirm} />);

    await user.selectOptions(screen.getByRole('combobox'), 'array');
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0]?.[1]).toEqual([]);
  });

  it('creates empty map for map type', async () => {
    const onConfirm = vi.fn<(name: string, value: unknown) => void>();
    const user = userEvent.setup();

    render(() => <AddPropertyDialog path={[]} onConfirm={onConfirm} />);

    await user.selectOptions(screen.getByRole('combobox'), 'map');
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const createdMap = onConfirm.mock.calls[0]![1] as Map<unknown, unknown>;
    expect(createdMap).toBeInstanceOf(Map);
    expect(createdMap.size).toBe(0);
  });

  it('creates empty set for set type', async () => {
    const onConfirm = vi.fn<(name: string, value: unknown) => void>();
    const user = userEvent.setup();

    render(() => <AddPropertyDialog path={[]} onConfirm={onConfirm} />);

    await user.selectOptions(screen.getByRole('combobox'), 'set');
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const createdSet = onConfirm.mock.calls[0]![1] as Set<unknown>;
    expect(createdSet).toBeInstanceOf(Set);
    expect(createdSet.size).toBe(0);
  });

  it('uses property name when container is object', async () => {
    mockActiveState = { root: {} };
    const onConfirm = vi.fn<(name: string, value: unknown) => void>();
    const user = userEvent.setup();

    render(() => <AddPropertyDialog path={['root']} onConfirm={onConfirm} />);

    await user.type(screen.getByPlaceholderText('Property name'), 'score');
    await user.type(screen.getByPlaceholderText('Value'), '10');
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0]?.[0]).toBe('score');
    expect(onConfirm.mock.calls[0]?.[1]).toBe('10');
  });

  it('uses property name when container is map', async () => {
    mockActiveState = { root: new Map([['a', 1]]) };
    const onConfirm = vi.fn<(name: string, value: unknown) => void>();
    const user = userEvent.setup();

    render(() => <AddPropertyDialog path={['root']} onConfirm={onConfirm} />);

    await user.type(screen.getByPlaceholderText('Property name'), 'b');
    await user.type(screen.getByPlaceholderText('Value'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0]?.[0]).toBe('b');
    expect(onConfirm.mock.calls[0]?.[1]).toBe('hello');
  });

  it('uses next array index and Add Item label when container is array', async () => {
    mockActiveState = { root: ['x', 'y'] };
    const onConfirm = vi.fn<(name: string, value: unknown) => void>();
    const user = userEvent.setup();

    render(() => <AddPropertyDialog path={['root']} onConfirm={onConfirm} />);

    expect(screen.getByRole('button', { name: 'Add Item' })).toBeTruthy();
    await user.type(screen.getByPlaceholderText('Value'), 'z');
    await user.click(screen.getByRole('button', { name: 'Add Item' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0]?.[0]).toBe('2');
    expect(onConfirm.mock.calls[0]?.[1]).toBe('z');
  });

  it('ignores invalid number input and keeps default numeric value', async () => {
    const onConfirm = vi.fn<(name: string, value: unknown) => void>();
    const user = userEvent.setup();

    render(() => <AddPropertyDialog path={[]} onConfirm={onConfirm} />);

    await user.selectOptions(screen.getByRole('combobox'), 'number');
    await user.type(screen.getByPlaceholderText('Value'), 'e');
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0]?.[1]).toBe(0);
  });
});
