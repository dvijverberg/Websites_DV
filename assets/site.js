// Theme switch
const root = document.documentElement;
const btn = document.querySelector(".theme-toggle");
const label = btn && btn.querySelector(".label");
const sync = () => { if (label) label.textContent = root.dataset.theme === "light" ? "Dark" : "Light"; };
sync();
if (btn) btn.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  sync();
});

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll(".rv").forEach((el) => io.observe(el));

// Year in title block
const yr = document.getElementById("yr");
if (yr) yr.textContent = new Date().getFullYear();
