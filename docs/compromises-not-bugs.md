# Compromises, not bugs

Some behaviour can look like a bug or an oversight, but is a considered and accepted compromise. If you think you have found one of these, read the reason first, and ask before changing it.

## State values

- **Map keys are strings in the panel.** When a map is sent from the game to the panel, it's in the shape of a regular javascript object. And the keys of objects are strings. This is generally fine, there's a fair bit of edge-case handling in the post-transform / resolveMapKey functions, but...
  - A map that contains the keys `5` and `"5"` will have a collision
  - A map with keys that are neither strings nor numbers is probably doomed to get mangled.
- **Circular data structures.** Circular data structures in game-state are not, and never will be supported. Here's why:
  - It would be a pain in the ass to properly support circular data structures.
  - Twine story-formats also cannot handle circular data structures in game-state well (i.e. it would be pointless).
- **Shared references arrive as copies.** Game-state can contain references to the same object at more than 1 path. When this data gets sent to the panel, that object turns into 2 copies of the object.
  - Loss of identity is not entirely ideal; there are some minor performance trade-offs... But the alternative would actually be much worse.
  - `jsondiffpatch` (our diffing engine) creates separate deltas for copies of the same object at different paths. That would mean that one delta is created for every reference to the given object, and all duplicate copies of that delta would be applied against the same identity. So, for example additions to an array would be duplicated.
- **Class instances become plain objects.** Only own enumerable keys are copied, so prototype methods and getters are lost, and Symbol keys are skipped.
- **Dates are to the second.** A Date is shown in the time of the game page, and milliseconds are lost.
- **BigInt and Symbol values are not supported.** These do not really currently occur in game-state, so support would be a maintainability burden with no benefit. If games start using BigInt we might re-evaluate.
- **Values inside of a `Set` cannot be updated, deleted or locked.** TwineDugger's UI should never offer the possibility. There are 2 reasons:
  - TwineDugger communicates setState via path + value. Values inside of a set do not have a real path: their transformed variant might carry one, but not a reliable or stable one.
  - Since the data inside the devtools panel is a (transformed) copy of the real data, matching identity becomes near impossible.

## Locks

- **Locks are by path, not by identity.** After an array item is deleted, the lock applies to whatever moved into its index.

## What follows for code that writes state

1. Never write, delete or lock inside a Set; write the whole Set (see the Set entry above for why). The panel does not offer it, and new features should avoid the option too, including bulk edits, restoring from history and the JSON editors.
2. Skip the Map marker key when listing a Map's entries, and remember that a Set's items start at index 1.
3. Pass `deep` when writing a value that can hold a marked value inside of an object or array (see [state-transfer.md](./state-transfer.md) for marked values).
