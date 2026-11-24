// Cifra le sorprese con la password admin.
// Legge  _segreto/sorprese.json  e  _segreto/password.txt  (entrambi esclusi da git)
// Scrive data/sorprese.enc.json  (questo va su GitHub: senza password è illeggibile)
// Uso: node tools/encrypt.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { encrypt } from "./crypto.mjs";

const root = new URL("../", import.meta.url);
const password = (process.env.SURPRISES_KEY || readFileSync(new URL("_segreto/password.txt", root), "utf8")).trim();
const list = JSON.parse(readFileSync(new URL("_segreto/sorprese.json", root), "utf8"))
  .sort((a, b) => a.unlock.localeCompare(b.unlock));

for (const s of list) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.unlock)) throw new Error(`Data non valida: ${s.unlock}`);
}

const out = {
  unlocks: list.map((s) => s.unlock),
  vault: await encrypt(list.map(({ unlock, ...rest }) => rest), password),
};

mkdirSync(new URL("data/", root), { recursive: true });
writeFileSync(new URL("data/sorprese.enc.json", root), JSON.stringify(out, null, 2) + "\n");
console.log(`Cifrate ${list.length} sorprese in data/sorprese.enc.json`);
console.log(list.map((s) => `  ${s.unlock}  ${s.title}`).join("\n"));
