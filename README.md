# NIRMAAN

**From the first line to a space you can explore.**

NIRMAAN is a browser-based architectural studio. Draw a 2D floor plan, watch it come alive in 3D, scan a paper blueprint into an editable plan, build multiple floors, and download a clean blueprint of your design — all without installing anything.

**Live site:** https://nirmaann.lovable.app

---

## What you can do



### Draw your floor plan
- Draw walls on a grid with live length labels and smart snapping
- Add doors (with swing direction) and windows that snap onto walls
- Place furniture — sofas, beds, tables, plants — and move, rotate or resize it
- Select and drag walls, endpoints, openings and furniture to edit them
- Undo / redo every change, zoom and pan around the canvas

### See it in 3D
- A live 3D view of your plan that you can orbit around
- **Split view** — 2D canvas and 3D side by side, updating together
- **All floors view** — stack every floor on top of each other like the real building
- Wall finishes (plaster, sage, brick) and floor finishes (oak, walnut, stone tile, terrazzo) with instant preview

### Blueprint scan (image → plan)
- Upload a photo or image of a blueprint
- AI reads the walls, doors, windows and their lengths
- The recognised plan is drawn directly on your canvas, ready to edit

### Blueprint export (plan → image)
- Download your drawing as a clean architectural blueprint sheet
- Export as **SVG** or **PNG**, with grid, dimension labels, door swings and a title block

### Multiple floors
- Add as many floors as you need (Ground floor, Floor 1, Floor 2…)
- Switch between floors, delete floors, and show a faint "ghost" of the floor below while drawing
- Every floor is saved with the project

### Design review
- An automated audit checks your layout for access, light and spacing
- Includes a Vastu orientation review

### Your account
- Sign up and sign in with email or **Google**
- A personal dashboard with all your saved projects
- Projects are private — only you can see and edit yours

### The experience
- A calm, architecture-studio-inspired design (in the spirit of Foster + Partners, Herzog & de Meuron and MVRDV)
- Smooth scrolling and a gently animated front page with an infinite marquee footer
- A small house that draws itself as the loading animation everywhere you wait
- Works on desktop and mobile, with reduced-motion support

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React 19, SSR) |
| Build tool | Vite 7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| 3D rendering | Three.js (vanilla, custom scene builder) |
| 2D canvas | HTML5 Canvas |
| Backend & database | Lovable Cloud (Supabase) — projects table with row-level security |
| Authentication | Lovable Cloud Auth — email + Google sign-in |
| AI blueprint reading | Lovable AI Gateway (vision model) |
| Language | TypeScript |

---

## Project structure (short)

```
src/
  routes/            pages: front page, login, register, dashboard, editor
  components/nirmaan/  canvas, 3D scene, footer, loaders, auth card
  lib/               geometry, editing, audit, floors, blueprint scan/export
  hooks/             auth and undo-history hooks
```

---

## Run locally

```sh
git clone <your-repo-url>
cd <repo-folder>
npm install
npm run dev
```

---

Created by **Tejash Suwalka** — [LinkedIn](https://www.linkedin.com/in/tejash-suwalka-281860382/) · tejashsuwalka@gmail.com
