// Folds a real FEFCO 0427 dieline into a box, in the browser.
// mailer-0427.json holds the panels (polygons in mm, from the DXF) and the
// hinge tree: each panel turns about its crease relative to its parent.
const root = document.getElementById("fold");
if (root) {
  const io = new IntersectionObserver((e) => {
    if (e.some((x) => x.isIntersecting)) { io.disconnect(); init(); }
  }, { rootMargin: "300px" });
  io.observe(root);
}

async function init() {
  const stage = root.querySelector(".fold-stage");
  const status = root.querySelector(".fold-status");
  const range = root.querySelector("input[type=range]");
  const play = root.querySelector("[data-play]");
  const stepOut = root.querySelector("[data-step]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let THREE, OrbitControls, RoomEnvironment, data;
  try {
    THREE = await import("three");
    ({ OrbitControls } = await import("three/addons/controls/OrbitControls.js"));
    ({ RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js"));
    data = await (await fetch(root.dataset.src)).json();
  } catch (e) { status.textContent = "3D view could not load"; return; }

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (e) { status.textContent = "3D needs WebGL, which this browser has turned off"; return; }
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
  Object.assign(sun.shadow.camera, { left: -420, right: 420, top: 420, bottom: -420, near: 10, far: 1600 });
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.6;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---------- board material: kraft with a little fibre noise ----------
  function fibre(base, spread) {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const a = Math.random() * spread;
      g.fillStyle = Math.random() < 0.5 ? `rgba(60,35,10,${a})` : `rgba(255,235,200,${a})`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 6, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / 120, 1 / 120); // UVs are in mm
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  const faceMat = new THREE.MeshStandardMaterial({ map: fibre("#b98d5e", 0.09), roughness: 0.9, metalness: 0 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x8a643e, roughness: 1, metalness: 0 });
  const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });

  // ---------- build the hinge tree ----------
  const T = data.thickness;
  const V = (p) => new THREE.Vector3(p[0], p[1], 0);
  const sheet = new THREE.Group();        // flat drawing frame: x right, y up, z = inside of the board
  const nodes = data.nodes.map((n) => ({ ...n }));
  nodes.forEach((n, i) => {
    const pivot = n.axis ? V(n.axis[0]) : new THREE.Vector3();
    n.pivot = pivot;
    n.dir = n.axis ? V(n.axis[1]).sub(pivot).normalize() : null;
    const shape = new THREE.Shape(n.pts.map((p) => new THREE.Vector2(p[0] - pivot.x, p[1] - pivot.y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    geo.translate(0, 0, -T / 2);
    const mesh = new THREE.Mesh(geo, [faceMat, edgeMat]);
    mesh.castShadow = mesh.receiveShadow = true;
    const outline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(n.pts.map((p) => new THREE.Vector3(p[0] - pivot.x, p[1] - pivot.y, T / 2 + 0.15))),
      lineMat);
    n.g = new THREE.Group();
    n.g.add(mesh, outline);
    const parent = i === 0 ? null : nodes[n.parent];
    n.g.position.copy(pivot).sub(parent ? parent.pivot : new THREE.Vector3());
    (parent ? parent.g : sheet).add(n.g);
  });

  // centre of the flat sheet and of the base panel; the view drifts from one to the other
  const bb = (pts) => pts.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [1e9, 1e9, -1e9, -1e9]);
  const all = bb(nodes.flatMap((n) => n.pts));
  const base = bb(nodes[0].pts);
  const cSheet = new THREE.Vector2((all[0] + all[2]) / 2, (all[1] + all[3]) / 2);
  const cBase = new THREE.Vector2((base[0] + base[2]) / 2, (base[1] + base[3]) / 2);

  const world = new THREE.Group();
  world.rotation.x = -Math.PI / 2;        // drawing lies on the table, inside up
  world.add(sheet);
  scene.add(world);

  // ---------- camera ----------
  const camera = new THREE.PerspectiveCamera(26, 1, 10, 6000);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, enableZoom: false,
    minPolarAngle: 0.15, maxPolarAngle: 1.35 });
  camera.position.set(520, 820, 1050);

  // ---------- fold state ----------
  const smooth = (x) => x * x * (3 - 2 * x);
  const STEPS = [
    [0.00, "Flat dieline from the DXF"], [0.01, "Side walls up"], [0.16, "Corner ears in"],
    [0.30, "End walls up"], [0.44, "Rim over, inner wall down"], [0.68, "Lid flaps and front tuck"],
    [0.86, "Lid closed"],
  ];
  let p = 0, goal = 0;
  const lerp = (a, b, t) => a + (b - a) * t;
  function pose(t) {
    nodes.forEach((n) => {
      if (!n.dir) return;
      const k = smooth(Math.min(1, Math.max(0, (t - n.t[0]) / (n.t[1] - n.t[0]))));
      n.g.quaternion.setFromAxisAngle(n.dir, THREE.MathUtils.degToRad(n.angle * k));
    });
    const c = smooth(Math.min(1, t / 0.4));
    sheet.position.set(-lerp(cSheet.x, cBase.x, c), -lerp(cSheet.y, cBase.y, c), 0);
    lineMat.opacity = 0.9 * (1 - Math.min(1, t / 0.12));
    lineMat.visible = lineMat.opacity > 0.01;
    let s = STEPS[0][1];
    for (const [at, label] of STEPS) if (t >= at) s = label;
    if (stepOut.textContent !== s) stepOut.textContent = s;
  }

  function syncTheme() {
    const dark = document.documentElement.dataset.theme === "dark";
    lineMat.color.set(dark ? 0x2a1e12 : 0x3a2a1a);
    renderer.toneMappingExposure = dark ? 0.82 : 0.95;
    sun.intensity = dark ? 1.1 : 1.5;
    ground.material.opacity = dark ? 0.35 : 0.18;
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  let fitDist = 1200;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const fov = THREE.MathUtils.degToRad(camera.fov);
    fitDist = Math.max(560 / (2 * Math.tan(fov / 2) * Math.min(camera.aspect, 1.6)), 520 / (2 * Math.tan(fov / 2)));
  }
  new ResizeObserver(resize).observe(stage);
  resize();
  const dir0 = camera.position.clone().normalize();
  camera.position.copy(dir0).multiplyScalar(fitDist);

  // ---------- controls ----------
  let playing = false;
  function setPlaying(v) {
    playing = v;
    play.textContent = v ? "Pause" : (p >= 0.999 ? "Unfold" : "Fold");
  }
  play.addEventListener("click", () => {
    if (playing) { setPlaying(false); goal = p; return; }
    goal = p >= 0.999 ? 0 : 1;
    setPlaying(true);
  });
  range.addEventListener("input", () => { goal = p = range.value / 1000; setPlaying(false); });
  controls.addEventListener("start", () => root.classList.add("touched"));

  pose(0);
  status.textContent = "";
  root.classList.add("ready");

  // fold once on its own the first time it comes into view (not with reduced motion)
  let visible = true;
  new IntersectionObserver((e) => {
    visible = e[0].isIntersecting;
    if (visible && !reduced && !root.dataset.played && e[0].intersectionRatio > 0.5) {
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
      range.value = Math.round(p * 1000);
    }
    pose(p);
    // move in a little as the sheet becomes a box
    const want = fitDist * lerp(1, 0.78, smooth(Math.min(1, p / 0.4)));
    const d = camera.position.distanceTo(controls.target);
    if (Math.abs(d - want) > 0.5) camera.position.sub(controls.target).setLength(d + (want - d) * 0.1).add(controls.target);
    controls.update();
    renderer.render(scene, camera);
  });
}
