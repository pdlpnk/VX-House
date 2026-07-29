import { randomBytes } from "node:crypto";
import { createServer } from "node:http";

export async function startDatabaseLockCoordinator() {
  const secret = randomBytes(32).toString("base64url");
  const queue = [];
  let activeLease = null;
  let activeTimer = null;

  const release = (lease) => {
    if (activeLease !== lease) return false;
    activeLease = null;
    clearTimeout(activeTimer);
    activeTimer = null;
    queue.shift()?.();
    return true;
  };

  const grant = (response) => {
    const lease = randomBytes(24).toString("base64url");
    activeLease = lease;
    activeTimer = setTimeout(() => release(lease), 30_000);
    response.writeHead(200, { "content-type": "text/plain" });
    response.end(lease);
  };

  const server = createServer((request, response) => {
    if (request.headers.authorization !== `Bearer ${secret}`) {
      response.writeHead(401).end();
      return;
    }
    if (request.method === "POST" && request.url === "/acquire") {
      const pending = () => grant(response);
      if (activeLease) queue.push(pending);
      else pending();
      return;
    }
    if (request.method === "POST" && request.url === "/release") {
      response.writeHead(release(request.headers["x-vx-database-lease"]) ? 204 : 409).end();
      return;
    }
    response.writeHead(404).end();
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Не удалось запустить координатор development-базы.");

  return {
    url: `http://127.0.0.1:${address.port}`,
    secret,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}
