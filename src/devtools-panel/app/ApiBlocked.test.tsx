import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, expect, it } from 'vite-plus/test';

import { ApiBlocked } from './ApiBlocked';

afterEach(cleanup);

it('says that the game has blocked access to the SugarCube API', () => {
  render(() => <ApiBlocked />);

  expect(screen.getByText('This game has blocked access to the SugarCube API')).toBeTruthy();
  expect(screen.getByText(/cannot read or change the state of this game/)).toBeTruthy();
});

it('has nothing to press: there is no way around it offered', () => {
  render(() => <ApiBlocked />);

  expect(screen.queryAllByRole('button')).toHaveLength(0);
});
