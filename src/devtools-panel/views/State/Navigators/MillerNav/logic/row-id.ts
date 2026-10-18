/** The id of a row of a Miller view: what the tree names as its active row, as well as the row has */
export const getRowId = (treeId: string, depth: number, key: string | number) =>
  `${treeId}-${depth}-${encodeURIComponent(String(key))}`;
