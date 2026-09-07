import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../lib/auth";

test("passwords are stored as salted scrypt hashes", async () => {
  const password = "BelajarAman123";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("KataSandiSalah", first), false);
});

test("malformed and missing password hashes are rejected", async () => {
  assert.equal(await verifyPassword("password", null), false);
  assert.equal(await verifyPassword("password", "plaintext-password"), false);
  assert.equal(await verifyPassword("password", "scrypt$short$broken"), false);
});
