import { getSettings, setSetting } from '../../../store/store';

/** Switches the filters between an icon sidebar and a bar along the top, for when there is no room for the full sidebar */
export function LayoutToggle() {
  const isSidebar = () => getSettings.search.smFilterLayout() === 'icon-sidebar';
  const toggle = () => {
    const newValue = isSidebar() ? 'top-bar' : 'icon-sidebar';
    setSetting('search.smFilterLayout', newValue);
  };

  return (
    <button
      type="button"
      class="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-sm hover:bg-slate-700"
      title={isSidebar() ? 'Show the filters along the top' : 'Show the filters in a sidebar'}
      onClick={toggle}
    >
      {isSidebar() ? '▤' : '▥'}
    </button>
  );
}
