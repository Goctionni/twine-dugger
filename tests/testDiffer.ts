// diffTest.ts
import { getDiffer } from '../src/content-script/util/differ'; // Import the factory function
// Assuming you import the full Diff type from types.ts

// --- Create a Differ Instance ---
// This instance will maintain its own identity map state across calls.
const differ = getDiffer();

// Helper to simulate the state management and calling pattern
function runTest(
  testName: string,
  initialState: any, // Represents the live state from the previous cycle
  stateModifier: (state: any) => any, // Function to modify the state IN PLACE
) {
  console.log(`\n--- ${testName} ---`);

  // 1. Clone the initial state BEFORE modification to get the 'old' snapshot
  let clonedOldState;
  try {
    clonedOldState = structuredClone(initialState);
  } catch (error) {
    console.error(`Error cloning state for test "${testName}":`, error);
    clonedOldState = { ...initialState }; // Fallback shallow copy
    console.warn('Proceeding with shallow copy for old state.');
  }

  // 2. Modify the initial state IN PLACE to get the 'new' live state
  stateModifier(initialState);
  const liveNewState = initialState; // Now initialState holds the modified live state

  // 3. Run the diff USING THE DIFFER INSTANCE
  const diffs = differ(clonedOldState, liveNewState); // Use the instance

  // 4. Output the results using console.table
  if (diffs.length > 0) {
    // Map to display format, handling value properties correctly
    const displayDiffs = diffs.map((diff: Diff) => {
      const display: any = {
        type: diff.type,
        path: diff.path.join('.'), // Join path for readability
      };

      // Stringify helper
      const stringifyIfNeeded = (val: Value): string | Primitive => {
        return typeof val === 'object' && val !== null ? JSON.stringify(val) : (val as Primitive);
      };

      // Handle properties based on the specific Diff type
      switch (diff.type) {
        case 'object':
        case 'map':
        case 'array':
        case 'set':
          display.subtype = diff.subtype;
          if ('key' in diff) display.key = diff.key;
          if ('index' in diff) display.index = diff.index;
          // Map 'value' to 'newValue' for adds, 'oldValue' for removes
          if (diff.subtype === 'add') {
            display.newValue = stringifyIfNeeded(diff.newValue);
          } else if (diff.subtype === 'remove') {
            // subtype === 'remove'
            display.oldValue = stringifyIfNeeded(diff.oldValue);
          }
          break;
        case 'string':
        case 'number':
        case 'boolean':
        case 'type-changed':
          // These types have standard oldValue and newValue
          display.oldValue = stringifyIfNeeded(diff.oldValue);
          display.newValue = stringifyIfNeeded(diff.newValue);
          break;
      }
      return display;
    });

    // Dynamically determine columns based on properties present in the diffs
    const properties = [
      'type',
      'subtype',
      'path',
      'index',
      'key',
      // Use oldValue and newValue as the primary value columns now
      'oldValue',
      'newValue',
    ].filter((property) => {
      // Check if at least one diff object has this property
      return displayDiffs.some((diff) => property in diff);
    });

    console.table(displayDiffs, properties);
  } else {
    console.log('No differences found.');
  }

  // 5. Return the modified live state for the next cycle
  return liveNewState; // Return the same object reference that was modified
}

// --- Rest of your test cases ---
// ... (The test case definitions remain the same) ...

// Initial state for basic tests (NO FUNCTIONS)
let state1 = {
  name: 'Alice',
  score: 10,
  active: true,
  metadata: null,
  extra: undefined,
  job: { title: 'Warrior', level: 3 },
  settings: new Map<string, Value>([
    ['difficulty', 'easy'],
    ['volume', 5],
  ]),
  items: ['sword', 'shield', { id: 'potion', qty: 1 }],
  flags: new Set(['active', 'questing']),
};

// Test 1: Basic updates, adds, removes
state1 = runTest('Basic Test', state1, (currentState) => {
  currentState.score = 15;
  currentState.active = false;
  currentState.metadata = { timestamp: 12345 };
  currentState.extra = 'some value';
  currentState.job.level = 4;
  currentState.settings.delete('volume');
  currentState.settings.set('difficulty', 'hard');
  currentState.settings.set('sound', true);
  const swordRef = currentState.items[0];
  const shieldRef = currentState.items[1];
  currentState.items = [swordRef, { id: 'potion', qty: 2 }, shieldRef, 'boots'];
  currentState.flags.delete('questing');
  currentState.flags.add('new_flag');
  return currentState;
});

// --- Array Specific Tests ---
let arrayState = state1;

// Test 2: Referential Equality & In-place Mutation on 'items' array
arrayState = runTest('Array: Referential Equality & Mutation', arrayState, (currentState) => {
  const swordRef = currentState.items.find((item: unknown) => item === 'sword');
  const potionRef = currentState.items.find(
    (item: { id: string }) => typeof item === 'object' && item?.id === 'potion',
  );
  const shieldRef = currentState.items.find((item: unknown) => item === 'shield');
  const bootsRef = currentState.items.find((item: unknown) => item === 'boots'); // This will be undefined if boots was removed

  if (potionRef && typeof potionRef === 'object') {
    potionRef.qty = 3;
  }

  currentState.items = [potionRef, swordRef, shieldRef, { id: 'gem', value: 100 }];
  return currentState;
});

// Test 3: ID Key Matching & Replacement
arrayState = runTest('Array: ID Key Matching', arrayState, (currentState) => {
  const swordRef = currentState.items.find((item: unknown) => item === 'sword');
  const shieldRef = currentState.items.find((item: unknown) => item === 'shield');
  const gemRef = currentState.items.find(
    (item: { id: string }) => typeof item === 'object' && item?.id === 'gem',
  );

  currentState.items = [
    swordRef,
    shieldRef,
    { id: 'potion', qty: 5, description: 'New Potion' },
    gemRef,
  ];
  return currentState;
});

// Test 4: Conditional DeepEquals (No Ref/ID Matches)
let deepEqualsState = {
  list: [{ value: 10 }, { value: 20 }],
};
deepEqualsState = runTest(
  'Array: Conditional DeepEquals (No Ref/ID)',
  deepEqualsState,
  (currentState) => {
    const val1 = currentState.list[0].value;
    const val2 = currentState.list[1].value;
    currentState.list = [{ value: val2 }, { value: val1 }];
    return currentState;
  },
);

// Test 5: Conditional DeepEquals Skipped (Mixed Matches)
let mixedState = {
  list: [{ id: 1, name: 'A' }, { value: 10 }, { id: 2, name: 'B' }],
};
mixedState = runTest('Array: DeepEquals Skipped (Mixed Matches)', mixedState, (currentState) => {
  const objA = currentState.list[0];
  const objXValue = currentState.list[1].value;
  const objB = currentState.list[2];
  currentState.list = [objA, { value: objXValue }, objB];
  return currentState;
});

// --- Set Specific Tests (Still uses deepEquals only) ---
let setState = {
  flags: new Set([1, 'hello', { id: 10, data: 'abc' }, { id: 20, data: 'def' }]),
};

setState = runTest('Set Test', setState, (currentState) => {
  currentState.flags.delete(1);
  let itemToDelete: any = null;
  for (const item of currentState.flags) {
    if (typeof item === 'object' && item !== null && item.id === 20 && item.data === 'def') {
      itemToDelete = item;
      break;
    }
  }
  if (itemToDelete) currentState.flags.delete(itemToDelete);
  currentState.flags.add({ id: 30, data: 'ghi' });
  currentState.flags.add(2);
  return currentState;
});
