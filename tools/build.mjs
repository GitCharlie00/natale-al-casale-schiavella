// Genera assets/surprises.js per il sito pubblicato.
// Mette in chiaro SOLO le sorprese la cui data è arrivata (mezzanotte, ora italiana);
// il resto resta nel vault cifrato, leggibile solo con la password admin.
// Gira nella GitHub Action ogni notte; in locale: node tools/build.mjs
// Per provare un'altra data: NOW=2026-12-06 node tools/build.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { decrypt } from "./crypto.mjs";

const root = new URL("../", import.meta.url);
const pwFile = new URL("_segreto/password.txt", root);
const password = (process.env.SURPRISES_KEY || (existsSync(pwFile) ? readFileSync(pwFile, "utf8") : "")).trim();
if (!password) throw new Error("Manca la password: imposta SURPRISES_KEY o crea _segreto/password.txt");

const { unlocks, vault } = JSON.parse(readFileSync(new URL("data/sorprese.enc.json", root), "utf8"));
const all = await decrypt(vault, password);

const now = process.env.NOW ? new Date(process.env.NOW + "T12:00:00+01:00") : new Date();
const items = unlocks.map((unlock, i) => {
  const open = now >= new Date(unlock + "T00:00:00+01:00");
  return open ? { unlock, data: all[i] } : { unlock };
});

const js = "// Generato da tools/build.mjs, non modificare a mano.\nwindow.SURPRISES = " +
  JSON.stringify({ items, vault }, null, 2) + ";\n";
writeFileSync(new URL("assets/surprises.js", root), js);
console.log(`Build ${now.toISOString()}: aperte ${items.filter((x) => x.data).length}/${items.length}`);
