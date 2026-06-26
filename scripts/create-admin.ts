#!/usr/bin/env tsx
/**
 * scripts/create-admin.ts
 *
 * 把指定 email 的用户设为管理员。
 * 用法:
 *   pnpm tsx scripts/create-admin.ts user@example.com
 */

import { createClient } from "@libsql/client";

const email = process.argv[2];
if (!email) {
  console.error("用法: pnpm tsx scripts/create-admin.ts <email>");
  process.exit(1);
}

const url =
  process.env.D1_URL ??
  process.env.TURSO_URL ??
  "file:./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/";
const authToken = process.env.D1_TOKEN ?? process.env.TURSO_TOKEN;

const client = createClient({ url, authToken });

async function main() {
  const user = await client.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [email.toLowerCase()],
  });
  if (user.rows.length === 0) {
    console.error(`用户 ${email} 不存在,请先注册账号`);
    process.exit(1);
  }
  const userId = user.rows[0].id as string;
  await client.execute({
    sql: "INSERT OR IGNORE INTO admins(user_id, granted_at) VALUES(?, ?)",
    args: [userId, Date.now()],
  });
  console.log(`✓ ${email} (${userId}) 已设为管理员`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
