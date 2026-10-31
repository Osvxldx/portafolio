// Builds infra/kindness-chain.yaml by placing lambda/index.js inside the template.
// Run with: node infra/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(dir, "template.src.yaml"), "utf8");
const code = fs.readFileSync(path.join(dir, "lambda", "index.js"), "utf8").replace(/\r\n/g, "\n").trimEnd();
const indented = code.split("\n").map((l) => (l ? "          " + l : "")).join("\n");
const out = src.replace(/\r\n/g, "\n").replace("__LAMBDA_CODE__", indented);
fs.writeFileSync(path.join(dir, "kindness-chain.yaml"), out);
console.log(`Wrote infra/kindness-chain.yaml (${out.length} characters, lambda ${code.length})`);
