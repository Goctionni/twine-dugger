// src/content-script/content-rpc-setup.ts
import { createRpcService } from '../rpc/rpc-service';
import { type RpcResponse, type RpcRequest } from '../rpc/rpc-schemas';
import { api } from './api';

export function setupContentScriptRpc() {
  console.log('Content Script: Setting up RPC service...');

  const responseCallback = (response: RpcResponse) => {
    console.log('Content Script: Sending RPC response:', response);
    chrome.runtime.sendMessage(response);
  };

  const initRequestListener = (listener: (request: RpcRequest) => void) => {
    chrome.runtime.onMessage.addListener((message) => {
      listener(message);
      return false;
    });
  };

  createRpcService(
    'content-script', // This service's name
    api,
    responseCallback,
    initRequestListener,
  );
  console.log("Content Script: RPC service started for 'content-script'.");
}
