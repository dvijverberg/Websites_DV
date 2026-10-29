/* ---------- 1. Pipeline ---------- */
const CHAIN = [
  { t: "Request", short: "Request",
    p: "A request comes in through the website or from sales after a phone call: box type, size, board, logo.",
    me: "Built the request pages in the sales platform: fill in the request, tick packaging types, choose the board, press 'Make quote'. Including careful database migrations on production.",
    tech: ["Next.js", "TypeScript", "Supabase"] },
  { t: "Dieline", short: "Dieline",
    p: "From box type and inside dimensions, a cutting die drawing (DXF) in the style of ArtiosCAD, plus a map of which panel becomes which side of the closed box.",
    me: "Built the DXF generator. Rules worked back from real ArtiosCAD drawings; results within 0.01–0.5 mm. FEFCO 0201, 0427, 0701 and 0203. Impossible sizes are refused with a clear message.",
    tech: ["Python", "DXF"] },
  { t: "Print", short: "Print",
    p: "From an uploaded logo, an automatic print impression on the dieline: background removed, colours reduced, placed by design rules in two or three variants.",
    me: "Built the print generator with quality checks: contrast with the board, resolution, distance to cut and crease lines, white that disappears on brown board. Rejected prints go to a person.",
    tech: ["Python", "Image processing"] },
  { t: "Renders", short: "Renders",
    p: "The flat dieline is folded into a 3D box in Blender, the print goes on, and fixed views are rendered on white and transparent backgrounds.",
    me: "Folding recipes, board colour and print options for the render add-on, plus a separate add-on for insulation liners. Runs headless, in the background or on a server.",
    tech: ["Blender", "Python", "Geometry Nodes"] },
  { t: "Price indication", short: "Price",
    p: "A price indication that only picks routes the factory can actually make: does the sheet fit the machine, grain direction, run length.",
    me: "Built the calculation core on top of a price book: tooling, print, gluing, palletising, transport and margin, with the break-even points between production methods. Costs are indexed with public statistics and updated weekly.",
    tech: ["Python", "Excel", "Open data"] },
  { t: "Proposal", short: "Proposal",
    p: "Everything comes together in a proposal PDF in the house style: renders, dieline with dimensions, options side by side, next steps.",
    me: "Built the proposal toolkit and the 'proposal machine' that runs the whole chain from the sales platform and puts the PDF back. A full run takes a few minutes.",
    tech: ["Python", "PDF", "GitHub"] },
];

(function chain() {
  const ui = document.getElementById("chain-ui");
  if (!ui) return;
  const ol = ui.querySelector(".chain-steps");
  ol.innerHTML = CHAIN.map((c, i) =>
    `<li><button type="button" role="tab" data-i="${i}" aria-selected="false"><span class="mono">${String(i + 1).padStart(2, "0")}</span><b>${c.short}</b></button></li>`
  ).join("");
  const btns = ol.querySelectorAll("button");
  const $ = (id) => document.getElementById(id);
  function show(i) {
    const c = CHAIN[i];
    btns.forEach((b, j) => { b.setAttribute("aria-selected", String(i === j)); b.classList.toggle("done", j < i); });
    $("cd-n").textContent = `Step ${i + 1} of ${CHAIN.length}`;
    $("cd-t").textContent = c.t;
    $("cd-p").textContent = c.p;
    $("cd-me").textContent = c.me;
    $("cd-tech").innerHTML = c.tech.map((t) => `<span>${t}</span>`).join("");
  }
  btns.forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
  show(1);
})();

/* ---------- 2. Simplified FEFCO 0201 dieline ---------- */
(function dieline() {
  const root = document.getElementById("die");
  if (!root) return;
  const svg = document.getElementById("die-svg");
  const val = { L: 300, W: 200, H: 150 };
  const G = 35;      // glue flap width (simplified)
  const SLOT = 6;    // slot width between flaps

  function draw() {
    const { L, W, H } = val;
    const F = W / 2;                      // flap height
    const xs = [0, G, G + L, G + L + W, G + 2 * L + W, G + 2 * L + 2 * W];
    const top = 0, b0 = F, b1 = F + H, bot = F + H + F;
    const cut = [], crease = [];

    // outline: glue flap (tapered) on the left, panels with flaps
    const taper = Math.min(15, H / 6);
    let d = `M ${xs[1]} ${b0} L ${xs[0]} ${b0 + taper} L ${xs[0]} ${b1 - taper} L ${xs[1]} ${b1}`;
    // bottom flaps, left to right, with slots
    for (let i = 1; i <= 4; i++) {
      const xa = xs[i] + (i === 1 ? 0 : SLOT / 2), xb = xs[i + 1] - (i === 4 ? 0 : SLOT / 2);
      d += ` L ${xa} ${b1} L ${xa} ${bot} L ${xb} ${bot} L ${xb} ${b1}`;
    }
    d += ` L ${xs[5]} ${b0}`;
    // top flaps, right to left
    for (let i = 4; i >= 1; i--) {
      const xa = xs[i] + (i === 1 ? 0 : SLOT / 2), xb = xs[i + 1] - (i === 4 ? 0 : SLOT / 2);
      d += ` L ${xb} ${b0} L ${xb} ${top} L ${xa} ${top} L ${xa} ${b0}`;
    }
    d += " Z";
    cut.push(d);

    // creases: horizontal at flap lines, vertical between panels
    crease.push(`M ${xs[1]} ${b0} L ${xs[5]} ${b0}`, `M ${xs[1]} ${b1} L ${xs[5]} ${b1}`);
    for (let i = 1; i <= 4; i++) crease.push(`M ${xs[i]} ${b0} L ${xs[i]} ${b1}`);

    const pad = 40, w = xs[5], h = bot;
    svg.setAttribute("viewBox", `${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`);
    const fs = Math.max(12, Math.min(w, h) / 22);
    const label = (x, y, t) => `<text x="${x}" y="${y}" font-size="${fs}" text-anchor="middle" dominant-baseline="middle">${t}</text>`;
    const mid = (a, b) => (a + b) / 2;
    svg.innerHTML = `
      <path class="die-fill" d="${cut[0]}"/>
      ${crease.map((c) => `<path class="die-crease" d="${c}"/>`).join("")}
      <path class="die-cut" d="${cut[0]}"/>
      <g class="die-labels">
        ${label(mid(xs[1], xs[2]), mid(b0, b1), "L " + L)}
        ${label(mid(xs[2], xs[3]), mid(b0, b1), "W " + W)}
        ${label(mid(xs[3], xs[4]), mid(b0, b1), "L " + L)}
        ${label(mid(xs[4], xs[5]), mid(b0, b1), "W " + W)}
        ${label(mid(xs[1], xs[2]), F / 2, "flap")}
        ${label(xs[5] + 22, mid(b0, b1), "H")}
      </g>
      <g class="die-dim">
        <path d="M 0 ${bot + 22} L ${w} ${bot + 22}"/>
        <path d="M 0 ${bot + 15} L 0 ${bot + 29} M ${w} ${bot + 15} L ${w} ${bot + 29}"/>
        <path d="M ${xs[5] + 12} ${b0} L ${xs[5] + 12} ${b1}"/>
      </g>`;

    // sheet size and board area (outline area via shoelace on the outline points)
    const pts = [...d.matchAll(/[ML] ([\d.]+) ([\d.]+)/g)].map((m) => [+m[1], +m[2]]);
    let a = 0;
    for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
    document.getElementById("die-sheet").textContent = `${Math.round(w)} × ${Math.round(h)} mm`;
    document.getElementById("die-area").textContent = `${(Math.abs(a) / 2 / 1e6).toFixed(2)} m²`;
    root.querySelectorAll("[data-v]").forEach((b) => (b.textContent = val[b.dataset.v] + " mm"));
  }

  root.querySelectorAll("input[type=range]").forEach((inp) => {
    val[inp.dataset.k] = +inp.value;
    inp.addEventListener("input", () => { val[inp.dataset.k] = +inp.value; draw(); });
  });
  draw();
})();
