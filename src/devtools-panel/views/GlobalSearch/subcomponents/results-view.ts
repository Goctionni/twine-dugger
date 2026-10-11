import { createSignal } from 'solid-js';

/** Which sections of the results are shown: both, or only one of them */
export type ResultsView = 'both' | 'state' | 'passage';

// Not in the store: only the switch and the results care. It is kept when the page is left
export const [getView, setView] = createSignal<ResultsView>('both');
