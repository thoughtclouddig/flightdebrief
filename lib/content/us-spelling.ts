/**
 * British-to-American spelling, for content written for US pilots.
 *
 * The models drift into British forms -- "manoeuvre", "centre", "analyse" --
 * and in aviation writing that is not a stylistic nit. A US student reading
 * "practise the manoeuvre" clocks the article as foreign or machine-made, and
 * the FAA documents this content cites use American spelling throughout, so a
 * mismatch shows up in the same paragraph as the citation.
 *
 * A word list rather than a model call: it runs over every article at no
 * cost, changes nothing but spelling, and is auditable. The list covers what
 * actually appears in this subject matter, not every difference in English.
 */

/** Base forms. Suffixed variants are generated below rather than listed. */
const BASE: Record<string, string> = {
  // The aviation ones first -- these are the tells.
  manoeuvre: "maneuver",
  aeroplane: "airplane",
  aeroplanes: "airplanes",
  kerb: "curb",
  tyre: "tire",
  tyres: "tires",

  // -our
  colour: "color",
  behaviour: "behavior",
  favour: "favor",
  favourite: "favorite",
  honour: "honor",
  labour: "labor",
  neighbour: "neighbor",
  rumour: "rumor",
  endeavour: "endeavor",

  // -ise / -yse
  organise: "organize",
  realise: "realize",
  recognise: "recognize",
  analyse: "analyze",
  apologise: "apologize",
  categorise: "categorize",
  emphasise: "emphasize",
  minimise: "minimize",
  maximise: "maximize",
  prioritise: "prioritize",
  specialise: "specialize",
  summarise: "summarize",
  utilise: "utilize",
  memorise: "memorize",
  visualise: "visualize",
  normalise: "normalize",
  stabilise: "stabilize",
  standardise: "standardize",

  // -re
  centre: "center",
  centres: "centers",
  metre: "meter",
  metres: "meters",
  fibre: "fiber",
  litre: "liter",
  litres: "liters",
  theatre: "theater",

  // -ce / -se
  defence: "defense",
  offence: "offense",
  licence: "license",
  practise: "practice",
  practised: "practiced",
  practising: "practicing",

  // Doubled consonants
  travelling: "traveling",
  travelled: "traveled",
  traveller: "traveler",
  cancelled: "canceled",
  cancelling: "canceling",
  modelling: "modeling",
  modelled: "modeled",
  labelled: "labeled",
  labelling: "labeling",
  fuelled: "fueled",
  fuelling: "fueling",
  signalling: "signaling",
  marvellous: "marvelous",
  skilful: "skillful",

  // Single-l endings
  enrol: "enroll",
  fulfil: "fulfill",
  instalment: "installment",

  // Prefixed forms. \b means "unrecognised" never matches "recognised", so
  // each prefix has to be listed rather than derived.
  unrecognised: "unrecognized",
  unrecognisable: "unrecognizable",
  unlabelled: "unlabeled",
  mislabelled: "mislabeled",
  relabelled: "relabeled",
  unorganised: "unorganized",
  reorganise: "reorganize",
  centreline: "centerline",
  centrelines: "centerlines",

  // Miscellaneous
  judgement: "judgment",
  ageing: "aging",
  grey: "gray",
  aluminium: "aluminum",
  programme: "program",
  programmes: "programs",
  catalogue: "catalog",
  sceptical: "skeptical",
  storey: "story",
  whilst: "while",
  amongst: "among",
  learnt: "learned",
  spelt: "spelled",
  dreamt: "dreamed",
  burnt: "burned",
  towards: "toward",
};

/** Adds the regular inflections, so the list above stays readable. */
function expand(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [british, american] of Object.entries(BASE)) {
    map.set(british, american);

    if (british.endsWith("ise")) {
      const bStem = british.slice(0, -3);
      const aStem = american.slice(0, -3);
      map.set(`${bStem}ised`, `${aStem}ized`);
      map.set(`${bStem}ises`, `${aStem}izes`);
      map.set(`${bStem}ising`, `${aStem}izing`);
      map.set(`${bStem}isation`, `${aStem}ization`);
    }
    if (british.endsWith("yse")) {
      const bStem = british.slice(0, -3);
      const aStem = american.slice(0, -3);
      map.set(`${bStem}ysed`, `${aStem}yzed`);
      map.set(`${bStem}yses`, `${aStem}yzes`);
      map.set(`${bStem}ysing`, `${aStem}yzing`);
    }
    if (british.endsWith("our")) {
      map.set(`${british}s`, `${american}s`);
      map.set(`${british}ed`, `${american}ed`);
      map.set(`${british}ing`, `${american}ing`);
    }
    if (british === "manoeuvre") {
      map.set("manoeuvres", "maneuvers");
      map.set("manoeuvred", "maneuvered");
      map.set("manoeuvring", "maneuvering");
    }
  }
  return map;
}

const SPELLINGS = expand();
const PATTERN = new RegExp(`\\b(${[...SPELLINGS.keys()].join("|")})\\b`, "gi");

/** Preserves the case of the word being replaced. */
function matchCase(source: string, replacement: string): string {
  if (source === source.toUpperCase() && source.length > 1) return replacement.toUpperCase();
  if (source[0] === source[0]?.toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

export function toUsSpelling(text: string): string {
  return text.replace(PATTERN, (match) => {
    const replacement = SPELLINGS.get(match.toLowerCase());
    return replacement ? matchCase(match, replacement) : match;
  });
}

/** The British spellings present in a piece of text, for reporting. */
export function findBritishSpellings(text: string): string[] {
  return [...new Set(text.match(PATTERN) ?? [])];
}
