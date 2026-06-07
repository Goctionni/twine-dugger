import type { CandidateGameIframes, GameMetaData } from '@/shared/shared-types';

export function getGameMetaFn(): GameMetaData | CandidateGameIframes | null {
  if ('SugarCube' in window) return getSugarCubeMeta();
  if ('Harlowe' in window) return getHarloweMeta();
  if (isChapbook()) return getChapbookMeta();
  if (isSnowman()) return getSnowmanMeta();
  // If neither is detected, look for a large-ish iframes
  const iframes = Array.from(document.querySelectorAll('iframe[src]'));
  const candidateGameIframes = iframes.filter((iframe) => {
    const size = getElVisibleSize(iframe);
    if (!size) return false;
    if (size > 300 * 200) return true;
    if (size > (window.innerWidth * window.innerHeight) / 2) return true;
    return false;
  });
  if (candidateGameIframes.length) {
    return {
      __type: 'candidate-game-iframes',
      urls: candidateGameIframes.map((iframe) => iframe.getAttribute('src')!),
    };
  }

  return null;

  function isChapbook() {
    return (
      'engine' in window &&
      'go' in window &&
      'restart' in window &&
      window['engine'] &&
      typeof window['engine'] === 'object' &&
      'story' in window['engine']
    );
  }

  function isSnowman() {
    return document.querySelector('tw-storydata[format="Snowman"][format-version^="2."');
  }

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
      return storyData?.getAttribute('name') || document.title || 'Untitled';
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

  function getChapbookMeta(): GameMetaData | null {
    const storyData = document.querySelector('tw-storydata');
    const getName = () => {
      const story = window.engine.story;
      return story.name() || storyData?.getAttribute('name') || 'Untitled';
    };
    const getIfid = () => {
      return window.engine.story.ifid() || storyData?.getAttribute('ifid') || '';
    };
    const getCompiler = () => {
      const creator = storyData?.getAttribute('creator') ?? 'unknown';
      const version = storyData?.getAttribute('creator-version') ?? window.engine.version;
      return { name: creator, version };
    };
    const getVersion = () => {
      const version = window.engine.version;
      const [major, minor, patch] = version.split('.').map(Number.parseInt);
      return {
        major,
        minor,
        patch,
        fullStr: `Chapbook ${version}`,
        shortStr: version,
      };
    };
    const getStartingPassage = () => {
      return window.engine.story.startPassage().name;
    };
    const getPassages = () => {
      return {
        start: getStartingPassage(),
        count: window.engine.story.passages().length,
      };
    };

    return {
      name: getName(),
      ifId: getIfid(),
      compiler: getCompiler(),
      format: {
        name: 'Chapbook',
        version: getVersion(),
      },
      passages: getPassages(),
    } satisfies GameMetaData;
  }

  function getSnowmanMeta(): GameMetaData | null {
    const storyData = document.querySelector('tw-storydata');
    const getName = () => {
      return window.story.name || storyData?.getAttribute('name') || 'Untitled';
    };
    const getIfid = () => {
      return storyData?.getAttribute('ifid') || '';
    };
    const getCompiler = () => {
      const creator = (window.story.creator || storyData?.getAttribute('creator')) ?? 'unknown';
      const version =
        (window.story.creatorVersion || storyData?.getAttribute('creator-version')) ??
        window.engine.version;
      return { name: creator, version };
    };
    const getVersion = () => {
      const version = storyData?.getAttribute('format-version');
      if (!version) return undefined;

      const [major, minor, patch] = version.split('.').map(Number.parseInt);
      return {
        major,
        minor,
        patch,
        fullStr: `Snowman ${version}`,
        shortStr: version,
      };
    };
    const getStartingPassage = () => {
      return window.story.passage(window.story.startPassage)?.name;
    };
    const getPassages = () => {
      const start = getStartingPassage();
      if (!start) return undefined;

      return {
        start: start,
        count: window.story.passages.length,
      };
    };

    return {
      name: getName(),
      ifId: getIfid(),
      compiler: getCompiler(),
      format: {
        name: 'Snowman',
        version: getVersion(),
      },
      passages: getPassages(),
    } satisfies GameMetaData;
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

  function getElVisibleSize(el: Element) {
    const elRect = el.getBoundingClientRect();
    const elSize = Math.max(0, elRect.width * elRect.height);
    if (!elSize) return null;

    const visibleWidth = Math.max(
      0,
      Math.min(elRect.right, window.innerWidth) - Math.max(elRect.left, 0),
    );
    const visibleHeight = Math.max(
      0,
      Math.min(elRect.bottom, window.innerHeight) - Math.max(elRect.top, 0),
    );

    return visibleWidth * visibleHeight;
  }
}
