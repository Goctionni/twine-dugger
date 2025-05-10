import { Api } from '../content-script/api';
import { createRpcClient } from '../rpc/rpc-client';
import { sendApiCall } from './sendApiCall';

// Create the RPC client
export const api = createRpcClient<Api>(
  'devtools-panel', // This client's name
  'content-script', // Name of the API/actor it's calling
  sendApiCall,
);

// Example usage (can be called from your SolidJS components)
export async function testPing() {
  try {
    console.log('DevTools Panel: Sending ping...');
    const response = await api.ping();
    console.log('DevTools Panel: Ping response:', response); // Should be "pong"
    return response;
  } catch (error) {
    console.error('DevTools Panel: Ping error:', error);
    throw error;
  }
}
