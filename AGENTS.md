<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

<!-- AGENT-MEMORY:BEGIN -->
- Managed social sign-in uses the generated Lovable helper and returns to the public login page; navigate only after the existing auth hook confirms the session to avoid callback redirect loops.
- The courtyard uses a lighter mobile image, stable small-viewport height and compositor-only motion paused offscreen; page scrolling must not be captured by ordinary canvas wheel input.
- The front-page footer is isolated from workspace routes; its CSS-only loop pauses offscreen, in hidden tabs and for reduced motion, while page scrolling stays native to avoid input lag.
- Floor-plan rules (audit scoring, geometry, layout types) live in plain TS under src/lib with no React/three imports, so they stay unit-testable (src/test/audit.test.ts).
- Editing constraints and immutable history operations live in src/lib/editing.ts; canvas drag previews commit once on release so undo restores a complete gesture.
- 3D uses vanilla three.js via src/lib/scene3d.ts (createViewer/buildLayoutGroup); the 2D canvas and 3D share the same pixel coordinates (20px = 1m, offset 360/260).
- Projects persist in the `projects` table (ground-floor layout as jsonb columns, upper floors in `floors` jsonb; blueprint scan/export logic is pure TS in src/lib/floors.ts and blueprint-export.ts, owner-only RLS); auth state comes from src/hooks/useAuth.tsx; dashboard/editor routes are ssr:false because the session lives in the browser.
- Window frame and wall cutouts share bounds from src/lib/window-geometry.ts to prevent mismatched openings; split view draws both from one layout and finish choices remain preview-only.
- Use the shared HouseLoader/LoadingStatus for asynchronous waits; house paths share one timeline and fade together so each loop resets cleanly without changing control dimensions.
<!-- AGENT-MEMORY:END -->
