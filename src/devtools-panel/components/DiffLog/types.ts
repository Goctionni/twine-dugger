import { Diff } from '@content/util/types';

export type Frame = {
  timestamp: Date;
  passage: string;
  changes: Diff[];
};
