import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "./app";

function closeServer(server: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

test("createApp exposes the health handler without binding a port", async () => {
  const app = createApp();
  const server = createServer(app);

  expect(server.listening).toBe(false);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const address = server.address() as AddressInfo;
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/health`
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  } finally {
    await closeServer(server);
  }
});
