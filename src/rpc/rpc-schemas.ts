import { z } from 'zod';

export const RpcActorDef = z.union([z.literal('devtools-panel'), z.literal('content-script')]);

export const RpcBaseMessageDef = z.object({
  type: z.literal('rpc'),
  to: RpcActorDef,
  tabId: z.number().optional(),
});

export const RpcRequestDef = RpcBaseMessageDef.extend({
  subtype: z.literal('request'),
  from: RpcActorDef,
  id: z.string(),
  path: z.array(z.string()),
  args: z.array(z.any()),
});

export const RpcResponseDef = RpcBaseMessageDef.extend({
  subtype: z.literal('response'),
  id: z.string(),
  value: z.any().optional(),
  isError: z.boolean(),
});

export type RpcBaseMessage = z.infer<typeof RpcBaseMessageDef>;
export type RpcActor = z.infer<typeof RpcActorDef>;
export type RpcRequest = z.infer<typeof RpcRequestDef>;
export type RpcResponse = z.infer<typeof RpcResponseDef>;
export type RpcRequestCallback = <T = unknown>(request: RpcRequest) => Promise<T>;

type SendMessageFunction = (message: RpcBaseMessage) => void;

export interface RpcRoute {
  name: RpcActor;
  sendFunction: SendMessageFunction;
  initListener: (sendFunction: SendMessageFunction) => void;
}
