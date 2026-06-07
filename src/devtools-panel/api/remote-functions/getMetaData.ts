import type {
  CandidateGameIframes,
  ChapbookGlobals,
  GameMetaData,
  HarloweGlobals,
  SnowmanGlobals,
  SugarCubeGlobals,
} from '@/shared/shared-types';

type SchemaFn = (value: unknown) => boolean;
type LeafSpec =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'function'
  | 'truthy'
  | 'falsy'
  | 'nullish'
  | 'not-nullish'
  | SchemaFn;

type NanoSchema = LeafSpec | LeafSpec[] | SchemaObject;
interface SchemaObject {
  [key: string]: NanoSchema;
}

export function getGameMetaFn(): GameMetaData | CandidateGameIframes | null {
  // Since remote-execute can only run fully self-contained functions...
  // `isType` is basically a budget replica of arktype.
  const isType = <T>(value: unknown, schema: NanoSchema): value is T => {
    if (schema === 'string') return typeof value === 'string';
    if (schema === 'number') return typeof value === 'number';
    if (schema === 'boolean') return typeof value === 'boolean';
    if (schema === 'object') return !!value && !Array.isArray(value) && typeof value === 'object';
    if (schema === 'function') return typeof value === 'function';
    if (schema === 'array') return Array.isArray(value);
    if (schema === 'truthy') return !!value;
    if (schema === 'falsy') return !value;
    if (schema === 'nullish') return value === null || value === undefined;
    if (schema === 'not-nullish') return value !== null && value !== undefined;
    if (typeof schema === 'function') return schema(value);
    if (Array.isArray(schema)) return schema.some((schemaItem) => isType(value, schemaItem));
    if (schema && typeof schema === 'object') {
      if (!value || typeof value !== 'object') return false;
      return Object.entries(schema).every(([property, propertyValue]) => {
        return isType((value as Record<string, unknown>)[property], propertyValue);
      });
    }
    return false;
  };

  const isArray = (value: unknown) => isType<unknown[]>(value, 'array');
  const isArrayOf = <T>(value: unknown, schema: NanoSchema): value is T[] =>
    isArray(value) && value.every((item) => isType(item, schema));

  const genericPassageSchema: NanoSchema = {
    id: 'number',
    name: 'string',
    source: 'string',
    tags: (tags) => isArrayOf<string>(tags, 'string'),
  };

  const sugarCubeSchema: NanoSchema = {
    SugarCube: {
      Config: {
        passages: 'object',
        history: 'object',
      },
      Save: {
        slots: 'object',
      },
      State: {
        variables: 'object',
        passage: 'string',
      },
      Story: {
        name: 'string',
        title: 'string',
        ifId: 'string',
        has: 'function',
        get: 'function',
        add: 'function',
      },
      storage: 'object',
    },
  };

  const harloweSchema: NanoSchema = {
    Harlowe: {
      API_ACCESS: {
        STATE: 'object',
        ENGINE: 'object',
        PASSAGES: 'object',
      },
    },
  };

  const chapbookSchema: NanoSchema = {
    engine: {
      state: {
        get: 'function',
        set: 'function',
        saveToObject: 'function',
        restoreFromObject: 'function',
      },
      story: {
        ifid: 'function',
        name: 'function',
        passages: 'function',
        startPassage: 'function',
      },
    },
    go: 'function',
    restart: 'function',
  };

  const snowmanSchema: NanoSchema = {
    story: {
      name: 'string',
      startPassage: 'number',
      creator: 'string',
      creatorVersion: 'string',
      history: (history) => isArrayOf(history, 'number'),
      state: 'object',
      passages: (passages) => isArrayOf(passages, genericPassageSchema),
      show: 'function',
    },
    passage: genericPassageSchema,
  };

  const isSugarCube = (value: unknown): value is SugarCubeGlobals =>
    isType<SugarCubeGlobals>(value, sugarCubeSchema);

  const isHarlowe = (value: unknown): value is HarloweGlobals =>
    isType<HarloweGlobals>(value, harloweSchema);

  const isChapbook = (value: unknown): value is ChapbookGlobals =>
    isType<ChapbookGlobals>(value, chapbookSchema);

  const isSnowman = (value: unknown): value is SnowmanGlobals =>
    isType<SnowmanGlobals>(value, snowmanSchema);

  const sugarcube = () => {
    const value: unknown = window;
    if (!isSugarCube(value)) throw new Error('Cannot access sugarcube when sugarcube isnt loaded');
    return value.SugarCube;
  };

  const chapbook = () => {
    const value: unknown = window;
    if (!isChapbook(value)) throw new Error('Cannot access chapbook when chapbook isnt loaded');
    return value;
  };

  const snowman = () => {
    const value: unknown = window;
    if (!isSnowman(value)) throw new Error('Cannot access snowman when snowman isnt loaded');
    return value;
  };

  if (isSugarCube(window)) return getSugarCubeMeta();
  if (isHarlowe(window)) return getHarloweMeta();
  if (isChapbook(window)) return getChapbookMeta();
  if (isSnowman(window)) return getSnowmanMeta();

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

  function getSugarCubeMeta(): GameMetaData | null {
    const storyData = document.querySelector('tw-storydata');
    const getName = () => {
      const story = sugarcube().Story;
      return story.name || story.title || storyData?.getAttribute('name') || 'Untitled';
    };
    const getIfid = () => {
      return sugarcube().Story.ifId || storyData?.getAttribute('ifid') || '';
    };
    const getCompiler = () => {
      const creator = storyData?.getAttribute('creator');
      if (!creator) return;
      const version = storyData?.getAttribute('creator-version') ?? undefined;
      return { name: creator, version };
    };
    const getVersion = () => {
      const version = sugarcube().version;
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
      if (sugarcube().Config.passages.start) return sugarcube().Config.passages.start;
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
      const isNewAPI = 'browser' in sugarcube().Save;

      const numSlots = isNewAPI
        ? (sugarcube().Config?.saves?.maxSlotSaves ?? 0)
        : sugarcube().Save.slots.length;

      const slotsUsed = sugarcube().Save.browser?.slot?.size ?? sugarcube().Save.slots.count();

      const storage = sugarcube().storage.name;
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
        historyControls: sugarcube().Config.history.controls,
        historyMax: sugarcube().Config.history.maxStates,
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
      const story = chapbook().engine.story;
      return story.name() || storyData?.getAttribute('name') || 'Untitled';
    };
    const getIfid = () => {
      return chapbook().engine.story.ifid() || storyData?.getAttribute('ifid') || '';
    };
    const getCompiler = () => {
      const creator = storyData?.getAttribute('creator') ?? 'unknown';
      const version = storyData?.getAttribute('creator-version') ?? chapbook().engine.version;
      return { name: creator, version };
    };
    const getVersion = () => {
      const version = chapbook().engine.version;
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
      return chapbook().engine.story.startPassage().name;
    };
    const getPassages = () => {
      return {
        start: getStartingPassage(),
        count: chapbook().engine.story.passages().length,
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
      return snowman().story.name || storyData?.getAttribute('name') || 'Untitled';
    };
    const getIfid = () => {
      return storyData?.getAttribute('ifid') || '';
    };
    const getCompiler = () => {
      const creator = (snowman().story.creator || storyData?.getAttribute('creator')) ?? 'unknown';
      const version =
        (snowman().story.creatorVersion || storyData?.getAttribute('creator-version')) ?? '';
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
      return snowman().story.passage(snowman().story.startPassage)?.name;
    };
    const getPassages = () => {
      const start = getStartingPassage();
      if (!start) return undefined;

      return {
        start: start,
        count: snowman().story.passages.length,
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
