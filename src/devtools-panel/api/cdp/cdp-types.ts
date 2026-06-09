export interface RemoteObject {
  type: 'object' | 'function' | 'undefined' | 'string' | 'number' | 'boolean' | 'symbol' | 'bigint';
  subtype?:
    | 'array'
    | 'null'
    | 'node'
    | 'regexp'
    | 'date'
    | 'map'
    | 'set'
    | 'weakmap'
    | 'weakset'
    | 'iterator'
    | 'generator'
    | 'error'
    | 'proxy'
    | 'promise'
    | 'typedarray'
    | 'arraybuffer'
    | 'dataview'
    | 'webassemblymemory'
    | 'wasmvalue'
    | 'internal#location'
    | 'internal#scope';
  className?: string;
  value?: any;
  unserializableValue?: string;
  description?: string;
  objectId?: string;
}

export interface ScopePropertyDescriptor {
  name: string;
  value?: RemoteObject;
  writable?: boolean;
  get?: RemoteObject;
  set?: RemoteObject;
  configurable: boolean;
  enumerable: boolean;
  wasThrown?: boolean;
  isOwn?: boolean;
  symbol?: RemoteObject;
}

export interface InternalPropertyDescriptor {
  name: string;
  value?: RemoteObject;
}

export interface ExceptionDetails {
  exceptionId: number;
  text: string;
  lineNumber: number;
  columnNumber: number;
  scriptId?: string;
  url?: string;
  stackTrace?: any;
  exception?: RemoteObject;
  executionContextId?: number;
}

// Command Parameter & Result Interfaces

export interface RuntimeEvaluateParams {
  expression: string;
  objectGroup?: string;
  includeCommandLineAPI?: boolean;
  silent?: boolean;
  contextId?: number;
  returnByValue?: boolean;
  generatePreview?: boolean;
  userGesture?: boolean;
  awaitPromise?: boolean;
  throwOnSideEffect?: boolean;
  timeout?: number;
  disableBreaks?: boolean;
  replMode?: boolean;
  allowUnsafeEvalBlockedByCSP?: boolean;
  uniqueContextId?: string;
}

export interface RuntimeEvaluateResponse {
  result: RemoteObject;
  exceptionDetails?: ExceptionDetails;
}

export interface RuntimeGetPropertiesParams {
  objectId: string;
  ownProperties?: boolean;
  accessorPropertiesOnly?: boolean;
  generatePreview?: boolean;
  nonIndexedPropertiesOnly?: boolean;
}

export interface RuntimeGetPropertiesResponse {
  result?: ScopePropertyDescriptor[];
  internalProperties?: InternalPropertyDescriptor[];
  privateProperties?: any[];
  exceptionDetails?: ExceptionDetails;
}

export interface RuntimeCallFunctionOnParams {
  objectId?: string;
  functionDeclaration: string;
  arguments?: any[];
  silent?: boolean;
  returnByValue?: boolean;
  generatePreview?: boolean;
  userGesture?: boolean;
  awaitPromise?: boolean;
  executionContextId?: number;
  objectGroup?: string;
}

export interface RuntimeCallFunctionOnResponse {
  result: RemoteObject;
  exceptionDetails?: ExceptionDetails;
}
