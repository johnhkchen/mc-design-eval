// CHARTER ROW: a district of second-life buildings. The Concord's civic core, later taken over by operators; the old
// purpose shows through the new signs. Exterior only. 1:1 scale: a player (2 blocks) is an adult or a tall teen, so
// 1 block ≈ 0.8-0.9 m. This file is the shared style guide + the building briefs every stage reads.

export const SCALE = [
  "SCALE (1:1, a player is 2 blocks tall): an ordinary storey is 4 blocks floor to floor, a grand civic floor 5-6;",
  "doors are 2 blocks tall (3 for grand entrances, double doors 2 wide); windows start 1 block above the floor and are 2-3 tall;",
  "steps are 1 block per riser; railings and parapets 1 block high; columns on a grand portico 7-10 blocks tall.",
].join(" ");

// Two layers every building is made of, in a different mix. `newness` 0 = untouched Concord, 1 = all operator.
export const STYLE = {
  concord: "THE CONCORD (original, older, below): deepslate bricks and deepslate tiles for walls, polished deepslate and chiseled deepslate for trim, " +
    "stripped oak and oak logs for columns, posts and beams, oak doors and frames, a stone-brick or cobbled deepslate plinth; heavy, honest, " +
    "symmetrical civic architecture with cornices, pediments and deep window reveals; weathered (cracked deepslate, a little moss at the base).",
  operator: "THE OPERATORS (later, newer, added on top): smooth quartz, quartz pillars, calcite and white concrete cladding, large glass panes and " +
    "glass storefronts, slim light-grey or cyan accents, small gold or copper lettering and fittings; clean, bright, new, unweathered; " +
    "added as new upper storeys, new entrances, cladding over old walls, and new signs over old ones.",
  have_nots: "THE HAVE-NOTS (patched, cheap): repairs in cobblestone, mud bricks and plain planks, wool banners and painted signs, " +
    "hand-made additions; worn but cared for.",
  read: "The Row is read by walking it: from the Tribunal end the buildings get newer, brighter and better funded; walking back they get older " +
    "and quieter. On every building the history must be readable from the materials: original deepslate and oak below, quartz and glass on top.",
};

export const BUILDINGS = {
  "tribunal-house": {
    name: "Tribunal House", newness: 0.1, where: "old Concord core", size: { w: 27, d: 23, h: 19 },
    what: "the oldest building on the Row: a columned stone courthouse built by settlers who had lost farms to raids and wanted a place to be heard; " +
      "a deep portico of six stripped-oak-and-deepslate columns under a pediment, a broad flight of steps, tall courtroom windows; " +
      "still in use one day a week, so it is clean but tired; the side gallery windows are stacked with boxes of permit filings",
  },
  "inspectorate": {
    name: "The Inspectorate", newness: 0.35, where: "old Concord core", size: { w: 17, d: 13, h: 11 },
    what: "a two-storey civic office built to be walked into: a wide, open, welcoming ground floor (now rented to the Permit Office, with a new " +
      "quartz-and-glass shopfront and a bright PERMIT OFFICE sign over the old carved INSPECTORATE lettering) and a dark upper floor with " +
      "shuttered or unlit windows; a battered complaint box by the door, overflowing",
  },
  "press-gallery": {
    name: "The Press Gallery", newness: 0.4, where: "old Concord core", size: { w: 19, d: 29, h: 15 },
    what: "a long print hall, once the loudest building on the Row: tall arched hall windows along the sides, a clerestory and roof vents or a " +
      "chimney for the presses, a big loading door, a viewing balcony expressed on the facade; the operators bought it: a new bright " +
      "SETTLEMENT COURIER sign and fresh paint on the front, while the back end stays old and sooty where a small hand press still runs",
  },
  "reading-room": {
    name: "The Reading Room", newness: 0.15, where: "behind the Press Gallery", size: { w: 7, d: 9, h: 7 },
    what: "a small one-room annex behind the print hall, once a storeroom, now lived in by a former Inspectorate clerk: a single door with a " +
      "hand-painted READING ROOM board, a window with a lamp and curtains, a barrel by the door (the public record), and an open garden gate " +
      "on one side leading to the sanctuary village; tiny, humble, lived-in",
  },
  "stronghold-institute": {
    name: "The Stronghold Institute", newness: 0.75, where: "operator avenue", size: { w: 23, d: 17, h: 16 },
    what: "a think tank built on top of the old Concord library: the library's deepslate ground floor and tall reading-room windows remain, " +
      "with a new quartz-and-glass upper storey and a new formal entrance with an engraved STRONGHOLD INSTITUTE name band; serious, " +
      "expensive, slightly fortified-looking",
  },
  "bench-fellows": {
    name: "The Bench Fellows Society", newness: 0.6, where: "operator avenue", size: { w: 13, d: 23, h: 16 },
    what: "a converted chapel: the Concord chapel's gable front, bell tower or steeple and tall pointed windows survive, discreetly restored " +
      "with quartz trim, a new glass door and a small polished brass plaque; quiet, polite, members-only, a mirror image of the Tribunal",
  },
  "founders-circle": {
    name: "The Founders' Circle", newness: 0.65, where: "operator avenue", size: { w: 15, d: 13, h: 13 },
    what: "a former guesthouse for visiting dignitaries, three storeys: a refined front with a canopy over a glass lobby door, a plaque wall " +
      "visible inside, two upper floors of identical offices, and ONE shared mailbox by the door; elegant old bones, new gloss",
  },
  "deepslate-holdings": {
    name: "Deepslate Holdings", newness: 0.7, where: "operator avenue", size: { w: 17, d: 15, h: 22 },
    what: "built on the old Concord granary: the tall deepslate granary body, the elevator head at the top and the grain chutes on the side " +
      "survive, the chutes now glazed as people-movers or stair shafts; a new low quartz-and-glass lobby grafted onto the front with a " +
      "COMMUNITY SERVICES sign; industrial old bones dressed as a friendly corporate front",
  },
  "meridian": {
    name: "Meridian Yield & Exchange", newness: 0.95, where: "operator avenue", size: { w: 35, d: 31, h: 20 },
    what: "the nicest building on the Row: a bright campus on the Concord's former guest square, buildings of quartz, calcite and glass around a " +
      "landscaped courtyard, crisp and young; a few Concord deepslate paving stones and an old fountain basin survive in the courtyard; the " +
      "founder's study is a glass pavilion on the top floor of the main block",
  },
  "settlers-league": {
    name: "The Settlers' League hall", newness: 0.5, funding: "cheapest", where: "operator avenue", size: { w: 7, d: 9, h: 8 },
    what: "the cheapest building on the avenue and the busiest: grown out of a market stall that sold flags, now a banner shop with a meeting " +
      "room above; a wide open shop counter under an awning, banners of every colour hung on the front, cheap plank and wool additions on " +
      "an old deepslate stall base; crowded, colourful, popular",
  },
  "legal-union": {
    name: "The Villagers' Legal Union", newness: 0.2, funding: "poor", where: "across the street", size: { w: 13, d: 13, h: 15 },
    what: "the old Concord Legal Aid Hall, inherited when funding dried up: three storeys of tired deepslate with patched repairs, basement " +
      "window wells lit where the caseworkers work among the files, a modest door with a hand-lettered sign, and a top floor with a window " +
      "that looks straight across at the Stronghold Institute",
  },
};

/** The concept-sheet prompt for one building: reference sheet (front elevation + 3/4) at the stated block size. */
export function conceptPrompt(key) {
  const b = BUILDINGS[key];
  const mix = b.newness < 0.3 ? "almost entirely the Concord layer, with at most a small later addition"
    : b.newness < 0.6 ? "a clear mix: the Concord building below and behind, operator additions on the front and above"
    : b.newness < 0.9 ? "mostly the operator layer, with the Concord building clearly showing through below and at the back"
    : "almost entirely the operator layer, with only small Concord remnants";
  return [
    "Minecraft builder reference sheet for ONE building, vanilla Minecraft blocks only, crisp voxel style, plain light background,",
    "no characters, no animals, no neighbouring buildings, no street scene, exterior only.",
    "Two views side by side: LEFT a straight-on FRONT ELEVATION (orthographic, no perspective); RIGHT a three-quarter view from the street at the same scale.",
    `Subject: ${b.name}, ${b.what}.`,
    `It stands in Charter Row, a district of second-life buildings: ${STYLE.read}`,
    `Its materials are ${mix}. ${STYLE.concord} ${STYLE.operator}${b.funding ? ` ${STYLE.have_nots}` : ""}`,
    `Size: about ${b.size.w} blocks wide along the street, ${b.size.d} deep, ${b.size.h} tall. ${SCALE}`,
    "Skilled human builder quality: real massing (not a box), depth (things proud of the wall, recessed openings), framed openings,",
    "real roof edges, sub-block detail (stairs, slabs, fences, walls, trapdoors, lanterns). Signs as simple blocky lettering.",
  ].join(" ");
}
