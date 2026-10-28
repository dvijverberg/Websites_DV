// Interactive 3D view of the two motor casing halves.
// Loads lazily when the viewer scrolls into view.
const root = document.getElementById("motor3d");

if (root) {
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); init(); }
  }, { rootMargin: "400px" });
  io.observe(root);
}

async function init() {
  const status = root.querySelector(".m3d-status");
  let THREE, OrbitControls, GLTFLoader, RoomEnvironment, toCreasedNormals;
  try {
    THREE = await import("three");
    ({ OrbitControls } = await import("three/addons/controls/OrbitControls.js"));
    ({ GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js"));
    ({ RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js"));
    ({ toCreasedNormals } = await import("three/addons/utils/BufferGeometryUtils.js"));
  } catch (e) { status.textContent = "3D viewer could not load"; return; }

  const stage = root.querySelector(".m3d-stage");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) { status.textContent = "3D needs WebGL, which this browser has turned off"; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(200, 300, 400);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(28, 1, 1, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = false; // keep page scrolling intact
  controls.autoRotate = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotateSpeed = 0.9;

  // material follows the site theme
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.55, side: THREE.DoubleSide });
  const syncTheme = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    mat.color.set(dark ? 0x8a8984 : 0x7d7c77);
    key.intensity = dark ? 0.9 : 1.6;
    renderer.toneMappingExposure = dark ? 0.85 : 0.95;
  };
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const gltf = await new GLTFLoader().loadAsync(root.dataset.src, (p) => {
    if (p.total) status.textContent = `Loading model · ${Math.round((p.loaded / p.total) * 100)}%`;
  }).catch(() => null);
  if (!gltf) { status.textContent = "Model could not load"; return; }

  const halves = {};
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry = toCreasedNormals(o.geometry, THREE.MathUtils.degToRad(35));
    o.material = mat;
  });
  ["left", "right"].forEach((n) => { halves[n] = gltf.scene.getObjectByName(n); });

  // lay the halves open like a book, interiors facing the viewer
  const GAP = 18;
  const wL = new THREE.Box3().setFromObject(halves.left).getSize(new THREE.Vector3()).x;
  const wR = new THREE.Box3().setFromObject(halves.right).getSize(new THREE.Vector3()).x;
  const layout = {
    both:  { left: -(wR + GAP) / 2, right: (wL + GAP) / 2 },
    left:  { left: 0, right: null },
    right: { left: null, right: 0 },
  };
  const group = new THREE.Group();
  group.add(gltf.scene);
  group.rotation.x = -0.25;
  scene.add(group);

  let mode = "both";
  const target = { left: 0, right: 0 };
  function applyMode(m, instant) {
    mode = m;
    for (const n of ["left", "right"]) {
      const x = layout[m][n];
      halves[n].visible = x !== null;
      if (x !== null) { target[n] = x; if (instant) halves[n].position.x = x; }
    }
    frame(instant);
    root.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === m)));
  }

  // fit camera to what is visible
  const camGoal = { dist: 600 };
  function frame(instant) {
    const vis = mode === "both" ? (wL + wR + GAP) : (mode === "left" ? wL : wR);
    const aspect = stage.clientWidth / stage.clientHeight;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const fitH = 140 / (2 * Math.tan(fov / 2));
    const fitW = vis / (2 * Math.tan(fov / 2) * aspect);
    camGoal.dist = Math.max(fitH, fitW) * 1.25;
    if (instant) setDist(camGoal.dist);
  }
  function setDist(d) {
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, d);
  }

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    frame(false);
  }
  new ResizeObserver(resize).observe(stage);

  camera.position.set(0, 60, 600);
  resize();
  applyMode("both", true);

  root.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => applyMode(b.dataset.view)));
  root.querySelector("[data-reset]").addEventListener("click", () => {
    camera.position.set(0, 60, camGoal.dist);
    controls.target.set(0, 0, 0);
  });

  // pause auto-rotate while the user is dragging, resume after a while
  let idle;
  const auto = controls.autoRotate;
  controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(idle); root.classList.add("touched"); });
  controls.addEventListener("end", () => { idle = setTimeout(() => (controls.autoRotate = auto), 4000); });

  status.textContent = "";
  root.classList.add("ready");

  let visible = true;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(root);
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    for (const n of ["left", "right"]) halves[n].position.x += (target[n] - halves[n].position.x) * 0.12;
    const d = camera.position.distanceTo(controls.target);
    if (Math.abs(d - camGoal.dist) > 0.5) setDist(d + (camGoal.dist - d) * 0.12);
    controls.update();
    renderer.render(scene, camera);
  });
}
