import { createMemo } from 'solid-js';

import { getActiveState } from '@/devtools-panel/store/store';
import { getObjectPathValue } from '@/shared/get-object-path-value';
import { Path } from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

const colorClasses = {
  pathRoot: 'text-sky-500',
  pathChunk: 'text-sky-400',
  pathDot: 'text-white',
  pathBrackets: 'text-yellow-300',
  typeNumber: 'text-emerald-300 saturate-50',
  typeString: 'text-orange-300 saturate-50',
} as const;

interface Props {
  path: Path;
  statePrefix?: boolean;
}

export function PrettyPath(props: Props) {
  const chunks = createMemo(() => {
    const state = getActiveState()!;
    return props.path
      .flatMap((slug, index): Array<false | AtomProps> => {
        const partialPath = props.path.slice(0, index + 1);
        const value = getObjectPathValue(state, partialPath);
        const type = getSpecificType(value);
        if (type === 'object') {
          if (props.statePrefix || index > 0)
            return [
              { color: 'pathDot', text: '.' },
              { color: 'pathChunk', text: slug },
            ];
          return [{ color: 'pathRoot', text: slug }];
        }
        if (type === 'array')
          return [
            { color: 'pathBrackets', text: '[' },
            { color: 'typeNumber', text: slug },
            { color: 'pathBrackets', text: ']' },
          ];
        if (type === 'map')
          return [
            { color: 'pathDot', text: '.' },
            { color: 'typeString', text: 'get' },
            { color: 'pathBrackets', text: '(' },
            { color: 'typeString', text: `"${slug}"` },
            { color: 'pathBrackets', text: ')' },
          ];
        return [];
      })
      .filter((v): v is AtomProps => !!v)
      .map((atomProps) => <Atom {...atomProps} />);
  });

  return (
    <>
      <span class={colorClasses.pathRoot}>State</span>
      {chunks()}
    </>
  );
}

interface AtomProps {
  text: string | number;
  color: keyof typeof colorClasses;
}
function Atom(props: AtomProps) {
  return <span class={colorClasses[props.color]}>{props.text}</span>;
}
