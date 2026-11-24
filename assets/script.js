/* ================================================================
   Configurazione della festa
   ================================================================ */
const PARTY = {
  title: "Festa di Natale al Casale Schiavella",
  // 18:30 ora italiana (CET, +01:00)
  start: new Date("2026-12-19T18:30:00+01:00"),
  end: new Date("2026-12-20T02:00:00+01:00"),
  place: "Casale Schiavella",
  address: "Via Colle Mufiano, 29",
  mapsQuery: "Casale Schiavella, Via Colle Mufiano 29",
};

document.documentElement.classList.add("js");

/* ---------- utility ---------- */
const $ = (s, el = document) => el.querySelector(s);
const pad = (n) => String(n).padStart(2, "0");
const DAY = 86400000;
const ADMIN_KEY = "festa-admin-pass";

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

const fmtDay = new Intl.DateTimeFormat("it-IT", { day: "2-digit", timeZone: "Europe/Rome" });
const fmtMonth = new Intl.DateTimeFormat("it-IT", { month: "long", timeZone: "Europe/Rome" });
const fmtLong = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "Europe/Rome" });

/* ---------- countdown ---------- */
function tickCountdown() {
  const box = $("#countdown");
  const diff = PARTY.start - Date.now();

  if (diff <= 0) {
    box.classList.add("countdown--done");
    let msg = $(".countdown__msg", box);
    if (!msg) {
      msg = document.createElement("p");
      msg.className = "countdown__msg";
      box.appendChild(msg);
    }
    const live = Date.now() < PARTY.end.getTime();
    $(".countdown__label", box).textContent = live ? "Ci siamo" : "Fatto";
    msg.textContent = live ? "È stasera." : "Grazie a tutti.";
    return false;
  }

  $('[data-cd="d"]').textContent = pad(Math.floor(diff / DAY));
  $('[data-cd="h"]').textContent = pad(Math.floor((diff % DAY) / 3600000));
  $('[data-cd="m"]').textContent = pad(Math.floor((diff % 3600000) / 60000));
  $('[data-cd="s"]').textContent = pad(Math.floor((diff % 60000) / 1000));
  return true;
}
if (tickCountdown()) {
  const t = setInterval(() => { if (!tickCountdown()) clearInterval(t); }, 1000);
}

/* ---------- calendario (.ics) e mappa ---------- */
const icsDate = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
(function setupLinks() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//festa-di-natale//IT",
    "BEGIN:VEVENT",
    `UID:festa-natale-${icsDate(PARTY.start)}@casale-schiavella`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(PARTY.start)}`,
    `DTEND:${icsDate(PARTY.end)}`,
    `SUMMARY:${PARTY.title}`,
    `LOCATION:${PARTY.place}\\, ${PARTY.address.replace(/,/g, "\\,")}`,
    "DESCRIPTION:Karaoke\\, DJ set\\, Babbo Natale segreto. Ricordati il regalo!",
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Stasera festa di Natale al Casale Schiavella. Il regalo ce l'hai?",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  $("#ics").href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
  $("#maps").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(PARTY.mapsQuery);
})();

/* ================================================================
   Sorprese
   Il file assets/surprises.js viene generato da tools/build.mjs:
   - items[i].data c'è solo per le sorprese già aperte
   - vault contiene tutto, cifrato con la password admin
   ================================================================ */
const SRC = window.SURPRISES || { items: [], vault: null };
const items = SRC.items.map((s) => ({ ...s, at: new Date(s.unlock + "T00:00:00+01:00") }));
let adminData = null; // array decifrato, se admin

// lunghezze delle barre di censura (fisse, non dipendono dal testo vero)
const BARS = [
  { t: [58], b: [96, 88, 41] },
  { t: [72, 30], b: [92, 64] },
  { t: [44], b: [97, 90, 83, 36] },
  { t: [66, 48], b: [94, 57] },
];

function renderFiles() {
  const list = $("#files");
  const now = Date.now();
  list.innerHTML = "";

  items.forEach((s, i) => {
    const pub = s.data || null;
    const adm = adminData ? adminData[i] : null;
    const content = pub || adm;
    const isPublic = !!pub;
    const li = document.createElement("li");
    li.className = "file " + (content ? "file--open" : "file--locked");

    const until = s.at.getTime() - now;
    const days = Math.ceil(until / DAY);
    const when =
      until <= 0 ? "a momenti" : days <= 1 ? "domani" : `tra ${days} giorni`;

    const date = `
      <div class="file__date">
        <span class="file__day">${fmtDay.format(s.at)}</span>
        <span class="file__month">${fmtMonth.format(s.at)}</span>
      </div>`;

    let middle, status;
    if (content) {
      const fresh = isPublic && now - s.at.getTime() < 2 * DAY;
      const tag = !isPublic
        ? `<span class="file__tag file__tag--admin">Anteprima admin</span>`
        : fresh ? `<span class="file__tag">Appena scoperta</span>` : "";
      middle = `
        <div class="file__main">
          <p class="file__label">Sorpresa n° ${i + 1}${tag}</p>
          <h3 class="file__title"></h3>
          <div class="file__body"></div>
        </div>`;
      status = isPublic
        ? `<div class="file__status"><b>Scoperta</b>il ${fmtLong.format(s.at)}</div>`
        : `<div class="file__status"><b>${when}</b>pubblico il ${fmtLong.format(s.at)}</div>`;
    } else {
      const bars = BARS[i % BARS.length];
      middle = `
        <div class="file__main" aria-label="Sorpresa ancora coperta">
          <p class="file__label">Sorpresa n° ${i + 1} · coperta</p>
          <span class="redact redact--title">${bars.t.map((w) => `<i style="width:${w}%"></i>`).join("")}</span>
          <span class="redact redact--body">${bars.b.map((w) => `<i style="width:${w}%"></i>`).join("")}</span>
        </div>`;
      status = `<div class="file__status"><b>${when}</b>si scopre il ${fmtLong.format(s.at)}</div>`;
    }

    li.innerHTML = date + middle + status;

    if (content) {
      $(".file__title", li).textContent = content.title;
      const body = $(".file__body", li);
      content.body.forEach((p) => {
        const el = document.createElement("p");
        el.textContent = p;
        body.appendChild(el);
      });
    }
    list.appendChild(li);
  });

  renderTicker();
}

/* ---------- ticker ---------- */
function renderTicker() {
  const words = ["Karaoke", "DJ set", "Babbo Natale segreto", "Cena"];
  items.forEach((s) => words.push(s.data ? s.data.short : null));
  const html = words
    .map((t) => (t ? `<span>${t}</span>` : `<span class="q">sorpresa</span>`))
    .join("");
  $("#ticker").innerHTML = html.repeat(4);
}

/* ---------- admin ---------- */
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function openVault(password) {
  const v = SRC.vault;
  if (!v) throw new Error("vault mancante");
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64(v.salt), iterations: v.iter, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(v.iv) }, key, b64(v.ct));
  return JSON.parse(new TextDecoder().decode(plain));
}

function adminPanel(state, msg = "") {
  let box = $(".admin");
  if (!box) {
    box = document.createElement("div");
    box.className = "admin";
    document.body.appendChild(box);
  }
  if (state === "on") {
    box.innerHTML = `
      <div class="admin__row">
        <span>Vista admin: vedi tutte le sorprese.</span>
        <button class="btn" type="button" id="admin-out">Esci</button>
      </div>`;
    $("#admin-out").onclick = () => {
      store.del(ADMIN_KEY);
      adminData = null;
      box.remove();
      history.replaceState(null, "", location.pathname + location.hash);
      renderFiles();
    };
    return;
  }
  box.innerHTML = `
    <p class="admin__title">Accesso admin</p>
    <form>
      <input type="password" placeholder="Password" autocomplete="current-password" required>
      <button class="btn" type="submit">Sblocca</button>
    </form>
    ${msg ? `<p class="admin__msg">${msg}</p>` : ""}`;
  $("form", box).onsubmit = async (e) => {
    e.preventDefault();
    const pass = $("input", box).value;
    try {
      adminData = await openVault(pass);
      store.set(ADMIN_KEY, pass);
      adminPanel("on");
      renderFiles();
      $("#sorprese").scrollIntoView();
    } catch {
      adminPanel("off", "Password sbagliata.");
    }
  };
}

(async function initAdmin() {
  const saved = store.get(ADMIN_KEY);
  const wantsAdmin = new URLSearchParams(location.search).has("admin");
  if (saved) {
    try {
      adminData = await openVault(saved);
      adminPanel("on");
      renderFiles();
      return;
    } catch {
      store.del(ADMIN_KEY);
    }
  }
  if (wantsAdmin) adminPanel("off");
})();

renderFiles();

/* ---------- comparsa allo scroll ---------- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }),
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ---------- neve nel footer ---------- */
(function snow() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = $("#snow");
  const host = c.parentElement;
  const ctx = c.getContext("2d");
  let w, h, flakes, dpr, visible = false;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.width = host.clientWidth * dpr;
    h = c.height = host.clientHeight * dpr;
    const n = Math.round(Math.min(120, (host.clientWidth * host.clientHeight) / 7000));
    flakes = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.8 + 0.5) * dpr,
      vy: (Math.random() * 0.4 + 0.2) * dpr,
      sway: Math.random() * Math.PI * 2,
      a: Math.random() * 0.5 + 0.35,
    }));
  }

  function frame() {
    if (!visible) return;
    ctx.clearRect(0, 0, w, h);
    for (const f of flakes) {
      f.y += f.vy;
      f.sway += 0.01;
      f.x += Math.sin(f.sway) * 0.3 * dpr;
      if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(247,240,227,${f.a})`;
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  size();
  addEventListener("resize", size);
  new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting;
    if (visible && !was) frame();
  }).observe(host);
})();
