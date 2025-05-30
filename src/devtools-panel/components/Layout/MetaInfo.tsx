import { GameMetaData } from '@/devtools-panel/utils/remote-functions/getMetaData';

export interface MetaInfoProps {
  gameName: string;
  gameEngine: string;
}

export function MetaInfo(props: GameMetaData) {
  return (
    <div class="flex items-center space-x-3 text-sm text-gray-400">
      <span>|</span>
      <span>
        Game: <span class="font-medium text-gray-300">{props.name}</span>
      </span>
      {props.format && (
        <span>
          StoryFormat:{' '}
          <span class="font-medium text-gray-300">
            {props.format.name} {props.format.version?.shortStr}
          </span>
        </span>
      )}
      {props.compiler && (
        <span>
          Compiled with:{' '}
          <span class="font-medium text-gray-300">
            {props.compiler.name} {props.compiler.version}
          </span>
        </span>
      )}
    </div>
  );
}
