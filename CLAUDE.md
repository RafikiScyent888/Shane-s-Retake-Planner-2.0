# Shane's Retake Planner 2.0 — project context

Read this first in any session that touches this repo. It adds to
`/root/.claude/CLAUDE.md` and never overrides it. That file sets the rules:
push to GitHub after each verified change (the owner's rule since
30 September 2026), zips when asked, AAA contrast on painted pixels, the full footer, the royal palette,
and the objectives shown first.

`main` is what GitHub Pages serves, so a push to `main` is live to students.
This repo was first pushed on 30 September 2026, at the owner's request.

## What this is

**Shane's Retake Planner**: a single `index.html`, plain HTML/CSS/vanilla JS,
no build step. The owner uploaded it on 29 September 2026 as "Retake Ops
Planner". On 30 September they renamed it after Shane, the original owner of
the planner, to give him the credit: "he is the original owner of this and I
am going to give him the credit because it is due to him." Keep the name, in
both the page title and the header. It was first delivered
as `Retake_Planner.html`, then became `index.html` here so that GitHub Pages
serves it at https://rafikiscyent888.github.io/Shane-s-Retake-Planner-2.0/.

A student enters their exam, score and retake date, pastes or ticks the
objectives they missed, and gets a day-by-day plan saved in `localStorage`.

## Content banks: `EXAM_DATA` in `index.html`

| Key | Exam | Source |
|---|---|---|
| `aplus-1201` | A+ Core 1 (220-1201) | Came with the upload. It already matched the owner's doc and has not been changed. It is the only bank with warm-up `recall` questions. |
| `cysa-v4` | CySA+ (CS0-004) | The owner's Google Doc, 29 Sept 2026, with 13 titles and numbers confirmed by a real score report on 30 Sept (`verify/cysa-score-report-2026-09-30.md`). Replaced the CS0-003 bank, which the owner confirmed should go. |
| `secplus-v8` | Security+ (V8) | The owner's Google Doc, 29 Sept 2026. New. |
| `aplus-1202` | A+ Core 2 (220-1202) | The owner's Google Doc, copied from CompTIA's Core 2 V15 page. Built 30 Sept 2026: 4 domains, 11 objectives. |
| `netplus-v9` | Network+ (N10-009) | The owner's Google Doc, copied from CompTIA's Network+ page. Built 30 Sept 2026: 5 domains, 34 objectives. Was the disabled `netplus` option. |

- **Objectives come from the owner's Google Doc "All updated Objectives"**
  (see the global CLAUDE.md). Re-read it before changing a bank. Domain names,
  weights and checklist items are in the doc's own wording. The owner chose
  "your doc's wording only" for checklists.
- **Numbering.** The doc gives no numbers, so the owner chose "number in doc
  order".
  - **CySA+:** the owner then supplied a real CS0-004 score report ("Make the
    new objectives match up"). It confirmed that order for 1.1–1.4, 2.1–2.4,
    3.1–3.3 and 4.1–4.2, and its titles replaced the doc's for those 13.
    The titles are CompTIA's, with the leading "Given a scenario, " dropped as
    in the A+ bank; those objectives are `kind:"scenario"`, and page.mjs
    enforces both. 1.5 and 1.6 were not on the report. They keep the doc's
    order and wording and are listed in `unconfirmedIds`, so the step 2 note
    names just those two. When confirmed, fix any that differ and empty the
    list.
  - **Security+ V8:** `numbersUnconfirmed: true`. The whole-bank "Check the
    titles, not just the numbers" note stays until a V8 score report or the
    official PDF confirms the numbering.
  - **A+ Core 2 and Network+:** `numbersUnconfirmed: true`. For these two the
    doc gives topic labels ("OS installation", "Traffic types"), not
    CompTIA's objective titles, so titles and numbers are both provisional.
    The owner chose on 30 Sept 2026 to "build from what I gave you" rather
    than wait for the PDFs. CompTIA's numbered list, or a score report, will
    likely regroup Network+'s 34 topics; when one arrives, rebuild against it.
- **The keys carry the version on purpose.** A saved plan is stored as
  `retakePlanner_v1_<key>`, and resuming looks objectives up by number. Under
  the old `cysa` key, a CS0-003 plan on a student's device would have reopened
  against CS0-004 numbers, with its 3.3 silently becoming a different
  objective. Use a new key whenever an exam's objectives change.
- `roi`, `confuse`, `kind` and `tip` are instructor judgement calls, written by
  the assistant for the owner to review. The two AI objectives (CySA+ 1.6,
  Security+ 2.5) carry neither flag, so they get no reinforcement days.
- **`PASSING_SCORES`:** Security+ V8 is 750, confirmed by the owner on
  30 September 2026. CySA+ is 750, as printed on the CS0-004 score report.
  A+ Core 2 (700) and Network+ (725) are also confirmed by the owner on
  30 September 2026.

## Known open issues (owner told 29–30 Sept 2026, not yet fixed)

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
  - every CySA+, Security+, A+ Core 2 and Network+ domain, weight, title and
    checklist word against the doc copied verbatim
    (`verify/objectives-2026-09-29.md`, `verify/objectives-core2-netplus-2026-09-30.md`)
  - that no exam in the dropdown is still disabled
  - CySA+ titles, kinds and `unconfirmedIds` against the score report, and
    pasting the report's own text, which must match exactly its 13 numbers
  - the name, in the header and the page title
  - the dropdown
  - paste matching, including a stray number
  - the manual list and the caution note
  - that the plan covers every objective
  - that each day card shows its tip and checklist
  - save and resume, and that an old CS0-003 plan is not reopened
  - the full footer on every step
  - no script errors
- `node verify/plant.mjs` plants 25 mistakes, one at a time, and every one
  must be caught.
- `node verify/contrast.mjs [exam]` runs the painted-pixel AAA sweep. It exits
  1 while the palette issue above stands.
- If the owner's doc changes, replace `objectives-2026-09-29.md` with a fresh
  copy, under a new date, before trusting a pass.
