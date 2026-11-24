import { webcrypto as crypto } from "node:crypto";

const ITER = 250000;

async function deriveKey(password, salt, iter) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

const toB64 = (u8) => Buffer.from(u8).toString("base64");
const fromB64 = (s) => new Uint8Array(Buffer.from(s, "base64"));

export async function encrypt(obj, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITER);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return { iter: ITER, salt: toB64(salt), iv: toB64(iv), ct: toB64(new Uint8Array(ct)) };
}

export async function decrypt(vault, password) {
  const key = await deriveKey(password, fromB64(vault.salt), vault.iter);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(vault.iv) }, key, fromB64(vault.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
