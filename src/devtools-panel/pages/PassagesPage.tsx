import type { ParsedPassageData } from '@/shared/shared-types';

import { getPassageData, getSelectedPassage } from '../store/passages';
import { getGameMetaData, getSettings, setSetting, setViewState } from '../store/store';
import { MovableSplit } from '../ui/util/movable-split/MovableSplit';
import { PassageList } from '../views/Passage/PassageList';
import { PassageView } from '../views/Passage/PassageView';

export function PassagesPage() {
  const format = () => getGameMetaData()?.format;
  return (
    <MovableSplit
      splitKey="passages-page"
      direction={getSettings.passages.splitDirection()}
      onDirectionChange={(direction) => setSetting('passages.splitDirection', direction)}
      initialFirstSizePercent={35}
      firstLabel="Passages"
      secondLabel="Passage"
      firstContent={
        <PassageList
          onPassageClick={setSelectedPassage}
          passages={getPassageData()}
          selectedPassage={getSelectedPassage()}
        />
      }
      secondContent={<PassageView language={format()?.name ?? ''} passage={getSelectedPassage()} />}
    />
  );
}

function setSelectedPassage(passage: ParsedPassageData) {
  setViewState('passages', 'selected', passage.name);
}
