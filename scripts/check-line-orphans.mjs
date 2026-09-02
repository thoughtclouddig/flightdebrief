/**
 * Fails on orphaned lines: a text block whose LAST rendered line holds only a
 * word or two, or whose lines are wildly uneven.
 *
 * This is a rendering property, not a source property -- the same string is
 * fine at one width and leaves "catching up." stranded at another -- so it has
 * to be measured in a real browser at real widths rather than linted. Uses the
 * Playwright already in the project.
 *
 * It exists because a written rule did not hold. app/globals.css had carried a
 * "zero orphans, enforced once" block for a while, and it was silently doing
 * nothing: the rules were unlayered, Tailwind v4 emits utilities into a layer,
 * and unlayered CSS beats layered CSS at any specificity. Every text-balance
 * on the site was dead and nobody could see it. A checker that measures what
 * actually rendered is the only version of this rule that can't quietly fail.
 *
 *   npm run dev                      # in another shell
 *   npm run check:copy               # default pages and widths
 *   npm run check:copy -- /pricing   # specific paths
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const WIDTHS = [375, 768, 1024, 1440];
/**
 * Two separate faults, because they are different problems.
 *
 * The test is WIDTH, not word count, and that distinction took two passes to
 * get right. Counting words flagged "You teach. AfterFlight handles the /
 * follow-through." -- a one-word last line that fills 100% of the measure,
 * which is not an orphan by any reading. What actually looks broken is a last
 * line much shorter than the ones above it: "Why does every flight feel /
 * like a reset?" is 5 words then 3, and the second line is half the width.
 *
 * `fault` still distinguishes the two shapes for reporting; only the ratio
 * decides whether something fails.
 */
const RATIO = 0.45;
/**
 * Long blocks get a looser bar, and the cutoff is low on purpose.
 *
 * A ragged last line is normal in body copy and wrong in a headline, so the
 * strict ratio only applies to display-length blocks. Setting this too high
 * caused real damage once: chasing the ratio on multi-line body copy led to
 * text-balance being applied across the marketing site, and balance works by
 * SHORTENING THE MEASURE -- left-aligned paragraphs stopped filling their
 * column (440px of a 493px column) and every paragraph ragged differently.
 *
 * Rule of thumb the numbers encode: text-balance is for headings, which are
 * short and usually centered. Body copy gets text-pretty and fills its
 * measure. Do not "fix" a body paragraph by balancing it.
 */
const DISPLAY_ONLY = true;
const LONG_RATIO = 0.2;
// 0.2 rather than 0.25 after looking at what each bar actually caught. Between
// them sit last lines of 20-24% -- four or five words on a ragged-right
// paragraph, which is ordinary body typography and not worth a rewrite. Below
// 20% is a genuine stub. Setting this is a judgment call, so it is written
// down rather than quietly tuned until the count reached zero.

const JSON_OUT = process.argv.includes("--json");
const paths = process.argv.slice(2).filter((a) => a.startsWith("/"));
const PATHS = paths.length ? paths : ["/", "/how-it-works", "/pricing"];

/** Splits an element's rendered text into lines using per-character rects. */
const MEASURE = `(minRatio, looseRatio) => {
  const SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, dt, dd, blockquote, figcaption";
  function lines(el) {
    const range = document.createRange();
    const out = []; let current = null;
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walk.nextNode())) {
      if (!node.data.trim()) continue;
      for (let i = 0; i < node.length; i++) {
        range.setStart(node, i); range.setEnd(node, i + 1);
        const top = Math.round(range.getBoundingClientRect().top);
        const rect = range.getBoundingClientRect();
        if (!current || Math.abs(current.top - top) > 3) { current = { top, text: "", left: rect.left, right: rect.right }; out.push(current); }
        current.text += node.data[i];
        current.left = Math.min(current.left, rect.left);
        current.right = Math.max(current.right, rect.right);
        current.width = current.right - current.left;
      }
    }
    return out.filter((l) => l.text.trim()).map((l) => ({ text: l.text.trim(), width: l.width }));
  }
  const found = [];
  for (const el of document.querySelectorAll(SELECTOR)) {
    // Only leaf-ish text blocks; a container would report its children's lines.
    if (el.querySelector(SELECTOR)) continue;
    const text = el.textContent.trim();
    if (!text || text.split(/\\s+/).length < 4) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const ls = lines(el);
    if (ls.length < 2) continue;
    const last = ls[ls.length - 1].text.split(/\\s+/).length;
    const widest = Math.max(...ls.map((l) => l.width));
    const ratio = ls[ls.length - 1].width / widest;
    // Width only. A one-word last line is fine when that word FILLS the
    // measure -- "follow-through." at 100% of the widest line is not an
    // orphan, and counting words flagged a dozen of those.
    // Headings get the strict bar; body copy only has to avoid a bad stub.
    //
    // Line count is the wrong discriminator -- a two-line body paragraph
    // ending short is normal typography, and holding it to the strict ratio is
    // what drove text-balance onto body copy and stopped paragraphs filling
    // their columns. What actually matters is whether the block is display
    // type: a heading tag, a display face, or centered.
    const cs = getComputedStyle(el);
    const isDisplay =
      /^H[1-6]$/.test(el.tagName) ||
      cs.textAlign === "center" ||
      (cs.fontFamily || "").toLowerCase().includes("archivo expanded") ||
      el.className.includes("font-display") ||
      parseFloat(cs.fontSize) >= 24;
    const bar = isDisplay ? minRatio : looseRatio;
    if (ratio < bar) {
      found.push({
        text: text.slice(0, 80), lines: ls.length, lastWords: last,
        tag: el.tagName.toLowerCase(), cls: el.getAttribute("class") ?? "", align: cs.textAlign,
        last: ls[ls.length - 1].text, pct: Math.round(ratio * 100),
        fault: last === 1 ? "orphan" : "stub",
      });
    }
  }
  /*
   * Eyebrows, checked separately because the orphan rule cannot see them.
   *
   * That rule skips anything under four words and anything on one line, which
   * is most eyebrows -- "Debrief replay" is two words, and the failure mode is
   * not a ragged last line but the label breaking in half at all. A tracked
   * run of capitals is a label, and a label that wraps reads as a mistake
   * rather than as typography, so any wrap is a failure regardless of ratio.
   *
   * Identified by rendering, not by class name: uppercase, real letter-spacing
   * and small type. That catches every eyebrow on the site without depending
   * on which of several components happened to draw it.
   */
  for (const el of document.querySelectorAll("p, span, dt, figcaption, h1, h2, h3, h4, h5, h6")) {
    const cs = getComputedStyle(el);
    if (cs.textTransform !== "uppercase") continue;
    if (parseFloat(cs.letterSpacing) < 1) continue;
    if (parseFloat(cs.fontSize) > 18) continue;
    const text = el.textContent.trim();
    if (text.length < 3) continue;
    // A parent whose child is the real label would double-report it.
    if ([...el.children].some((c) => getComputedStyle(c).textTransform === "uppercase")) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const ls = lines(el);
    if (ls.length < 2) continue;
    found.push({
      text: text.slice(0, 80), lines: ls.length, lastWords: 0,
      tag: el.tagName.toLowerCase(), cls: el.getAttribute("class") ?? "", align: cs.textAlign,
      last: ls[ls.length - 1].text, pct: 0, fault: "eyebrow",
    });
  }

  return found;
}`;

const browser = await chromium.launch();
const page = await browser.newPage();
let failures = 0;

for (const path of PATHS) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    // Not networkidle: the Problem section embeds a video player whose
    // connection never goes quiet, so networkidle times out on the second
    // pass over the same page rather than on the first.
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load").catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    // Reveal-on-scroll sections have to be in view before they lay out.
    await page.evaluate(() => new Promise((r) => {
      let y = 0;
      const step = () => {
        window.scrollTo(0, (y += window.innerHeight));
        if (y < document.body.scrollHeight) requestAnimationFrame(step);
        else { window.scrollTo(0, 0); r(); }
      };
      step();
    }));
    await page.waitForTimeout(400);
    const found = await page.evaluate(`(${MEASURE})(${RATIO}, ${LONG_RATIO})`);
    for (const f of found) {
      failures++;
      if (JSON_OUT) { console.log(JSON.stringify({ path, width, ...f })); continue; }
      if (f.fault === "eyebrow") {
        console.log(`${path} @${width}px  EYEBROW WRAPS onto ${f.lines} lines`);
        console.log(`    ${f.text}${f.text.length >= 90 ? "..." : ""}\n`);
      } else {
        console.log(`${path} @${width}px  ${f.fault.toUpperCase()}  last line "${f.last}" — ${f.pct}% of the widest, ${f.lines} lines`);
        console.log(`    ${f.text}${f.text.length >= 90 ? "..." : ""}\n`);
      }
    }
  }
}

await browser.close();
if (failures) {
  console.log(`${failures} problem${failures === 1 ? "" : "s"}. No single-word last lines, no last line under ${RATIO * 100}% of the widest, and no eyebrow on more than one line.`);
  console.log("Fix by rewording, adjusting the measure (max-w-*), or splitting the block into spans.");
  console.log("Eyebrows: shorten the label, or give it whitespace-nowrap once it is short enough to hold.");
  process.exit(1);
}
console.log(`No orphans, stubs or wrapped eyebrows across ${PATHS.length} page(s) at ${WIDTHS.join(", ")}px.`);
