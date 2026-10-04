import { createGetSetting, createSetSetting } from '../../../store/store';

const getNarrowStyle = createGetSetting('search.narrowStyle');
const setNarrowStyle = createSetSetting('search.narrowStyle');

/** Switches the filters between a strip of icons and a bar, for when there is no room for a rail */
export function LayoutToggle() {
  return (
    <button
      type="button"
      class="cursor-pointer rounded-sm px-2 py-1 text-sm hover:bg-slate-700"
      title={
        getNarrowStyle() === 'strip' ? 'Show the filters as a bar' : 'Show the filters as a strip'
      }
      onClick={() => setNarrowStyle(getNarrowStyle() === 'strip' ? 'bar' : 'strip')}
    >
      {getNarrowStyle() === 'strip' ? '▤' : '▥'}
    </button>
  );
}
