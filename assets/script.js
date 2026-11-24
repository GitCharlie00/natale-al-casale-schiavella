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
  mapsUrl: "https://maps.app.goo.gl/sTACmPTSg16Ww5D77",
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
  $("#maps").href = PARTY.mapsUrl;
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

/* ---------- i pacchi sotto l'albero ---------- */
// ogni pacco ha la sua carta, il suo nastro e la sua altezza
const WRAPS = [
  { paper: "#c9372b", ribbon: "#e8b44f", knot: "#f0c463", pattern: "dots", ink: "#f7f0e3", size: 0.92 },
  { paper: "#1f5a3a", ribbon: "#c9372b", knot: "#e0503c", pattern: "stripes", ink: "#e8b44f", size: 0.8 },
  { paper: "#f1e3c6", ribbon: "#1f5a3a", knot: "#2c6e49", pattern: "stars", ink: "#c9372b", size: 1 },
  { paper: "#d9a441", ribbon: "#c9372b", knot: "#e0503c", pattern: "check", ink: "#1f5a3a", size: 0.86 },
];

function patternDef(id, w) {
  switch (w.pattern) {
    case "dots":
      return `<pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse">
        <rect width="18" height="18" fill="${w.paper}"/>
        <circle cx="4.5" cy="4.5" r="2.4" fill="${w.ink}"/><circle cx="13.5" cy="13.5" r="2.4" fill="${w.ink}"/></pattern>`;
    case "stripes":
      return `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="16" height="16" fill="${w.paper}"/><rect width="5" height="16" fill="${w.ink}"/></pattern>`;
    case "stars":
      return `<pattern id="${id}" width="34" height="34" patternUnits="userSpaceOnUse">
        <rect width="34" height="34" fill="${w.paper}"/>
        <path d="M9 3l1.8 4.6 4.9.3-3.8 3.1 1.3 4.8L9 13.1 4.8 15.8l1.3-4.8L2.3 7.9l4.9-.3z" fill="${w.ink}"/>
        <circle cx="26" cy="25" r="1.6" fill="${w.ink}"/></pattern>`;
    default:
      return `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="${w.paper}"/>
        <rect width="10" height="20" fill="${w.ink}" opacity=".28"/><rect width="20" height="10" fill="${w.ink}" opacity=".28"/></pattern>`;
  }
}

function giftSVG(i) {
  const w = WRAPS[i % WRAPS.length];
  const id = `wrap${i}`;
  return `
  <svg class="gift__svg" viewBox="0 0 200 230" aria-hidden="true">
    <defs>${patternDef(id, w)}</defs>
    <ellipse cx="100" cy="222" rx="92" ry="7" fill="rgba(21,51,31,.14)"/>
    <g class="gift__inside">
      <rect class="gift__card" x="58" y="70" width="84" height="50" rx="2" fill="#fbf6ec" stroke="#d9cbb0"/>
      <path class="gift__card" d="M58 70 L100 98 L142 70" fill="none" stroke="#d9cbb0"/>
    </g>
    <g class="gift__body">
      <rect x="22" y="96" width="156" height="124" rx="3" fill="url(#${id})"/>
      <rect x="22" y="96" width="156" height="12" fill="rgba(0,0,0,.12)"/>
      <rect x="88" y="96" width="24" height="124" fill="${w.ribbon}"/>
      <rect x="22" y="150" width="156" height="20" fill="${w.ribbon}"/>
    </g>
    <g class="gift__lid">
      <rect x="14" y="70" width="172" height="32" rx="3" fill="url(#${id})"/>
      <rect x="14" y="94" width="172" height="8" fill="rgba(0,0,0,.1)"/>
      <rect x="88" y="70" width="24" height="32" fill="${w.ribbon}"/>
      <path d="M100 70 C82 38, 50 34, 54 56 C57 72, 84 72, 100 70Z" fill="${w.ribbon}"/>
      <path d="M100 70 C118 38, 150 34, 146 56 C143 72, 116 72, 100 70Z" fill="${w.ribbon}"/>
      <path d="M100 70 C86 52, 66 50, 66 58 C67 66, 86 70, 100 70Z" fill="rgba(0,0,0,.14)"/>
      <path d="M100 70 C114 52, 134 50, 134 58 C133 66, 114 70, 100 70Z" fill="rgba(0,0,0,.14)"/>
      <rect x="91" y="60" width="18" height="16" rx="5" fill="${w.knot}"/>
    </g>
  </svg>`;
}

const OPENED_KEY = "festa-pacchi-aperti";
const opened = new Set(JSON.parse(store.get(OPENED_KEY) || "[]"));
const saveOpened = () => store.set(OPENED_KEY, JSON.stringify([...opened]));
let lastGift = null; // in vista admin: il pacco da richiudere quando si chiude la lettera

function renderGifts() {
  const wrap = $("#gifts");
  const now = Date.now();
  // in vista admin i pacchi si richiudono sempre: così l'animazione si rivede quante volte vuoi
  const replay = !!adminData;
  wrap.innerHTML = "";

  items.forEach((s, i) => {
    const isPublic = !!s.data;
    const content = s.data || (adminData ? adminData[i] : null);
    const key = s.unlock + (isPublic ? "" : "-admin");
    const until = s.at.getTime() - now;
    const days = Math.ceil(until / DAY);
    const when = until <= 0 ? "a momenti" : days <= 1 ? "domani" : `tra ${days} giorni`;
    const isOpen = !replay && !!content && opened.has(key);

    const li = document.createElement("li");
    li.className = "gift" + (content ? " gift--ready" : " gift--locked") + (isOpen ? " is-open" : "");
    li.style.setProperty("--size", WRAPS[i % WRAPS.length].size);

    const tagLine = content ? (isPublic ? "Aprimi" : "Anteprima") : when;
    const label = content
      ? `Apri la sorpresa numero ${i + 1}`
      : `Sorpresa numero ${i + 1}, si apre il ${fmtLong.format(s.at)}`;

    li.innerHTML = `
      <button class="gift__btn" type="button" aria-label="${label}">
        ${giftSVG(i)}
        <span class="gift__tag" aria-hidden="true">
          <span class="gift__tag-n">N° ${i + 1}</span>
          <span class="gift__tag-d">${fmtDay.format(s.at)} ${fmtMonth.format(s.at).slice(0, 3)}</span>
          <span class="gift__tag-w">${tagLine}</span>
        </span>
      </button>
      <p class="gift__caption"></p>`;

    const caption = $(".gift__caption", li);
    caption.textContent = isOpen ? content.title : content ? "Pronto da scartare" : "Ancora incartato";

    $(".gift__btn", li).addEventListener("click", () => {
      if (!content) {
        li.classList.remove("is-shaking");
        void li.offsetWidth;
        li.classList.add("is-shaking");
        caption.textContent = `Niente sbirciate: si apre il ${fmtLong.format(s.at)}`;
        return;
      }
      const already = li.classList.contains("is-open");
      if (replay) {
        lastGift = { li, caption, text: caption.textContent };
      } else {
        opened.add(key);
        saveOpened();
      }
      li.classList.add("is-open");
      caption.textContent = content.title;
      setTimeout(() => openLetter(i, content, isPublic), already ? 0 : 650);
    });

    wrap.appendChild(li);
  });

  renderTicker();
}

/* ---------- la lettera nel pacco ---------- */
function openLetter(i, c, isPublic) {
  const dlg = $("#letter");
  $(".letter__meta", dlg).textContent =
    `Sorpresa n° ${i + 1} · ${isPublic ? "scartata" : "si apre"} il ${fmtLong.format(items[i].at)}`;
  $(".letter__title", dlg).textContent = c.title;
  const body = $(".letter__body", dlg);
  body.innerHTML = "";
  c.body.forEach((p) => {
    const el = document.createElement("p");
    el.textContent = p;
    body.appendChild(el);
  });
  if (typeof dlg.showModal === "function") dlg.showModal();
  else dlg.setAttribute("open", "");
}
(function setupLetter() {
  const dlg = $("#letter");
  const close = () => (dlg.close ? dlg.close() : dlg.removeAttribute("open"));
  $(".letter__close", dlg).addEventListener("click", close);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener("close", () => {
    if (!lastGift) return;
    const { li, caption, text } = lastGift;
    lastGift = null;
    setTimeout(() => {
      li.classList.remove("is-open");
      caption.textContent = text;
    }, 150);
  });
})();

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
      renderGifts();
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
      renderGifts();
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
      renderGifts();
      return;
    } catch {
      store.del(ADMIN_KEY);
    }
  }
  if (wantsAdmin) adminPanel("off");
})();

renderGifts();

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

/* ---------- lucine nel hero ---------- */
(function lights() {
  const host = $("#lights");
  const NS = "http://www.w3.org/2000/svg";
  const COLORS = ["#c9372b", "#e8b44f", "#1f7a4d", "#e86a3a", "#f7f0e3"];

  function draw() {
    const w = host.clientWidth;
    const span = w < 600 ? 3 : 5; // numero di festoni
    const seg = w / span;
    const sag = w < 600 ? 26 : 40;
    let d = "";
    const bulbs = [];
    for (let k = 0; k < span; k++) {
      const x0 = k * seg, x1 = x0 + seg;
      d += `M${x0},4 Q${x0 + seg / 2},${4 + sag * 2} ${x1},4 `;
      const n = Math.max(4, Math.round(seg / 46));
      for (let j = 1; j < n; j++) {
        const t = j / n;
        const x = x0 + seg * t;
        const y = 4 + 2 * t * (1 - t) * sag * 2; // curva quadratica
        bulbs.push([x, y]);
      }
    }
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${w} 90`);
    svg.innerHTML =
      `<path class="wire" d="${d}"/>` +
      bulbs
        .map(([x, y], i) => {
          const c = COLORS[i % COLORS.length];
          const delay = ((i * 0.37) % 2.6).toFixed(2);
          return `<g class="bulb" style="color:${c};animation-delay:-${delay}s">
            <rect x="${x - 3}" y="${y - 1}" width="6" height="6" rx="1" fill="#3c4a3f"/>
            <ellipse cx="${x}" cy="${y + 12}" rx="5.5" ry="8" fill="${c}"/>
          </g>`;
        })
        .join("");
    host.replaceChildren(svg);
  }
  draw();
  let t;
  addEventListener("resize", () => { clearTimeout(t); t = setTimeout(draw, 150); });
})();

/* ---------- bosco innevato nel footer ---------- */
(function forest() {
  const svg = $("#forest");
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  let trees = "";
  for (let x = -20; x < 1220; x += 26 + rnd() * 30) {
    const h = 60 + rnd() * 90;
    const wd = h * (0.42 + rnd() * 0.12);
    const base = 160;
    const shade = rnd() > 0.5 ? "#143a26" : "#0f2f1e";
    trees += `<path d="M${x},${base} L${x + wd / 2},${base - h} L${x + wd},${base}Z" fill="${shade}"/>`;
    trees += `<path d="M${x + wd / 2},${base - h} L${x + wd / 2 - wd * 0.14},${base - h * 0.7} L${x + wd / 2 + wd * 0.14},${base - h * 0.7}Z" fill="#f7f0e3" opacity=".9"/>`;
  }
  svg.innerHTML = trees + `<path d="M0,160 L0,148 Q300,132 600,146 T1200,140 L1200,160Z" fill="#f7f0e3"/>`;
})();
