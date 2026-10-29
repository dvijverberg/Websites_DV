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
    me: "Built the render add-on: DXF import, folding recipes per box type, procedural board, print inside and out. Plus a second add-on for insulation liners. Runs headless, in the background or on a server.",
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

/* 2. The FEFCO 0427 demo (dieline + 3D fold) lives in mailer-fold.js */
