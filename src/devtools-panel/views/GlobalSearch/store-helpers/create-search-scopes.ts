import { createProjection } from 'solid-js';

import { createDefaultScope, type PassageScope, type StateScope } from '../types';
import { getScope } from './search-state';

// A flag only notifies when it changes: resetting the filters makes a new scope with the same flags,
// and that must not search again
export function createSearchScopes() {
  const passageScope = createProjection<PassageScope>((draft) => {
    Object.assign(draft, getScope().passage);
  }, createDefaultScope().passage);
  const stateScope = createProjection<StateScope>((draft) => {
    Object.assign(draft, getScope().state);
  }, createDefaultScope().state);
  return { passageScope, stateScope };
}
