# State transfer and transforms

How the game's state gets from the game to the panel and back, and what follows from it for code that reads or writes state.

## How data moves

TwineDugger primarily lives and runs inside a panel in devtools. From that panel we don't have direct access to the game, which runs in the "inspected window".

To interact with the game, TwineDugger sends functions (as a string) to the inspected window, to be executed there and to return the result back to TwineDugger.

For that to be possible:

1. The function needs to be entirely self-contained (it cannot use variables declared outside of the function body)
2. The data returned from the inspected window, must survive being turned into JSON.

There are a few common / semi-common types of data that don't _normally_ survive being turned into JSON (like instances of Map or Date). For the common data-types we run a pre-transform when reading and a post-transform before writing.

## Transforms

The conversion on the way out is the **pre-transform** (`src/content-script/util/pre-transform.ts`), the conversion on the way back is the **post-transform** (`src/content-script/util/post-transform.ts`).

JSON cannot carry Maps, Sets, Dates, functions, `undefined`, `NaN` or the infinities, so these values are replaced by **markers**: values that contain `__twinedugger-type` (see `src/shared/json-safe.ts`).

| Live value                      | In the panel                                                    | Notes                                                                                                                        |
| ------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| string, number, boolean, `null` | unchanged                                                       |                                                                                                                              |
| `NaN`, `Infinity`, `-Infinity`  | the strings `__twinedugger-type: NaN`, `+Infinity`, `-Infinity` | Shown by the panel, but not written by it.                                                                                   |
| `undefined`                     | the string `__twinedugger-type: undefined`                      |                                                                                                                              |
| plain object, class instance    | a plain object of its own enumerable keys                       |                                                                                                                              |
| array                           | array                                                           |                                                                                                                              |
| `Map`                           | an object with `"__twinedugger-type": "Map"` among its keys     | `"NumberMap"` when any key is a number.                                                                                      |
| `Set`                           | an array whose first item is `__twinedugger-type: Set`          | The items start at index 1. Nothing inside a Set can be written, see [`compromises-not-bugs.md`](./compromises-not-bugs.md). |
| `Date`                          | the string `__twinedugger-type: Date 2020-01-02T03:04:05`       | The time in the game page, to the second.                                                                                    |
| function                        | `{ "__twinedugger-type": "function", "str": "<source text>" }`  | It cannot be restored, so it cannot be written.                                                                              |

## What the markers mean for the panel

- **Paths** are arrays of keys (`Path` in `src/shared/shared-types.ts`). Array indexes are numbers, object keys and Map keys are strings.
- **A Map's entries** are ordinary properties of its marker object, next to the marker key itself.
- **A Set's items** are at index `1..n` of the marked array. The UI renders a Set like an array, with three differences: the type icon, the labels of the children (`index - 1`, to compensate for the marker at index 0), and that the descendants cannot be changed.

## Trade-offs

The pre and post transform system works well, but it comes with some trade-offs and compromises. Read [`compromises-not-bugs.md`](./compromises-not-bugs.md) for the details, and for the rules that follow from them for code that writes state.
