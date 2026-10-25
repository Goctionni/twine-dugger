import { getSettings, setSetting } from '@/devtools-panel/store/store';
import { BooleanInput } from '@/devtools-panel/ui/inputs/BooleanInput';
import { NumberInput } from '@/devtools-panel/ui/inputs/NumberInput';

import { onRecentUpdatesChange, onTypeAheadResetChange } from './util/diffLogSetters';
import { SettingRow } from './util/SettingRow';
import { describeSplitDirection, SplitDirectionSelect } from './util/SplitDirectionSelect';
import { TreeLayoutChoice } from './util/TreeLayoutChoice';

const exampleClass = 'rounded-md bg-slate-950 px-2 py-1.5 font-mono text-xs whitespace-pre';

export function StateSettings() {
  return (
    <>
      <SettingRow
        label="Split direction"
        description="Whether the diff log is beside the state or above it."
        setting="state.splitDirection"
        formatDefault={describeSplitDirection}
      >
        <SplitDirectionSelect setting="state.splitDirection" label="Split direction" />
      </SettingRow>
      <SettingRow
        label="Tree layout"
        description="What the tree navigator shows."
        setting="state.treeLayout"
        formatDefault={(value) =>
          value === 'containers-and-primitives'
            ? 'Everything in the tree'
            : 'Containers, and a list'
        }
        info={{
          title: 'Tree layout',
          children: (
            <>
              <p>
                The list layout keeps a tree with big containers short: you open a container in the
                tree and read its values in the list.
              </p>
              <p>
                It only changes the tree navigator. The Miller columns and the tiles stay as they
                are.
              </p>
            </>
          ),
        }}
        stacked
      >
        <TreeLayoutChoice />
      </SettingRow>
      <SettingRow
        label="Recent change dot"
        description="Mark values that changed in the last few updates."
        setting="state.recentUpdates"
        unit="updates"
      >
        <NumberInput
          inputProps={{ 'aria-label': 'Recent change dot' }}
          value={getSettings.state.recentUpdates()}
          onChange={onRecentUpdatesChange}
        />
      </SettingRow>
      <SettingRow
        label="Pin parent containers"
        description="Pinning a value also pins the containers around it."
        setting="state.pinCascade"
        info={{
          title: 'Pin parent containers',
          children: (
            <>
              <p>
                A pinned value is listed first in its container. With this on, the containers that
                hold it are listed first too, so the way to the value stays at the top of every
                column.
              </p>
              <p>
                Unpinning a container then also unpins everything inside it. Off, only the value you
                pin is pinned.
              </p>
              <p class={exampleClass}>
                {'Pin  character.stats.strength\n→ pinned: strength, stats and character'}
              </p>
            </>
          ),
        }}
      >
        <BooleanInput
          label="Pin parent containers"
          value={getSettings.state.pinCascade()}
          onChange={(value) => setSetting('state.pinCascade', value)}
        />
      </SettingRow>
      <SettingRow
        label="Type-ahead pause"
        description="How long to wait before typing starts a new search."
        setting="state.typeAheadResetMs"
        unit="milliseconds"
        info={{
          title: 'Type-ahead pause',
          children: (
            <>
              <p>
                In a navigator, typing letters jumps to the row that starts with them. Letters typed
                within this time add up; after a pause the next letter starts a new search.
              </p>
              <p>
                When nothing starts with what you typed, the red text stays on screen twice as long.
              </p>
              <p class={exampleClass}>
                {'s, t  (quickly) → "st" finds stats\n(a pause) t        → starts over: "t"'}
              </p>
            </>
          ),
        }}
      >
        <NumberInput
          inputProps={{ 'aria-label': 'Type-ahead pause' }}
          value={getSettings.state.typeAheadResetMs()}
          onChange={onTypeAheadResetChange}
        />
      </SettingRow>
    </>
  );
}
