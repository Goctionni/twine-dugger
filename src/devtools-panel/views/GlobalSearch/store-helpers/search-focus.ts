import { createSignal } from 'solid-js';

const [getFocusRequests, setFocusRequests] = createSignal(0);

export { getFocusRequests };

/** Asks the search input to take the focus: when it is on the page now, or as soon as it is */
export const requestSearchFocus = () => setFocusRequests((count) => count + 1);
