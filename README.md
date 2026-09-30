# Shane's Retake Planner 2.0

The page itself is titled **Retake Ops Planner**. It builds a personal study plan for a CompTIA retake, built from the student's own
score report. Part of the Cyber Warrior Program.

**Live:** https://rafikiscyent888.github.io/Shane-s-Retake-Planner-2.0/

## What it does

1. The student enters their name, exam, score and planned retake date.
2. They paste the objectives they missed from their score report, or tick
   them by hand.
3. The planner builds a day-by-day plan up to the retake. Weaker, heavier and
   often-confused objectives come first. The plan ends with a practice exam
   and a light review day.

Progress saves in the student's own browser (`localStorage`), on that device
only. It is deleted after the retake date, and it never leaves the browser.

## Exams

| Exam | Objectives | Status |
|---|---|---|
| CompTIA A+ Core 1 (220-1201) | 5 domains, 27 objectives | Live |
| CompTIA Security+ (V8) | 5 domains, 26 objectives | Live. **Objective numbers unconfirmed** |
| CompTIA CySA+ (CS0-004) | 4 domains, 15 objectives | Live. **Objective numbers unconfirmed** |
| A+ Core 2, Network+ | — | Coming soon |

The Security+ and CySA+ objectives come from the instructor's "All updated
Objectives" list (29 September 2026). That list gives no objective numbers,
so they are numbered in its order. Until they are checked against CompTIA's
official numbering, the planner tells students to check the objective titles
against their score report, not just the numbers.

## Files

- `index.html` is the whole site: one page, no build step.
- `verify/` holds instructor checks. The site does not need them to run.
  - `page.mjs` drives the page in Chromium.
  - `plant.mjs` proves each of those checks can fail.
  - `contrast.mjs` measures text contrast on the rendered page.
  - `objectives-2026-09-29.md` is the objectives list the checks compare
    against.

---

Cyber Warrior Program — built by an instructor, for students, to make
certification study more interactive. For educational purposes only. Not
affiliated with, endorsed by, or sponsored by CompTIA®. All trademarks belong
to their respective owners.
