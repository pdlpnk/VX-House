import assert from "node:assert/strict";
import { test } from "node:test";

import { ADMIN_MESSENGER_ROLES, isAdminMessengerRole, MESSENGER_GEOS, isMessengerGeo } from "../lib/admin-messenger/types.ts";

test("Messenger GEO uses IR in storage and IRN only as a label", () => {
  assert.deepEqual(MESSENGER_GEOS.map(({ code }) => code), ["TR", "AZ", "IR"]);
  assert.equal(MESSENGER_GEOS[2].label, "IRN");
  for (const value of ["TR", "AZ", "IR"]) assert.equal(isMessengerGeo(value), true);
  for (const value of ["IRN", "US", "", null, undefined]) assert.equal(isMessengerGeo(value), false);
});

test("Admin Messenger включает игроков и партнёров", () => {
  assert.deepEqual(ADMIN_MESSENGER_ROLES, ["PLAYER", "PARTNER"]);
  assert.equal(isAdminMessengerRole("PLAYER"), true);
  assert.equal(isAdminMessengerRole("PARTNER"), true);
  assert.equal(isAdminMessengerRole("UNSELECTED"), false);
});
