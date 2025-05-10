import { RpcActor, RpcRequestCallback } from './rpc-schemas';
import { v4 as uuid } from 'uuid';

type ProxyCallback = (path: Array<string>, args: unknown[]) => Promise<unknown>;
function createProxy(callback: ProxyCallback) {
  return new Proxy(() => {}, {
    apply(_, _thisArg, args) {
      return new Promise((resolve, reject) => {
        callback([], args).then(resolve, reject);
        setTimeout(resolve, 10000);
      });
    },
    get(_, key) {
      if (typeof key !== 'string') throw new Error('Cant handle symbol in callpath');
      return createProxy((path, args) => callback([key, ...path], args));
    },
  });
}

export function createRpcClient<T extends unknown>(
  clientName: RpcActor,
  apiName: RpcActor,
  callback: RpcRequestCallback,
) {
  return createProxy((path, args) => {
    return callback({
      id: uuid(),
      from: clientName,
      to: apiName,
      type: 'rpc',
      subtype: 'request',
      path,
      args,
    });
  }) as unknown as T;
}
