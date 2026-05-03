/**
 * 校验 lib/product-images.json —— Unsplash 对 HEAD 常返回 404，改用 GET + User-Agent。
 * 用法：node scripts/verify-product-images.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(__dirname, "..", "lib", "product-images.json");
const map = JSON.parse(readFileSync(jsonPath, "utf8"));

const UA =
  "Mozilla/5.0 (compatible; SecureTrade/1.0; +https://unsplash.com license compliance check)";

async function check(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept: "image/avif,image/webp,image/*;q=0.8,*/*;q=0.5",
      },
    });
    if (!res.ok) return res.status;
    if (res.body) await res.body.cancel();
    return res.status;
  } finally {
    clearTimeout(t);
  }
}

let failed = 0;
for (const [id, url] of Object.entries(map)) {
  try {
    const status = await check(url);
    if (status !== 200) {
      console.error(`${id} → ${status}`);
      failed++;
    } else {
      console.log(`${id} OK`);
    }
  } catch (e) {
    console.error(`${id} ERROR`, e.cause?.message ?? e.message);
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} URL(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${Object.keys(map).length} product images OK.`);
