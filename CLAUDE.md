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
