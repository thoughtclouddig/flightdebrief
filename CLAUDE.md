@AGENTS.md

# American English. No exceptions.

**Every word in this repository uses American spelling** — code, comments, UI
copy, docs, commit messages, and anything written for a user. This is a US
aviation product: the FAA documents it cites are American throughout, so a
British form lands in the same paragraph as the citation and reads as foreign
or machine-generated.

color · center · centerline · organize · analyze · judgment · maneuver ·
labeled · practice · license · defense · gray · toward · while

**It is enforced.** `lib/content/us-spelling.source.test.ts` scans the source
tree on every `npm test` and fails naming the file. To fix everything it finds:

```bash
node scripts/fix-source-spellings.mjs --write
```

Two spellings are deliberately left British because this codebase does not own
them, and both are listed with their reason in `scripts/fix-source-spellings.mjs`:
`analyser` (the Web Audio `createAnalyser()` method name) and `cancelled` (a
persisted `ReservationStatus` value — changing it needs a data migration).
Adding a third means writing down why, next to the other two.

# No orphaned or stub lines

A wrapped block of text never ends with a single word, and its last line is
never under ~45% of its widest line. "Balanced" is a claim about line **width**,
not word count.

**`text-balance` is for headings, never for body copy.** It shortens the measure
to even the lines out — correct for a short centered headline, wrong for a
paragraph, which then stops filling its column and rags differently from the
paragraph above it. Body copy and list items use `text-pretty`.

```bash
npm run dev          # in another shell
npm run check:copy   # measures every text block at 375 / 768 / 1024 / 1440
```

It has to be measured in a browser because it is a rendering property: the same
string is fine at one width and strands two words at another.

**The trap that made this invisible for a while:** `app/globals.css` sets
`text-wrap: pretty` on `p`. Those rules must stay inside `@layer base`. Tailwind
v4 emits utilities into a layer, and *unlayered CSS beats layered CSS at any
specificity* — so while that block sat unlayered, every `text-balance` on the
site silently resolved to `pretty` and balanced nothing.
