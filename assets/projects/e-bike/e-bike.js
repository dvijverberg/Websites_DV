/* ============================================================
   1. Exploded view: parts, failure categories (thesis ch. 6)
   ============================================================ */
const CATS = {
  bear: { name: "Bearings", share: "≈50% of failures" },
  elec: { name: "Software & electronics", share: "≈25% of failures" },
  mech: { name: "Other mechanical", share: "≈25% of failures" },
};
const PARTS = [
  { x: 8,  y: 46, cat: "mech", name: "Casing half", text: "Two aluminium halves hold everything together. Cracks or deformation after an impact can let water in." },
  { x: 15, y: 72, cat: "mech", name: "Gasket & seals", text: "Keep the motor watertight. Failing seals lead to moisture damage, often the start of bearing and electronics problems." },
  { x: 22, y: 25, cat: "bear", name: "Bearing", text: "Wear or dislocation from overloading, water or impact. Signals: dragging noise, vibration, play on the crankshaft." },
  { x: 29, y: 25, cat: "bear", name: "Freewheel gear + bearing", text: "Bearings are the most common failure and relatively easy to replace, if you know which one is worn." },
  { x: 50, y: 27, cat: "mech", name: "Crankshaft", text: "The central axis the rider pedals on. A shock once per pedal rotation points to the gear on this shaft." },
  { x: 34, y: 47, cat: "mech", name: "Transmission gear", text: "Metal or nylon gears reduce the motor speed. Damage shows up as sudden shocks and slipping when accelerating." },
  { x: 53, y: 57, cat: "elec", name: "Motherboard", text: "Controls the motor. Faults show up as error codes in the manufacturer's diagnostic software." },
  { x: 67, y: 27, cat: "elec", name: "Torque sensor", text: "Measures how hard the rider pushes. Misalignment or sensor faults trigger error codes." },
  { x: 74, y: 29, cat: "bear", name: "Crankshaft bearing", text: "Every motor has a 'weakest' bearing that tends to fail first. Which one that is, is rarely documented." },
  { x: 73, y: 58, cat: "elec", name: "Motor (rotor + stator)", text: "The electric motor itself. Its rotor runs on bearings that wear just like the others." },
  { x: 86, y: 47, cat: "mech", name: "Casing half", text: "The other half. Opening a motor takes the right tools and care not to damage the seals." },
  { x: 93, y: 54, cat: "mech", name: "Screws (TX25)", text: "Reversible connections make disassembly possible. Glued or sealed joints make it much harder." },
];

(function initExplode() {
  const root = document.getElementById("explode");
  if (!root) return;
  const stage = root.querySelector(".stage .inner");
  const info = root.querySelector(".part-info");
  const legendBtns = root.querySelectorAll(".legend button");
  const pts = PARTS.map((p, i) => {
    const b = document.createElement("button");
    b.className = "hot-pt";
    b.style.left = p.x + "%";
    b.style.top = p.y + "%";
    b.style.setProperty("--c", `var(--s-${p.cat})`);
    b.setAttribute("aria-label", p.name);
    b.dataset.cat = p.cat;
    const show = () => select(i);
    b.addEventListener("mouseenter", show);
    b.addEventListener("focus", show);
    b.addEventListener("click", show);
    stage.appendChild(b);
    return b;
  });
  function select(i) {
    const p = PARTS[i];
    pts.forEach((b, j) => b.classList.toggle("on", j === i));
    info.style.setProperty("--c", `var(--s-${p.cat})`);
    info.innerHTML = `<span class="mono">${CATS[p.cat].name} · ${CATS[p.cat].share}</span><h4>${p.name}</h4><p>${p.text}</p>`;
  }
  legendBtns.forEach((btn) => btn.addEventListener("click", () => {
    const on = btn.getAttribute("aria-pressed") !== "true";
    legendBtns.forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", String(on));
    root.classList.toggle("filtered", on);
    pts.forEach((b) => b.classList.toggle("match", on && b.dataset.cat === btn.dataset.cat));
    if (on) select(PARTS.findIndex((p) => p.cat === btn.dataset.cat));
  }));
  select(3);
})();

/* ============================================================
   2. Diagnosis explorer: measured values from thesis table 9.3
   rms = mean RMS of two measurements; bands = % energy in
   0-80, 80-160, 160-300, 300-550 Hz; remainder = 550 Hz and up
   ============================================================ */
const DATA = {
  bosch: {
    name: "Bosch BDU 350",
    baselineNote: "Healthy baseline = average of B1 and B2",
    sets: {
      hanging: [
        { id: "B1", label: "Healthy", good: true, rms: 21.13, bands: [40, 3, 41, 5] },
        { id: "B2", label: "Healthy", good: true, rms: 33.65, bands: [12.5, 5, 80, 1.5] },
        { id: "B3", label: "All bearings damaged", rms: 108.44, bands: [9, 28.5, 57.5, 4] },
        { id: "B4", label: "Left crankshaft bearing", rms: 46.25, bands: [21, 21.5, 55.5, 1] },
        { id: "B5", label: "Right crankshaft bearing", rms: 51.56, bands: [20.5, 17.5, 59.5, 1.5] },
        { id: "B6", label: "Rotor bearing", rms: 19.79, bands: [36.5, 10.5, 35, 9],
          note: "The one surprise: this defect gave a <strong>lower</strong> RMS than both healthy motors. Why is still an open question for future research." },
        { id: "B7", label: "Broken gear", rms: 64.98, bands: [6.5, 19, 69.5, 4], peaks: true,
          note: "Look at the signal: a sharp peak every ~4 seconds, exactly one crank rotation. It only showed up in the raw signal, not in RMS or band energy." },
      ],
    },
  },
  shimano: {
    name: "Shimano DU-E5000",
    baselineNote: "Healthy baseline = SH1. Exact defects of SH2–SH4 were unknown.",
    sets: {
      hanging: [
        { id: "SH1", label: "Healthy", good: true, rms: 4.25, bands: [34.25, 3.5, 4.25, 7.75] },
        { id: "SH2", label: "Mechanical damage", rms: 6.95, bands: [18.5, 2, 33, 7.75] },
        { id: "SH3", label: "Mechanical damage", rms: 6.62, bands: [29.5, 3, 36, 6] },
        { id: "SH4", label: "Mechanical damage", rms: 4.74, bands: [23.5, 3, 15, 8.5] },
      ],
      standing: [
        { id: "SH1", label: "Healthy", good: true, rms: 3.85, bands: [22.5, 4, 6, 10] },
        { id: "SH2", label: "Mechanical damage", rms: 6.91, bands: [16, 3, 15.25, 4.5] },
        { id: "SH3", label: "Mechanical damage", rms: 11.69, bands: [20, 4, 49.5, 5] },
        { id: "SH4", label: "Mechanical damage", rms: 5.25, bands: [26.5, 5, 6.5, 6] },
      ],
    },
  },
};
const BAND_LABELS = ["0–80 Hz", "80–160 Hz", "160–300 Hz", "300–550 Hz", "550 Hz +"];

(function initLab() {
  const lab = document.getElementById("lab");
  if (!lab) return;
  const $ = (s) => lab.querySelector(s);
  const scenList = $(".scen");
  const rmsRows = $(".rms-rows");
  const orientSeg = $("#orient");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let brand = "bosch", orient = "hanging", cur = 6;

  const set = () => DATA[brand].sets[orient] || DATA[brand].sets.hanging;
  const baseline = () => {
    const g = set().filter((s) => s.good);
    return g.reduce((a, s) => a + s.rms, 0) / g.length;
  };
  const withRest = (b) => [...b, Math.max(0, 100 - b.reduce((a, v) => a + v, 0))];

  // segmented controls
  lab.querySelectorAll("[data-brand]").forEach((b) => b.addEventListener("click", () => {
    brand = b.dataset.brand;
    lab.querySelectorAll("[data-brand]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    orientSeg.hidden = brand !== "shimano";
    if (brand === "bosch") orient = "hanging";
    cur = brand === "bosch" ? 6 : 2;
    build();
  }));
  lab.querySelectorAll("[data-orient]").forEach((b) => b.addEventListener("click", () => {
    orient = b.dataset.orient;
    lab.querySelectorAll("[data-orient]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    build();
  }));

  function build() {
    const s = set();
    const max = Math.max(...s.map((x) => x.rms)) * 1.05;
    scenList.innerHTML = s.map((x, i) =>
      `<li><button type="button" data-i="${i}" aria-pressed="${i === cur}"><span class="id">${x.id}</span><span>${x.label}${x.good ? ' <span class="ok">· reference</span>' : ""}</span></button></li>`
    ).join("");
    rmsRows.innerHTML = s.map((x, i) =>
      `<button type="button" class="rms-row" data-i="${i}" aria-label="${x.id} ${x.label}, RMS ${x.rms}"><span class="mono">${x.id}</span><span class="track"><span class="fill" style="width:${(x.rms / max) * 100}%"></span></span><span class="v">${x.rms.toFixed(2)}</span></button>`
    ).join("") + `<span class="baseline mono" style="left:calc(46px + (100% - 128px) * ${baseline() / max})"><span class="mono">Healthy baseline</span></span>`;
    lab.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => { cur = +b.dataset.i; pick(); }));
    lab.querySelectorAll(".rms-row").forEach((b) => b.addEventListener("mouseenter", () => { cur = +b.dataset.i; pick(); }));
    $("#base-note").textContent = DATA[brand].baselineNote;
    pick();
  }

  function pick() {
    const s = set(), x = s[cur], base = baseline();
    lab.querySelectorAll(".scen button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === cur)));
    lab.querySelectorAll(".rms-row").forEach((b, i) => b.classList.toggle("on", i === cur));
    const dev = ((x.rms / base) - 1) * 100;
    $("#r-rms").textContent = x.rms.toFixed(2);
    const d = $("#r-dev");
    d.textContent = x.good ? "Reference" : (dev > 0 ? "+" : "") + Math.round(dev) + "%";
    d.classList.toggle("up", !x.good && dev > 0);
    $("#r-motor").textContent = DATA[brand].name.replace(" ", " ") + (brand === "shimano" ? (orient === "hanging" ? " · hanging" : " · standing") : "");
    const bands = withRest(x.bands);
    $(".bands-bar").innerHTML = bands.map((v, i) => `<span style="flex-basis:${v}%;background:var(--b${i + 1})" title="${BAND_LABELS[i]}: ${v}%"></span>`).join("");
    $(".bands-legend").innerHTML = bands.map((v, i) => `<div><span class="k"><i style="background:var(--b${i + 1})"></i><span class="mono">${BAND_LABELS[i]}</span></span><b>${+v.toFixed(2)}%</b></div>`).join("");
    $("#lab-note").innerHTML = x.note || (x.good
      ? "A healthy motor. Its signal forms the baseline the other motors are compared against."
      : brand === "bosch"
        ? "Compared to the healthy motors, more vibration energy and a shift towards the 80–160 Hz band."
        : "Higher RMS than the healthy motor in every case, but smaller differences than with Bosch.");
    target = { amp: x.rms / Math.max(...s.map((y) => y.rms)), bands: bands.map((v) => v / 100), peaks: !!x.peaks };
    if (reduce) { state = { amp: target.amp, bands: [...target.bands] }; draw(0); }
  }

  // ---------- illustrative oscilloscope ----------
  const cv = $("canvas"), ctx = cv.getContext("2d");
  let target = { amp: 0.5, bands: [0.2, 0.2, 0.2, 0.2, 0.2], peaks: false };
  let state = { amp: 0.5, bands: [0.2, 0.2, 0.2, 0.2, 0.2] };
  const VIS_F = [0.9, 3.2, 7.5, 16, 33]; // cycles per second, slowed down so the eye can follow
  const WIN = 6; // seconds visible

  function sig(t) {
    let y = 0;
    for (let i = 0; i < 5; i++) {
      const a = Math.sqrt(state.bands[i]);
      y += a * Math.sin(2 * Math.PI * VIS_F[i] * t + i * 1.7) * (0.85 + 0.15 * Math.sin(t * 0.7 + i));
    }
    y += (Math.sin(t * 91.3) * Math.sin(t * 57.1)) * 0.12; // fine texture
    if (target.peaks) {
      const ph = ((t % 4) + 4) % 4;
      y += 5.5 * Math.exp(-ph * 14) * Math.sin(ph * 120);
    }
    return y * state.amp;
  }
  function draw(now) {
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const css = getComputedStyle(lab);
    // ease towards target
    state.amp += (target.amp - state.amp) * 0.08;
    state.bands = state.bands.map((v, i) => v + (target.bands[i] - v) * 0.08);
    // grid
    ctx.strokeStyle = css.getPropertyValue("--line");
    ctx.lineWidth = 1;
    for (let s = 1; s < WIN; s++) { const x = (s / WIN) * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    // signal
    const t0 = (now || 0) / 1000;
    ctx.strokeStyle = css.getPropertyValue("--sel");
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const n = Math.min(900, Math.floor(w * 1.5));
    for (let k = 0; k <= n; k++) {
      const x = (k / n) * w;
      const t = t0 - WIN + (k / n) * WIN;
      const y = h / 2 - sig(t) * (h * 0.13);
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  function loop(now) { draw(now); requestAnimationFrame(loop); }

  build();
  if (reduce) { state = { ...target, bands: [...target.bands] }; draw(0); }
  else requestAnimationFrame(loop);
  addEventListener("resize", () => reduce && draw(0));
})();
