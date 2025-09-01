import { GameMetaData } from '@/shared/shared-types';

export function getGameMetaFn(): GameMetaData | null {
  if ('SugarCube' in window) return getSugarCubeMeta();
  if ('Harlowe' in window) return getHarloweMeta();
  return null;

  function getSugarCubeMeta(): GameMetaData | null {
    const storyData = document.querySelector('tw-storydata');
    const getName = () => {
      const story = window.SugarCube.Story;
      return story.name || story.title || storyData?.getAttribute('name') || 'Untitled';
    };
    const getIfid = () => {
      return window.SugarCube.Story.ifId || storyData?.getAttribute('ifid') || '';
    };
    const getCompiler = () => {
      const creator = storyData?.getAttribute('creator');
      if (!creator) return;
      const version = storyData?.getAttribute('creator-version') ?? undefined;
      return { name: creator, version };
    };
    const getVersion = () => {
      const version = window.SugarCube.version;
      const { major, minor, patch, build } = version;
      return {
        major,
        minor,
        patch,
        build,
        fullStr: version.long(),
        shortStr: storyData?.getAttribute('format-version') || version.short(),
      };
    };
    const getStartingPassage = () => {
      if (window.SugarCube.Config.passages.start) return window.SugarCube.Config.passages.start;
      const startnode = storyData?.getAttribute('startnode');
      if (startnode)
        return (
          document.querySelector(`tw-passagedata[pid="${startnode}"]`)?.getAttribute('name') || ''
        );
      return '';
    };
    const getPassages = () => {
      return {
        start: getStartingPassage(),
        count: document.querySelectorAll('tw-passagedata').length || undefined,
      };
    };
    const getSave = () => {
      const isNewAPI = 'browser' in window.SugarCube.Save;

      const numSlots = isNewAPI
        ? (window.SugarCube.Config?.saves?.maxSlotSaves ?? 0)
        : window.SugarCube.Save.slots.length;

      const slotsUsed =
        window.SugarCube.Save.browser?.slot?.size ?? window.SugarCube.Save.slots.count();

      const storage = window.SugarCube.storage.name;
      if (!storage) {
        return {
          numSlots,
          slotsUsed,
        };
      }

      if (storage !== 'localStorage') {
        return {
          numSlots,
          slotsUsed,
          storage,
        };
      }

      const storageCapacity = 5242880;
      const storageUsed = getLocalStorageUsed();
      const storageUsedPct = (storageUsed / storageCapacity) * 100;

      return {
        numSlots,
        slotsUsed,
        storage,
        storageCapacity,
        storageUsed,
        storageUsedPct,
      };
    };

    const getSettings = () => {
      return {
        historyControls: window.SugarCube.Config.history.controls,
        historyMax: window.SugarCube.Config.history.maxStates,
      };
    };

    return {
      name: getName(),
      ifId: getIfid(),
      compiler: getCompiler(),
      format: {
        name: 'SugarCube',
        version: getVersion(),
      },
      passages: getPassages(),
      save: getSave(),
      settings: getSettings(),
    };
  }

  function getHarloweMeta(): GameMetaData | null {
    const storyData = document.querySelector('tw-storydata');
    const getName = () => {
      return storyData?.getAttribute('name') || 'Untitled';
    };
    const getIfid = () => {
      return storyData?.getAttribute('ifid') || '';
    };
    const getCompiler = () => {
      const creator = storyData?.getAttribute('creator');
      if (!creator) return;
      const version = storyData?.getAttribute('creator-version') ?? undefined;
      return { name: creator, version };
    };
    const getVersion = () => {
      const shortStr = storyData?.getAttribute('format-version');
      if (!shortStr) return null;
      const [major, minor, patch] = shortStr.split('.').map(Number);
      return {
        major,
        minor,
        patch,
        shortStr: shortStr,
      };
    };
    const getStartingPassage = () => {
      const startnode = storyData?.getAttribute('startnode');
      if (startnode)
        return (
          document.querySelector(`tw-passagedata[pid="${startnode}"]`)?.getAttribute('name') || ''
        );
      return '';
    };
    const getPassages = () => {
      return {
        start: getStartingPassage(),
        count: document.querySelectorAll('tw-passagedata').length || undefined,
      };
    };

    return {
      name: getName(),
      ifId: getIfid(),
      compiler: getCompiler(),
      format: {
        name: 'Harlowe',
        version: getVersion() ?? undefined,
      },
      passages: getPassages(),
    };
  }

  function getLocalStorageUsed() {
    let used = 0;
    for (let key in localStorage) {
      if (Object.hasOwnProperty.call(localStorage, key)) {
        const value = localStorage.getItem(key);
        used += 2 * (key.length + (value ? value.length : 0));
      }
    }
    return used;
  }
}
