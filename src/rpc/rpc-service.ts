import { get, isZodDef } from '../helper';
import { RpcRequest, RpcResponse, RpcRequestDef } from './rpc-schemas';

type ApiFunction = (...args: unknown[]) => Promise<unknown>;
type ResponseCallback = (response: RpcResponse) => void;
type RequestListener = (request: RpcRequest) => void;
type InitRequestListener = (listener: RequestListener) => void;

export function createRpcService(
  name: string,
  api: object,
  responseCallback: ResponseCallback,
  initRequestListener: InitRequestListener,
) {
  initRequestListener((request) => {
    if (!isZodDef(request, RpcRequestDef)) return;
    if (request.to !== name) return;

    const baseResponse = {
      type: 'rpc',
      subtype: 'response',
      id: request.id,
      to: request.from,
      tabId: request.tabId,
    } as const;

    const apiFn = get<ApiFunction>(api, request.path);
    if (typeof apiFn !== 'function') {
      return responseCallback({
        ...baseResponse,
        isError: true,
        value: `Path ${request.path.join('.')} not found in Api ${name}`,
      });
    }

    apiFn(...request.args).then(
      (value) => {
        return responseCallback({
          ...baseResponse,
          isError: false,
          value,
        });
      },
      (reason) => {
        return responseCallback({
          ...baseResponse,
          isError: true,
          value: reason,
        });
      },
    );
  });
}
