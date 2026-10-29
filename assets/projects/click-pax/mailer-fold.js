// FEFCO 0427 mailer that folds in the browser.
// A dieline is a set of panels (polygons in mm, drawn as in the DXF: seen from the outside)
// plus a hinge tree: each panel turns about its crease relative to its parent.
//
// Every element with class "fold" becomes a viewer.
//   data-src      fold json from the production DXF (mailer-0427.json)
//   data-gen      "0427": build the dieline from the L / W / H sliders inside the element instead
//   data-tex-out  outside print texture, data-tex-in inside print texture (optional)
//   data-start    fold state to start in: 0 = flat (default), 1 = closed
//   data-hero     slow turntable, no fold lines
document.querySelectorAll(".fold").forEach((root) => {
  const io = new IntersectionObserver((e) => {
    if (e.some((x) => x.isIntersecting)) { io.disconnect(); init(root); }
  }, { rootMargin: "300px" });
  io.observe(root);
});

// ---------------------------------------------------------------- 0427 generator
// Simplified web version of the real generator: same panel layout and folding order,
// offsets read from a production drawing (B-flute, 3 mm). L, W, H are inside dimensions.
export function mailer0427(L, W, H) {
  const T = 3, fw = H + 1.5, back = H + 3, tuck = H + 1.5, inner = H + 5.5, rim = 10.5, ew = H + 3;
  const xb0 = fw, xb1 = xb0 + W + 3, xl0 = xb1 + back, xl1 = xl0 + W + 6, xe = xl1 + tuck;
  const y0 = inner + rim + ew, y1 = y0 + L + 30, yt = y1 + ew + rim + inner;
  const R = (x0, ya, x1, yb) => [[x0, ya], [x1, ya], [x1, yb], [x0, yb]];
  const lidY0 = y0 + 13.5, lidY1 = y1 - 13.5, d = H + 1.5, ch = Math.min(15, (W + 6) / 6);
  const P = [];
  const add = (name, pts, parent, axis, t) => { P.push({ name, pts, parent, axis, t }); return P.length - 1; };
  const base = add("base", R(xb0, y0, xb1, y1), -1);
  const front = add("front wall", R(0, y0 + 7.5, xb0, y1 - 7.5), base, [[xb0, y0 + 7.5], [xb0, y1 - 7.5]], [0, 0.18]);
  const backW = add("back wall", R(xb1, y0 + 3, xl0, y1 - 3), base, [[xb1, y0 + 3], [xb1, y1 - 3]], [0, 0.18]);
  add("ear", R(0, y0 - ew, xb0, y0 + 7.5), front, [[0, y0 + 7.5], [xb0, y0 + 7.5]], [0.16, 0.3]);
  add("ear", R(0, y1 - 7.5, xb0, y1 + ew), front, [[0, y1 - 7.5], [xb0, y1 - 7.5]], [0.16, 0.3]);
  add("ear", R(xb1, y0 - ew, xl0 - 1.5, y0 + 3), backW, [[xb1, y0 + 3], [xl0 - 1.5, y0 + 3]], [0.16, 0.3]);
  add("ear", R(xb1, y1 - 3, xl0 - 1.5, y1 + ew), backW, [[xb1, y1 - 3], [xl0 - 1.5, y1 - 3]], [0.16, 0.3]);
  const endA = add("end wall", R(xb0 - 1.5, y0 - ew, xb1 + 1.5, y0), base, [[xb0, y0], [xb1, y0]], [0.3, 0.46]);
  const endB = add("end wall", R(xb0 - 1.5, y1, xb1 + 1.5, y1 + ew), base, [[xb0, y1], [xb1, y1]], [0.3, 0.46]);
  const rimA = add("rim", R(xb0 - 0.5, y0 - ew - rim, xb1 + 0.5, y0 - ew), endA, [[xb0, y0 - ew], [xb1, y0 - ew]], [0.44, 0.56]);
  const rimB = add("rim", R(xb0 - 0.5, y1 + ew, xb1 + 0.5, y1 + ew + rim), endB, [[xb0, y1 + ew], [xb1, y1 + ew]], [0.44, 0.56]);
  add("inner end wall", R(xb0 + 1.5, 0, xb1 - 1.5, y0 - ew - rim), rimA, [[xb0 + 1.5, y0 - ew - rim], [xb1 - 1.5, y0 - ew - rim]], [0.54, 0.68]);
  add("inner end wall", R(xb0 + 1.5, y1 + ew + rim, xb1 - 1.5, yt), rimB, [[xb0 + 1.5, y1 + ew + rim], [xb1 - 1.5, y1 + ew + rim]], [0.54, 0.68]);
  const lid = add("lid", R(xl0, lidY0, xl1, lidY1), backW, [[xl0, lidY0], [xl0, lidY1]], [0.62, 0.86]);
  const fa = xl0 + 4.5, fb = xl1 - 4;
  add("lid flap", [[fa, lidY1], [fb, lidY1], [fb - ch, lidY1 + d], [fa + ch, lidY1 + d]], lid, [[fa, lidY1], [fb, lidY1]], [0.62, 0.74]);
  add("lid flap", [[fa, lidY0], [fa + ch, lidY0 - d], [fb - ch, lidY0 - d], [fb, lidY0]], lid, [[fa, lidY0], [fb, lidY0]], [0.62, 0.74]);
  const tk = add("tuck", R(xl1, y0 + 3, xe, y1 - 3), lid, [[xl1, y0 + 3], [xl1, y1 - 3]], [0.86, 1]);
  const te = Math.min(24.5, d);
  add("tuck ear", [[xl1 + 1.5, y1 - 3], [xe, y1 - 3], [xe, y1 - 3 + te - 6], [xl1 + 1.5 + 4, y1 - 3 + te]], tk, [[xl1 + 1.5, y1 - 3], [xe, y1 - 3]], [0.84, 0.92]);
  add("tuck ear", [[xl1 + 1.5, y0 + 3], [xl1 + 1.5 + 4, y0 + 3 - te], [xe, y0 + 3 - te + 6], [xe, y0 + 3]], tk, [[xl1 + 1.5, y0 + 3], [xe, y0 + 3]], [0.84, 0.92]);
  // orient each hinge so a positive angle lifts the child to the same side of the sheet
  const nodes = P.map((n) => {
    const out = { name: n.name, pts: n.pts, parent: n.parent };
    if (n.axis) {
      let [A, B] = n.axis;
      const c = n.pts.reduce((s, p) => [s[0] + p[0] / n.pts.length, s[1] + p[1] / n.pts.length], [0, 0]);
      if ((B[0] - A[0]) * (c[1] - A[1]) - (B[1] - A[1]) * (c[0] - A[0]) < 0) [A, B] = [B, A];
      Object.assign(out, { axis: [A, B], angle: 90, t: n.t });
    }
    return out;
  });
  return { name: `FEFCO 0427, ${L} × ${W} × ${H} mm inside`, thickness: T, sheet: [xe, yt], nodes };
}

// Dieline drawing: cuts are the parts of panel edges that are not a crease
function drawDieline(svg, data) {
  const [w, h] = data.sheet;
  const hinges = data.nodes.filter((n) => n.axis).map((n) => n.axis);
  // parts of segment a-b not covered by a collinear crease
  function cutParts(a, b) {
    const vx = b[0] - a[0], vy = b[1] - a[1], len = Math.hypot(vx, vy);
    if (len < 0.01) return [];
    let free = [[0, len]];
    for (const [A, B] of hinges) {
      const dist = (p) => Math.abs((p[0] - a[0]) * vy - (p[1] - a[1]) * vx) / len;
      if (dist(A) > 0.3 || dist(B) > 0.3) continue;
      const s0 = ((A[0] - a[0]) * vx + (A[1] - a[1]) * vy) / len, s1 = ((B[0] - a[0]) * vx + (B[1] - a[1]) * vy) / len;
      const lo = Math.min(s0, s1), hi = Math.max(s0, s1);
      free = free.flatMap(([f0, f1]) => {
        if (hi <= f0 + 0.05 || lo >= f1 - 0.05) return [[f0, f1]];
        const out = [];
        if (lo > f0 + 0.05) out.push([f0, lo]);
        if (hi < f1 - 0.05) out.push([hi, f1]);
        return out;
      });
    }
    return free.map(([f0, f1]) => [[a[0] + vx * f0 / len, a[1] + vy * f0 / len], [a[0] + vx * f1 / len, a[1] + vy * f1 / len]]);
  }
  const Y = (y) => h - y;
  const fill = [], cut = [];
  data.nodes.forEach((n) => {
    fill.push("M" + n.pts.map((p) => `${p[0]} ${Y(p[1])}`).join("L") + "Z");
    n.pts.forEach((a, i) => {
      for (const [c, d] of cutParts(a, n.pts[(i + 1) % n.pts.length])) cut.push(`M${c[0]} ${Y(c[1])}L${d[0]} ${Y(d[1])}`);
    });
  });
  const crease = hinges.map(([A, B]) => `M${A[0]} ${Y(A[1])}L${B[0]} ${Y(B[1])}`);
  const fs = Math.max(w, h) / 30, pad = fs * 1.6, gap = fs * 0.9;
  svg.setAttribute("viewBox", `${-pad} ${-pad} ${w + 2 * pad + fs} ${h + 2 * pad + fs}`);
  svg.innerHTML = `
    <path class="die-fill" d="${fill.join("")}"/>
    <path class="die-crease" d="${crease.join("")}"/>
    <path class="die-cut" d="${cut.join("")}"/>
    <g class="die-dim">
      <path d="M0 ${h + gap}L${w} ${h + gap}M0 ${h + gap / 2}L0 ${h + gap * 1.5}M${w} ${h + gap / 2}L${w} ${h + gap * 1.5}"/>
      <path d="M${w + gap} 0L${w + gap} ${h}M${w + gap / 2} 0L${w + gap * 1.5} 0M${w + gap / 2} ${h}L${w + gap * 1.5} ${h}"/>
    </g>
    <g class="die-labels">
      <text x="${w / 2}" y="${h + gap + fs * 1.2}" font-size="${fs}" text-anchor="middle">${Math.round(w)}</text>
      <text x="${w + gap + fs * 1.1}" y="${h / 2}" font-size="${fs}" text-anchor="middle" transform="rotate(-90 ${w + gap + fs * 1.1} ${h / 2})">${Math.round(h)}</text>
    </g>`;
  const area = data.nodes.reduce((s, n) => s + Math.abs(n.pts.reduce((a, p, i) => {
    const q = n.pts[(i + 1) % n.pts.length]; return a + p[0] * q[1] - q[0] * p[1];
  }, 0)) / 2, 0);
  return { w, h, area };
}

// ---------------------------------------------------------------- viewer
async function init(root) {
  const stage = root.querySelector(".fold-stage");
  const status = root.querySelector(".fold-status");
  const range = root.querySelector("input[data-fold]");
  const play = root.querySelector("[data-play]");
  const stepOut = root.querySelector("[data-step]");
  const hero = "hero" in root.dataset;
  const gen = root.dataset.gen;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // dimension sliders (generator mode)
  const dims = {};
  root.querySelectorAll("input[data-k]").forEach((inp) => (dims[inp.dataset.k] = +inp.value));
  const dieSvg = root.querySelector("[data-svg]");
  function readDims() {
    root.querySelectorAll("input[data-k]").forEach((inp) => (dims[inp.dataset.k] = +inp.value));
    root.querySelectorAll("[data-v]").forEach((b) => (b.textContent = dims[b.dataset.v] + " mm"));
    const data = mailer0427(dims.L, dims.W, dims.H);
    if (dieSvg) {
      const r = drawDieline(dieSvg, data);
      const out = (k, v) => { const el = root.querySelector(`[data-out="${k}"]`); if (el) el.textContent = v; };
      out("sheet", `${Math.round(r.w)} × ${Math.round(r.h)} mm`);
      out("area", `${(r.area / 1e6).toFixed(2)} m²`);
    }
    return data;
  }

  let data;
  if (gen) data = readDims();          // the drawing works even if 3D does not

  let THREE, OrbitControls, RoomEnvironment;
  try {
    THREE = await import("three");
    ({ OrbitControls } = await import("three/addons/controls/OrbitControls.js"));
    ({ RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js"));
    if (!gen) data = await (await fetch(root.dataset.src)).json();
  } catch (e) { if (status) status.textContent = "3D view could not load"; return; }

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (e) { if (status) status.textContent = "3D needs WebGL, which this browser has turned off"; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(-250, 600, 300);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -500, right: 500, top: 500, bottom: -500, near: 10, far: 2000 });
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.6;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---------- board: plain kraft until the print textures are in ----------
  const outMat = new THREE.MeshStandardMaterial({ color: 0xb98d5e, roughness: 0.9, metalness: 0 });
  const inMat = new THREE.MeshStandardMaterial({ color: gen ? 0xc9a274 : 0xb98d5e, roughness: 0.9, metalness: 0 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x8a643e, roughness: 1, metalness: 0 });
  const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });
  const loader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  function skin(mat, url) {
    if (!url) return;
    loader.load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, maxAniso);
      mat.map = t; mat.color.set(0xe2e2e2); mat.needsUpdate = true;   // a touch darker under ACES
    });
  }
  skin(outMat, root.dataset.texOut);
  skin(inMat, root.dataset.texIn);

  // ---------- scene graph: spin (turntable) > world (lay the drawing on the table) > sheet ----------
  const sheet = new THREE.Group();        // drawing frame as the DXF: x right, y up, +z = outside
  const world = new THREE.Group();
  world.rotation.x = Math.PI / 2;         // drawing lies on the table, inside up
  world.add(sheet);
  const spin = new THREE.Group();
  spin.add(world);
  scene.add(spin);
  if (hero) { spin.rotation.y = 0.35; world.rotation.z = -Math.PI / 2; }

  let nodes = [], cSheet = new THREE.Vector2(), cBase = new THREE.Vector2();
  const bb = (pts) => pts.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [1e9, 1e9, -1e9, -1e9]);
  function build(d) {
    sheet.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    sheet.clear();
    const T = d.thickness;
    const [SW, SH] = d.sheet || [543, 517];
    const V = (p) => new THREE.Vector3(p[0], p[1], 0);
    nodes = d.nodes.map((n) => ({ ...n }));
    nodes.forEach((n, i) => {
      const pivot = n.axis ? V(n.axis[0]) : new THREE.Vector3();
      n.pivot = pivot;
      n.dir = n.axis ? V(n.axis[1]).sub(pivot).normalize() : null;
      const shape = new THREE.Shape(n.pts.map((p) => new THREE.Vector2(p[0] - pivot.x, p[1] - pivot.y)));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
      geo.translate(0, 0, -T / 2);
      // caps come first (back cap, then front cap), sides after: split the caps so the
      // inside (z < 0) and outside (z > 0) get their own print, and map UVs to the whole sheet
      const caps = geo.groups[0], half = caps.count / 2;
      geo.clearGroups();
      geo.addGroup(caps.start, half, 2);          // inside
      geo.addGroup(caps.start + half, half, 0);   // outside
      geo.addGroup(caps.start + caps.count, Infinity, 1);
      const pos = geo.attributes.position, uv = geo.attributes.uv;
      for (let k = 0; k < pos.count; k++) {
        const X = pos.getX(k) + pivot.x, Y = pos.getY(k) + pivot.y;
        const inside = k >= caps.start && k < caps.start + half;
        uv.setXY(k, inside ? 1 - X / SW : X / SW, Y / SH);   // inside template is mirrored
      }
      const mesh = new THREE.Mesh(geo, [outMat, edgeMat, inMat]);
      mesh.castShadow = mesh.receiveShadow = true;
      n.g = new THREE.Group();
      n.g.add(mesh);
      if (!hero) {
        n.g.add(new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(n.pts.map((p) => new THREE.Vector3(p[0] - pivot.x, p[1] - pivot.y, -T / 2 - 0.15))),
          lineMat));
      }
      const parent = i === 0 ? null : nodes[n.parent];
      n.g.position.copy(pivot).sub(parent ? parent.pivot : new THREE.Vector3());
      (parent ? parent.g : sheet).add(n.g);
    });
    const all = bb(nodes.flatMap((n) => n.pts)), base = bb(nodes[0].pts);
    cSheet.set((all[0] + all[2]) / 2, (all[1] + all[3]) / 2);
    cBase.set((base[0] + base[2]) / 2, (base[1] + base[3]) / 2);
  }
  build(data);

  // ---------- camera: always frames the whole box, whatever the fold state ----------
  const camera = new THREE.PerspectiveCamera(26, 1, 10, 8000);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, enableZoom: false,
    minPolarAngle: 0.15, maxPolarAngle: 1.35 });
  camera.position.set(520, 820, 1050);
  if (hero) {
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 0.7;
    camera.position.set(0, 560, 1000);
  }
  const box = new THREE.Box3(), sphere = new THREE.Sphere();
  const PAD = hero ? 0.88 : 1.0;
  function frame(k) {
    box.setFromObject(spin);
    box.getBoundingSphere(sphere);
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const want = (sphere.radius / Math.sin(Math.min(vfov, hfov) / 2)) * PAD;
    const off = camera.position.clone().sub(controls.target);
    controls.target.lerp(sphere.center, k);
    off.setLength(off.length() + (want - off.length()) * k);
    camera.position.copy(controls.target).add(off);
  }

  // ---------- fold state ----------
  const smooth = (x) => x * x * (3 - 2 * x);
  const STEPS = [
    [0.00, "Flat dieline"], [0.01, "Side walls up"], [0.16, "Corner ears in"],
    [0.30, "End walls up"], [0.44, "Rim over, inner wall down"], [0.62, "Lid over"],
    [0.84, "Front flap in"], [0.999, "Closed"],
  ];
  const start = +(root.dataset.start || 0);
  let p = start, goal = start;
  const lerp = (a, b, t) => a + (b - a) * t;
  function pose(t) {
    nodes.forEach((n) => {
      if (!n.dir) return;
      const k = smooth(Math.min(1, Math.max(0, (t - n.t[0]) / (n.t[1] - n.t[0]))));
      n.g.quaternion.setFromAxisAngle(n.dir, -THREE.MathUtils.degToRad(n.angle * k));   // fold towards the inside (-z)
    });
    const c = smooth(Math.min(1, t / 0.4));
    sheet.position.set(-lerp(cSheet.x, cBase.x, c), -lerp(cSheet.y, cBase.y, c), 0);
    lineMat.opacity = 0.9 * (1 - Math.min(1, t / 0.12));
    lineMat.visible = lineMat.opacity > 0.01;
    if (stepOut) {
      let s = STEPS[0][1];
      for (const [at, label] of STEPS) if (t >= at) s = label;
      if (stepOut.textContent !== s) stepOut.textContent = s;
    }
  }

  function syncTheme() {
    const dark = document.documentElement.dataset.theme === "dark";
    lineMat.color.set(dark ? 0x2a1e12 : 0x3a2a1a);
    renderer.toneMappingExposure = dark ? 0.85 : 0.95;
    sun.intensity = dark ? 1.15 : 1.5;
    ground.material.opacity = dark ? 0.35 : 0.18;
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    frame(1);
  }
  new ResizeObserver(resize).observe(stage);

  // ---------- controls ----------
  let playing = false;
  function label() {
    if (playing) return "Pause";
    if (p >= 0.999) return "Unfold";
    return p <= 0.001 ? "Fold" : "Close";
  }
  function setPlaying(v) { playing = v; if (play) play.textContent = label(); }
  play?.addEventListener("click", () => {
    if (playing) { setPlaying(false); goal = p; return; }
    goal = p >= 0.999 ? 0 : 1;
    setPlaying(true);
  });
  range?.addEventListener("input", () => { goal = p = range.value / 1000; setPlaying(false); });
  if (gen) {
    let queued = false;
    root.querySelectorAll("input[data-k]").forEach((inp) => inp.addEventListener("input", () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; build(readDims()); pose(p); });
    }));
  }
  let idle;
  const auto = controls.autoRotate;
  controls.addEventListener("start", () => { root.classList.add("touched"); controls.autoRotate = false; clearTimeout(idle); });
  controls.addEventListener("end", () => { if (auto) idle = setTimeout(() => (controls.autoRotate = true), 4000); });

  pose(p);
  resize();
  if (range) range.value = Math.round(p * 1000);
  if (play) play.textContent = label();
  if (status) status.textContent = "";
  root.classList.add("ready");

  // the flat demo folds once on its own the first time it comes into view (not with reduced motion)
  let visible = true;
  new IntersectionObserver((e) => {
    visible = e[0].isIntersecting;
    if (!hero && visible && !reduced && !root.dataset.played && e[0].intersectionRatio > 0.5) {
      root.dataset.played = "1";
      setTimeout(() => { if (p === 0 && !playing) { goal = 1; setPlaying(true); } }, 600);
    }
  }, { threshold: [0, 0.5] }).observe(stage);

  const SPEED = 1 / 7; // full fold in ~7 s
  let last = performance.now();
  renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible) return;
    if (playing) {
      p += Math.sign(goal - p) * SPEED * dt;
      if ((goal === 1 && p >= 1) || (goal === 0 && p <= 0)) { p = goal; setPlaying(false); }
      if (range) range.value = Math.round(p * 1000);
    }
    pose(p);
    frame(0.12);
    controls.update();
    renderer.render(scene, camera);
  });
}
