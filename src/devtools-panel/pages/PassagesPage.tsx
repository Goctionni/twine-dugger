import type { ParsedPassageData } from '@/shared/shared-types';

import { getPassageData, getSelectedPassage } from '../store/passages';
import { getGameMetaData, setViewState } from '../store/store';
import { MovableSplit } from '../ui/util/MovableSplit';
import { PassageList } from '../views/Passage/PassageList';
import { PassageView } from '../views/Passage/PassageView';

export function PassagesPage() {
  const format = () => getGameMetaData()?.format;
  return (
    <MovableSplit
      splitKey="passages-page"
      initialLeftWidthPercent={35}
      leftContent={
        <PassageList
          onPassageClick={setSelectedPassage}
          passages={getPassageData()}
          selectedPassage={getSelectedPassage()}
        />
      }
      rightContent={<PassageView language={format()?.name ?? ''} passage={getSelectedPassage()} />}
    />
  );
}

function setSelectedPassage(passage: ParsedPassageData) {
  setViewState('passages', 'selected', passage.name);
}
