# Shane's Retake Planner 2.0 — project context

Read this first in any session that touches this repo. It adds to
`/root/.claude/CLAUDE.md` and never overrides it: never push, deliver a zip
excluding `.git` only when the owner asks, AAA contrast on painted pixels,
full footer, royal palette, and show the objectives first.

## What this is

**Retake Ops Planner**: a single `index.html`, plain HTML/CSS/vanilla JS, no
build step. The owner uploaded it on 29 September 2026. It was first delivered
as `Retake_Planner.html`, then became `index.html` here so that GitHub Pages
serves it at https://rafikiscyent888.github.io/Shane-s-Retake-Planner-2.0/.

A student enters their exam, score and retake date, pastes or ticks the
objectives they missed, and gets a day-by-day plan saved in `localStorage`.

## Content banks: `EXAM_DATA` in `index.html`

| Key | Exam | Source |
|---|---|---|
| `aplus-1201` | A+ Core 1 (220-1201) | Came with the upload. It already matched the owner's doc and has not been changed. It is the only bank with warm-up `recall` questions. |
| `cysa-v4` | CySA+ (CS0-004) | The owner's Google Doc, 29 Sept 2026. Replaced the CS0-003 bank. |
| `secplus-v8` | Security+ (V8) | The owner's Google Doc, 29 Sept 2026. New. |

- **Objectives come from the owner's Google Doc "All updated Objectives"**
  (see the global CLAUDE.md). Re-read it before changing a bank. Titles,
  domain names, weights and checklist items are in the doc's own wording. The
  owner chose "your doc's wording only" for checklists.
- **The numbers are UNCONFIRMED.** The doc gives none. The owner chose "number
  in doc order". Both banks carry `numbersUnconfirmed: true`, which shows
  students a "Check the titles, not just the numbers" note on step 2. Once the
  numbers are checked against CompTIA's official PDF or a real score report,
  fix any that differ and set the flag to `false`.
- **The keys carry the version on purpose.** A saved plan is stored as
  `retakePlanner_v1_<key>`, and resuming looks objectives up by number. Under
  the old `cysa` key, a CS0-003 plan on a student's device would have reopened
  against CS0-004 numbers, with its 3.3 silently becoming a different
  objective. Use a new key whenever an exam's objectives change.
- `roi`, `confuse`, `kind` and `tip` are instructor judgement calls, written by
  the assistant for the owner to review. The two AI objectives (CySA+ 1.6,
  Security+ 2.5) carry neither flag, so they get no reinforcement days.
- **`PASSING_SCORES`:** Security+ V8 is set to 750, carried over from SY0-701.
  That is an ASSUMPTION until CompTIA publishes the V8 score. CySA+ is 750.

## Known open issues (owner told 29 Sept 2026, not yet fixed)

- **AAA contrast fails across the inherited palette,** and did before the
  objectives update. Measured by `verify/contrast.mjs`:
  - `--muted` labels and objective titles: 5.76:1
  - HIGH ROI and OFTEN CONFUSED tags: 3.3–3.4:1
  - matched chips: 4.41:1
  - locked future days: dimmed to about 2.5:1

  The fix is a palette change, so it needs a preview for the owner first. The
  caution note and the footer added here pass.
- **The A+ warm-up multiple-choice questions lock after one pick** (in
  `answerMc`). That goes against the program's "unlimited tries" rule.
- **No dyslexia toggle yet.** The owner is adding toggles everywhere in one
  pass, so hold off.

## Checks: `verify/` (needs Playwright; not needed to run the site)

- `node verify/page.mjs` drives the page and checks:
  - every CySA+ and Security+ domain, weight, title and checklist word against
    `verify/objectives-2026-09-29.md`, the doc copied verbatim
  - the dropdown
  - paste matching, including a stray number
  - the manual list and the caution note
  - that the plan covers every objective
  - that each day card shows its tip and checklist
  - save and resume, and that an old CS0-003 plan is not reopened
  - the full footer on every step
  - no script errors
- `node verify/plant.mjs` plants 12 mistakes, one at a time, and every one
  must be caught.
- `node verify/contrast.mjs [exam]` runs the painted-pixel AAA sweep. It exits
  1 while the palette issue above stands.
- If the owner's doc changes, replace `objectives-2026-09-29.md` with a fresh
  copy, under a new date, before trusting a pass.
