/** Binds to port 0 and returns the OS-assigned port number */
export async function getRandomPort(): Promise<number> {
  const { createServer } = await import('node:net');
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error('Failed to get port'));
      }
    });
  });
}

/** Starts an HTTP server on a random port, returns { port, close } */
export async function createTestHttpServer(
  handler: (
    req: import('node:http').IncomingMessage,
    res: import('node:http').ServerResponse,
  ) => void,
): Promise<{ port: number; close: () => Promise<void> }> {
  const { createServer } = await import('node:http');
  const port = await getRandomPort();
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(port, resolve));
  return {
    port,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
