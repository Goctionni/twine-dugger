import { GameMetaData } from '@/devtools-panel/utils/remote-functions/getMetaData';

import { getGameMetaData } from '../../store/store';

export function MetaInfo() {
  return (
    <div class="flex items-center space-x-3 text-sm text-gray-400">
      <span>|</span>
      <span>
        Game: <span class="font-medium text-gray-300">{getGameMetaData()?.name}</span>
      </span>
      {getGameMetaData() && (
        <span>
          StoryFormat:{' '}
          <span class="font-medium text-gray-300">
            {getGameMetaData()?.format?.name} {getGameMetaData()?.format?.version?.shortStr}
          </span>
        </span>
      )}
      {getGameMetaData()?.compiler && (
        <span>
          Compiled with:{' '}
          <span class="font-medium text-gray-300">
            {getGameMetaData()?.compiler?.name} {getGameMetaData()?.compiler?.version}
          </span>
        </span>
      )}
    </div>
  );
}
