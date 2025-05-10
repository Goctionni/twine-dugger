import { RpcRoute } from './rpc-schemas';

export function createRpcRouter(routes: RpcRoute[]) {
  for (const route of routes) {
    route.initListener((message) => {
      const targetRoute = routes.find((item) => item.name === message.to);
      if (!targetRoute)
        return console.error(
          `Could not route message to '${message.to}', no route with that name was found.`,
          message,
        );
      targetRoute.sendFunction(message);
    });
  }
}
