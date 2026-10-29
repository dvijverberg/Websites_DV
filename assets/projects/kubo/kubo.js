// KUBO R&D page: test rig, pressure chart, tool steps
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- test rig: measuring points ---------- */
  const rig = document.getElementById("rig");
  if (rig) {
    const info = {
      1: { t: "Fan current", p: "A current meter on the fan's power supply. The current the fan draws is one way to work out the airflow Q." },
      2: { t: "Pressure over the fan", p: "A Testo sensor measures the difference in static pressure before and after the fan. That is a second way to work out Q." },
      3: { t: "Pitot tube", p: "A pitot tube in the hose, just after the fan, measures the air that actually moves through it." },
      4: { t: "Pressure along the hose", p: "Measuring points along the 85 m hose show how the pressure is spread over its length. The graph below shows those readings." },
    };
    const pts = rig.querySelectorAll(".pt");
    const groups = rig.querySelectorAll("g[data-m]");
    const btns = rig.querySelectorAll("[data-pick]");
    const h = rig.querySelector(".rig-text h4");
    const p = rig.querySelector(".rig-text p");
    const pick = (i) => {
      pts.forEach((el) => el.classList.toggle("on", el.dataset.pt === String(i)));
      groups.forEach((el) => el.classList.toggle("on", el.dataset.m === String(i)));
      btns.forEach((el) => el.setAttribute("aria-pressed", String(el.dataset.pick === String(i))));
      h.textContent = info[i].t;
      p.textContent = info[i].p;
    };
    pts.forEach((el) => {
      el.addEventListener("click", () => pick(el.dataset.pt));
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(el.dataset.pt); } });
    });
    btns.forEach((el) => el.addEventListener("click", () => pick(el.dataset.pick)));
    pick(1);
  }

  /* ---------- pressure along the hose ---------- */
  // Read from Fig. 06 of the internship report: pressure per measuring point (psf_10 ... psf_87) per fan setting.
  const pos = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 87];
  const data = {
    30:  [17, 19, 20, 11, 14, 15, 17, 11, 12, 12, 13, 11, 11, 13, 14, 9, 8],
    40:  [21, 19, 20, 21, 20, 19, 17, 20, 18, 17, 18, 17, 19, 18, 19, 19, 19],
    50:  [37, 38, 39, 39, 39, 34, 33, 35, 37, 32, 32, 33, 32, 33, 33, 34, 34],
    60:  [48, 48, 48, 49, 46, 48, 46, 46, 37, 42, 43, 42, 43, 44, 45, 45, 45],
    70:  [72, 74, 75, 75, 71, 73, 71, 70, 68, 66, 64, 64, 63, 64, 64, 66, 67],
    80:  [116, 115, 117, 117, 118, 119, 119, 117, 115, 111, 112, 103, 100, 102, 104, 107, 107],
    90:  [162, 167, 168, 171, 170, 172, 173, 174, 173, 175, 175, 173, 175, 175, 171, 162, 166],
    100: [198, 207, 210, 209, 216, 215, 214, 214, 216, 216, 218, 215, 218, 216, 213, 206, 207],
  };
  const chart = document.getElementById("chart");
  if (chart) {
    const plot = chart.querySelector(".chart-plot");
    const seg = chart.querySelectorAll("[data-fan]");
    const out = {
      avg: chart.querySelector("[data-out=avg]"),
      lo: chart.querySelector("[data-out=lo]"),
      hi: chart.querySelector("[data-out=hi]"),
      note: chart.querySelector("[data-out=note]"),
    };
    const NS = "http://www.w3.org/2000/svg";
    let sel = 100;

    const el = (n, a, parent) => {
      const e = document.createElementNS(NS, n);
      for (const k in a) e.setAttribute(k, a[k]);
      if (parent) parent.appendChild(e);
      return e;
    };

    function draw() {
      const W = Math.max(280, plot.clientWidth - 36);
      const narrow = W < 520;
      const H = narrow ? 230 : 300;
      const L = 34, R = narrow ? 30 : 40, T = 12, B = 34;
      const x = (i) => L + (pos[i] - pos[0]) / (pos[pos.length - 1] - pos[0]) * (W - L - R);
      const y = (v) => T + (1 - v / 250) * (H - T - B);

      plot.innerHTML = "";
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Pressure at each measuring point along the hose, per fan setting" }, plot);

      for (let v = 0; v <= 250; v += 50) {
        el("line", { class: "grid", x1: L, x2: W - R + 10, y1: y(v), y2: y(v) }, svg);
        el("text", { class: "axis", x: L - 8, y: y(v) + 4, "text-anchor": "end" }, svg).textContent = v;
      }
      pos.forEach((p, i) => {
        if (narrow ? i % 4 !== 0 && i !== pos.length - 1 : i % 2 !== 0 && i !== pos.length - 1) return;
        if (i === pos.length - 2) return;
        el("text", { class: "axis", x: x(i), y: H - B + 18, "text-anchor": "middle" }, svg).textContent = p;
      });
      el("text", { class: "axis", x: W - R + 10, y: H - 2, "text-anchor": "end" }, svg).textContent = "measuring point along the hose →";

      const order = Object.keys(data).map(Number).sort((a, b) => (a === sel) - (b === sel));
      order.forEach((k) => {
        const d = data[k].map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
        const hit = el("path", { class: "hit", d }, svg);
        el("path", { class: "series" + (k === sel ? " on" : ""), d }, svg);
        hit.addEventListener("click", () => select(k));
      });
      data[sel].forEach((v, i) => el("circle", { class: "dot", cx: x(i), cy: y(v), r: narrow ? 2.5 : 3 }, svg));
      const last = data[sel].length - 1;
      el("text", { class: "tag", x: x(last) + 6, y: y(data[sel][last]) + 4 }, svg).textContent = sel;
    }

    function select(k) {
      sel = k;
      seg.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.fan === k)));
      const v = data[k];
      const avg = v.reduce((a, b) => a + b, 0) / v.length;
      const lo = Math.min(...v), hi = Math.max(...v);
      out.avg.textContent = Math.round(avg);
      out.lo.textContent = lo;
      out.hi.textContent = hi;
      out.note.textContent = `At fan setting ${k}, the readings along the hose stay between ${lo} and ${hi}.`;
      draw();
    }

    seg.forEach((b) => b.addEventListener("click", () => select(+b.dataset.fan)));
    let raf;
    new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }).observe(plot);
    select(100);
  }

  /* ---------- tool: process steps ---------- */
  const steps = [
    { img: "profile.jpg", alt: "Aluminium profile after deforming", t: "The problem",
      p: "Corrosion pushes on the glass until it breaks. The tool pulls the aluminium profile up to give the glass room. It buys time for a proper solution." },
    { img: "dion-cad.jpg", alt: "Me modelling the tool at my desk", t: "Rebuild from scratch",
      p: "All that was left was an assembly drawing and a few STEP files. I modelled every part again, so changes were easy, and improved the design for function and for production, together with the manufacturer." },
    { img: "tool-parts.jpg", alt: "The black 3D-printed tool next to bolts and parts", t: "Print it first",
      p: "Before ordering steel, I 3D printed the tool (the black part) to check that it actually worked." },
    { img: "tool-closeup.jpg", alt: "Close-up of the stainless steel tool", t: "Get it made",
      p: "I requested and compared quotes and we chose Xometry, a manufacturer none of us had used before. About three weeks after approval the stainless steel parts arrived." },
    { img: "tools.jpg", alt: "Three finished tools", t: "Test and ship",
      p: "We assembled the tools, tested them and sent them out to the project." },
  ];
  const proc = document.getElementById("process");
  if (proc) {
    const img = proc.querySelector(".process-img img");
    const txt = proc.querySelector(".process-txt");
    const tabs = proc.querySelectorAll("[data-step]");
    const show = (i) => {
      const s = steps[i];
      tabs.forEach((b, j) => b.setAttribute("aria-selected", String(i === j)));
      const swap = () => { img.src = "/assets/projects/kubo/" + s.img; img.alt = s.alt; img.style.opacity = 1; };
      if (reduce) swap(); else { img.style.opacity = 0; setTimeout(swap, 150); }
      txt.querySelector(".mono").textContent = "Step " + (i + 1) + " of " + steps.length;
      txt.querySelector("h3").textContent = s.t;
      txt.querySelector("p").textContent = s.p;
    };
    tabs.forEach((b) => b.addEventListener("click", () => show(+b.dataset.step)));
    proc.addEventListener("keydown", (e) => {
      const cur = [...tabs].findIndex((b) => b.getAttribute("aria-selected") === "true");
      let n = cur;
      if (e.key === "ArrowRight") n = Math.min(cur + 1, steps.length - 1);
      if (e.key === "ArrowLeft") n = Math.max(cur - 1, 0);
      if (n !== cur) { show(n); tabs[n].focus(); }
    });
    steps.forEach((s) => { const p = new Image(); p.src = "/assets/projects/kubo/" + s.img; });
    show(0);
  }
})();
