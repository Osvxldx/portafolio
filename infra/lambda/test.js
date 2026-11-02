// Local tests for the Kindness Chain Lambda, using an in-memory store.
// Run with: node infra/lambda/test.js
const assert = require("assert");
const { createHandler, isRude } = require("./index.js");

function memoryStore() {
  const items = [], rate = new Map();
  return {
    items,
    async list(limit) { return items.filter((i) => i.status === "visible").sort((a, b) => (a.sk < b.sk ? 1 : -1)).slice(0, limit); },
    async count() { return items.filter((i) => i.status === "visible").length; },
    async put(item) { items.push(item); },
    async claim(hash, now) { const t = rate.get(hash); if (t && t >= now) return false; rate.set(hash, now + 30); return true; }
  };
}
const ev = (method, body, ip = "1.2.3.4") => ({ requestContext: { http: { method, sourceIp: ip } }, body: body && JSON.stringify(body) });

(async () => {
  const store = memoryStore();
  const notified = [];
  const handler = createHandler(store, async (l) => { notified.push(l); });
  let passed = 0;
  const check = (name, fn) => Promise.resolve(fn()).then(() => { passed++; console.log("ok  " + name); });

  await check("empty chain returns count 0", async () => {
    const r = await handler(ev("GET")); const b = JSON.parse(r.body);
    assert.strictEqual(r.statusCode, 200); assert.strictEqual(b.count, 0); assert.deepStrictEqual(b.links, []);
  });
  await check("preset action is saved", async () => {
    const r = await handler(ev("POST", { name: "Ana", actionId: "thank" }));
    assert.strictEqual(r.statusCode, 201);
    assert.strictEqual(JSON.parse(r.body).link.text, "Thank someone who helped me");
  });
  await check("same visitor is rate limited", async () => {
    const r = await handler(ev("POST", { name: "Ana", actionId: "smile" }));
    assert.strictEqual(r.statusCode, 429);
  });
  await check("custom text waits for review and is not public yet", async () => {
    const r = await handler(ev("POST", { name: "José", customText: "Cook dinner for my mom" }, "5.6.7.8"));
    assert.strictEqual(r.statusCode, 202);
    assert.strictEqual(JSON.parse(r.body).pending, true);
    assert.strictEqual(store.items[1].status, "pending");
    assert.strictEqual(notified.length, 1);
    const b = JSON.parse((await handler(ev("GET"))).body);
    assert.strictEqual(b.count, 1);
    assert.ok(!b.links.some((l) => l.name === "José"));
  });
  await check("approved custom text shows on the chain", async () => {
    store.items[1].status = "visible"; // what Osvaldo does in the DynamoDB console
    const b = JSON.parse((await handler(ev("GET"))).body);
    assert.strictEqual(b.count, 2);
  });
  await check("tricky rude text is caught", () => {
    ["fuuuuck", "f u u c k", "you are stupid", "matate", "hitler was right", "Ad0lf H1tler", "kill urself", "eres un tarado"]
      .forEach((s) => assert.strictEqual(isRude(s), true, s));
  });
  await check("phone numbers with spaces are rejected", async () => {
    const r = await handler(ev("POST", { name: "Spam", customText: "call me 222 123 4567" }, "9.9.9.6"));
    assert.strictEqual(r.statusCode, 400);
  });
  await check("names must look like a first name", async () => {
    for (const name of ["Osvaldo es feo y apesta", "Hitler", "Puto"]) {
      const r = await handler(ev("POST", { name, actionId: "thank" }, "9.9.8." + name.length));
      assert.strictEqual(r.statusCode, 400, name);
    }
    const ok = await handler(ev("POST", { name: "Ana María", actionId: "thank" }, "9.9.7.1"));
    assert.strictEqual(ok.statusCode, 201);
  });
  await check("rude custom text is rejected", async () => {
    const r = await handler(ev("POST", { name: "Troll", customText: "eres un p3nd3jo" }, "9.9.9.1"));
    assert.strictEqual(r.statusCode, 400);
  });
  await check("links are rejected", async () => {
    const r = await handler(ev("POST", { name: "Spam", customText: "visit www.spam.com now" }, "9.9.9.2"));
    assert.strictEqual(r.statusCode, 400);
  });
  await check("rude name is rejected", async () => {
    const r = await handler(ev("POST", { name: "Fuck", actionId: "thank" }, "9.9.9.3"));
    assert.strictEqual(r.statusCode, 400);
  });
  await check("unknown preset is rejected", async () => {
    const r = await handler(ev("POST", { name: "Leo", actionId: "hack" }, "9.9.9.4"));
    assert.strictEqual(r.statusCode, 400);
  });
  await check("invalid JSON is rejected", async () => {
    const r = await handler({ requestContext: { http: { method: "POST", sourceIp: "9.9.9.5" } }, body: "{oops" });
    assert.strictEqual(r.statusCode, 400);
  });
  await check("normal words are not flagged", () => {
    ["Maricela", "Calcular la computadora", "Push it to the limit", "Vergüenza no", "Help my classmate", "Disputa resuelta",
      "Ver a mi abuela", "Comer tomates", "Pass the class", "Assist my teammate", "Cook a good meal", "Llamar a mi mamá", "Comprar peras"]
      .forEach((s) => assert.strictEqual(isRude(s), false, s));
  });
  await check("hidden links disappear and newest comes first", async () => {
    store.items[0].status = "hidden"; // what Osvaldo does in the DynamoDB console
    const b = JSON.parse((await handler(ev("GET"))).body);
    assert.strictEqual(b.count, 2);
    assert.strictEqual(b.links[0].name, "Ana María");
    assert.strictEqual(b.links[1].name, "José");
    assert.ok(!("pk" in b.links[0]) && !("status" in b.links[0]));
  });
  await check("other methods return 405", async () => {
    assert.strictEqual((await handler(ev("DELETE"))).statusCode, 405);
  });

  console.log(`\n${passed} tests passed`);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
