/** The id of a row in the page, for `aria-activedescendant`: made of the id of the tree and the key of the path of the row */
export const getRowDomId = (treeId: string, rowId: string) =>
  `${treeId}-${encodeURIComponent(rowId)}`;
