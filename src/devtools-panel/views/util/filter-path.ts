import { Path } from '@/shared/shared-types';

const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

export function formatPath(path: Path) {
  if (!path.length) return 'State';

  return path.reduce((formatted, chunk, index) => {
    if (typeof chunk === 'number') return `${formatted}[${chunk}]`;
    if (index === 0) {
      if (identifierRegex.test(chunk)) return chunk;
      return `[${JSON.stringify(chunk)}]`;
    }
    if (identifierRegex.test(chunk)) return `${formatted}.${chunk}`;
    return `${formatted}[${JSON.stringify(chunk)}]`;
  }, '');
}

export function getFilterPathScopes(path: Path): Path[] {
  return path.map((_, index) => path.slice(0, index + 1));
}

type FilterMenuItem = {
  label: string;
  onClick: () => void;
};

export function createFilterMenuItems(
  path: Path,
  onAddFilter: (path: Path) => void,
): FilterMenuItem[] {
  const scopes = getFilterPathScopes(path);
  const lastIndex = scopes.length - 1;

  return scopes.map((scope, index) => {
    const suffix = index === lastIndex ? '' : '.*';
    return {
      label: `Filter out changes to "${formatPath(scope)}${suffix}"`,
      onClick: () => onAddFilter(scope),
    };
  });
}
