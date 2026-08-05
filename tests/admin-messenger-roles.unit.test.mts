import assert from "node:assert/strict";
import { test } from "node:test";

import { ADMIN_MESSENGER_ROLES, isAdminMessengerRole } from "../lib/admin-messenger/types.ts";

test("Admin Messenger включает игроков и партнёров", () => {
  assert.deepEqual(ADMIN_MESSENGER_ROLES, ["PLAYER", "PARTNER"]);
  assert.equal(isAdminMessengerRole("PLAYER"), true);
  assert.equal(isAdminMessengerRole("PARTNER"), true);
  assert.equal(isAdminMessengerRole("UNSELECTED"), false);
});
