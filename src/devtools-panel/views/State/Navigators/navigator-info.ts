import { createContext, onSettled, useContext } from 'solid-js';

import type { Path, ValueType } from '@/shared/shared-types';

/** What the rest of the State view needs to know of the navigator that is shown */
export interface NavigatorInfo {
  /** The path that the breadcrumbs show */
  getBreadcrumbsPath: () => Path;
  /** The types of what the navigator shows, for the filter of types in the toolbar */
  getAvailableTypes: () => ValueType[];
  /** A click on a path in the breadcrumbs. Without it, the path is selected */
  onBreadcrumbClick?: (path: Path) => void;
}

/** Gives the info of a navigator to whoever shows it; the function it returns takes it back */
export type PublishNavigatorInfo = (info: NavigatorInfo) => () => void;

// Without a provider the info goes nowhere: a navigator also works by itself
export const NavigatorInfoContext = createContext<PublishNavigatorInfo>(() => () => {});

/** Called by a navigator: the breadcrumbs and the toolbar, which are outside of it, ask for this */
export function provideNavigatorInfo(info: NavigatorInfo) {
  const publish = useContext(NavigatorInfoContext);
  onSettled(() => publish(info));
}
