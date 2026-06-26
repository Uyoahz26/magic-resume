/**
 * Post-build patch for Cloudflare Workers deployment.
 *
 * Problem: TanStack Start's fetch handler receives (request, env, ctx) but treats
 * env as context. Our requireEnv() looks for env in globalThis.env, which is never set.
 *
 * Solution: Unconditionally set globalThis.env from arguments[1] when available.
 * In Workers, fetch(request, env, ctx) passes env as 2nd arg.
 * In Node.js, server.mjs sets it explicitly, so this is harmless.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const serverPath = resolve(process.cwd(), "dist/server/server.js");
let content = readFileSync(serverPath, "utf-8");

// Original pattern
const original = `function yc(e){return{async fetch(...t){return await e.fetch(...t)}}}`;
// Patched: always try to set env from 2nd fetch argument
const patched = `function yc(e){return{async fetch(...t){t.length>1&&(globalThis.env=t[1]);return await e.fetch(...t)}}}`;

if (content.includes(original)) {
  content = content.replace(original, patched);
  writeFileSync(serverPath, content);
  console.log("✅ Patched server.js for Workers env access");
} else if (content.includes("globalThis.env=t[1]")) {
  console.log("✅ server.js already patched");
} else {
  console.error("❌ Could not find pattern to patch in server.js");
  process.exit(1);
}
