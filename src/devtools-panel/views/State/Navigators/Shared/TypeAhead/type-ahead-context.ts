import { createContext } from 'solid-js';

/** What has been typed, as it is shown until the pause that ends it */
export interface TypedText {
  text: string;
  /** No item starts with it */
  isMiss: boolean;
}

/** Where the typed text goes, to be shown by whoever has the room for it */
export type ShowTypedText = (typed: TypedText | undefined) => void;

// Without a provider nothing is shown: a navigator also works by itself
export const TypeAheadContext = createContext<ShowTypedText>(() => {});
