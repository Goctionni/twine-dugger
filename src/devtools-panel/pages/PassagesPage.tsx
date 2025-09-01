import { ParsedPassageData } from '@/shared/shared-types';

import { createGetViewState, getGameMetaData, getPassageData, setViewState } from '../store';
import { MovableSplit } from '../ui/util/MovableSplit';
import { PassageList } from '../views/Passage/PassageList';
import { PassageView } from '../views/Passage/PassageView';

export function PassagesPage() {
  const format = () => getGameMetaData()?.format;
  const getSelectedPassage = createGetViewState('passage', 'selected');
  return (
    <MovableSplit
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
  setViewState('passage', 'selected', passage);
}
