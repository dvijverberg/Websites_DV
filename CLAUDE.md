# Portfolio Dion Vijverberg

Static portfolio site, deployed by Vercel on every push to `main` (https://websitesdv.vercel.app, later dionvijverberg.nl).
Plain HTML/CSS/JS, no build step. `vercel.json` sets `cleanUrls`, so link to `/projects/click-pax`, not `.html`.

Talk to Dion in Dutch. Site copy is English.

## Several chats work on this repo at once
- Always `git pull --rebase` before you start and again before you push.
- Only edit the files for your own page. Keep changes to shared files (`assets/styles.css`, `assets/site.js`, `index.html`) small.
- Commit as `dvijverberg <dionweervijf@gmail.com>`, messages in Dutch.

## Structure
- `index.html`: homepage (`assets/home.css`, `assets/m3d.css`)
- `projects/*.html`: one page per project (`assets/project.css` + per-project css/js in `assets/projects/<name>/`)
- `assets/styles.css`: design tokens, light/dark theme, shared components
- `assets/site.js`: theme switch (localStorage `theme`), `.rv` reveal on scroll, year in footer
- `assets/js/motor-viewer.js`: three.js viewer for every `.m3d` element (`data-src`, `data-mode`, `data-tilt`, `data-yaw`, `data-pad`). three.js is vendored in `assets/vendor/three` (import map in the page head).
- `assets/fonts`: Archivo (variable, use `font-stretch`) and JetBrains Mono, self-hosted.

## Design rules (Dion's wishes)
- Clean and calm, not loud, not "AI-looking". Short, concrete copy without marketing clichés.
- Dark by default with a light/dark switch. Dark is neutral (#0e0e0d), never greenish. Accent #ff5b1f, used sparingly.
- Subtle technical-drawing theme: mono labels, "Fig. n —" captions, title block in the footer. Don't add more ornament.
- Content stays in the centred column (`.wrap`, max 1120px).
- Line drawings with white backgrounds go in `.drawing` (multiply in light, invert + screen in dark), never on white panels.
- Interactive elements are welcome but functional: they must work on mobile and with `prefers-reduced-motion`.
- Every new page: favicon links, og tags (image `/og.png`), theme script in the head, `site.js` at the end.

## Content rules
- Only state what the sources support. Don't invent figures, results or quotes. When unsure, ask Dion.
- No client names, prices, margins or colleagues' names. Don't publish Click-Pax code.

## Check before pushing
Render the page with Playwright (desktop 1440 and mobile 390, both themes) and look at it. Check the console for errors.
