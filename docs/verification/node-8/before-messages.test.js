import { test } from "bun:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { flushMessages } from "./messages.js";

test("a reentrant send sees the original snapshot", () => {
  const messages = ["first"];
  let observed;
  const count = flushMessages(messages, batch => {
    messages.push("later");
    observed = [...batch];
  });
  deepStrictEqual(observed, ["first"]);
  deepStrictEqual(messages, ["first", "later"]);
  strictEqual(count, 2);
});

test("the batch remains separate after send returns", () => {
  const messages = ["first"];
  let batch;
  strictEqual(flushMessages(messages, sent => { batch = sent; }), 1);
  messages.push("later");
  deepStrictEqual(batch, ["first"]);
});
