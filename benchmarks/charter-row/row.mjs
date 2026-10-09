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
  concord: "THE CONCORD (original, older): deepslate bricks and deepslate tiles for walls, polished deepslate and chiseled deepslate for trim, " +
    "stripped oak and oak logs for columns, posts and beams, oak doors and frames, a stone-brick or cobbled deepslate plinth; heavy, honest, " +
    "symmetrical civic architecture with cornices, pediments and deep window reveals; weathered (cracked deepslate, a little moss at the base).",
  operator: "THE OPERATORS (later, newer): smooth quartz, calcite, white concrete, large clean glass panes, slim light-grey or cyan accents, small " +
    "gold or copper lettering and fittings. They ADAPTED the old buildings the way real buildings get reused, not by stacking new floors on " +
    "top: the original building stays whole and readable (its walls, roof, columns, cornices, proportions), and the new layer appears where " +
    "people touch and look: a new shopfront or glass vestibule set INTO the old ground-floor openings, old windows re-glazed with big clean " +
    "panes inside the original stone frames, a new sign hung over (or beside) the old carved name, fresh quartz trim on doorways and steps, " +
    "cleaned stone at street level against weathered stone above, lamps, planters, railings; occasionally a modest glass extension at the side " +
    "or a small rooftop pavilion set back from the edge. The more an owner spent, the more of these interventions, never a building-on-a-building.",
  have_nots: "THE HAVE-NOTS (patched, cheap): repairs in cobblestone, mud bricks and plain planks, wool banners and painted signs, " +
    "hand-made additions; worn but cared for.",
  read: "The Row is read by walking it: from the Tribunal end the buildings get newer, brighter and better funded; walking back they get older " +
    "and quieter. On every building the history is readable the way it is in a real old town: the original Concord building in deepslate and " +
    "oak is still the building, and the newer owners' quartz, glass and signs are woven into it at the street, the entrance and the windows.",
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
    what: "a two-storey Concord civic office built to be walked into: a wide arcade of open arches on the ground floor. The Permit Office " +
      "rents the ground floor and has glazed those arches with a clean quartz-and-glass shopfront, and hung a bright PERMIT OFFICE sign just " +
      "below the old carved INSPECTORATE lettering, which is still there. The upper floor is untouched and dark: old windows, unlit, a shutter " +
      "or two closed. A battered complaint box by the door, overflowing",
  },
  "press-gallery": {
    name: "The Press Gallery", newness: 0.4, where: "old Concord core", size: { w: 19, d: 29, h: 15 },
    what: "a long print hall, once the loudest building on the Row: tall arched hall windows along the sides, a clerestory and roof vents or a " +
      "chimney for the presses, a big loading door, a viewing balcony expressed on the facade; the operators bought it: a new bright " +
      "SETTLEMENT COURIER sign mounted on the old facade, the front doors and balcony railings renewed in quartz and glass, the front stone " +
      "cleaned, while the long side walls and the back end stay old and sooty where a small hand press still runs",
  },
  "reading-room": {
    name: "The Reading Room", newness: 0.15, where: "behind the Press Gallery", size: { w: 7, d: 9, h: 7 },
    what: "a small one-room annex behind the print hall, once a storeroom, now lived in by a former Inspectorate clerk: a single door with a " +
      "hand-painted READING ROOM board, a window with a lamp and curtains, a barrel by the door (the public record), and an open garden gate " +
      "on one side leading to the sanctuary village; tiny, humble, lived-in",
  },
  "stronghold-institute": {
    name: "The Stronghold Institute", newness: 0.75, where: "operator avenue", size: { w: 23, d: 17, h: 16 },
    what: "a think tank that moved into the old Concord library and kept its shelves: the library itself is intact, a dignified two-storey " +
      "deepslate-and-oak hall with tall reading-room windows; the Institute re-glazed those windows with heavy clean glass, rebuilt the entrance " +
      "as a quartz-framed portal with bronze-coloured doors and an engraved STRONGHOLD INSTITUTE name band, added quartz copings and " +
      "security railings; serious, expensive, slightly fortified-looking",
  },
  "bench-fellows": {
    name: "The Bench Fellows Society", newness: 0.6, where: "operator avenue", size: { w: 13, d: 23, h: 16 },
    what: "a converted chapel: the Concord chapel's gable front, bell tower or steeple and tall pointed windows survive, discreetly restored " +
      "with quartz trim, a new glass door and a small polished brass plaque; quiet, polite, members-only, a mirror image of the Tribunal",
  },
  "founders-circle": {
    name: "The Founders' Circle", newness: 0.65, where: "operator avenue", size: { w: 15, d: 13, h: 13 },
    what: "a former Concord guesthouse for visiting dignitaries, three storeys of handsome deepslate and oak with a balcony and good " +
      "proportions, still entirely the old building; the new owners added a slim quartz canopy over a glass lobby door, polished the steps, " +
      "re-glazed the windows, put a row of identical brass name plates by the door and ONE shared mailbox; elegant old bones, new gloss",
  },
  "deepslate-holdings": {
    name: "Deepslate Holdings", newness: 0.7, where: "operator avenue", size: { w: 17, d: 15, h: 22 },
    what: "the old Concord granary, still standing as the granary: a tall deepslate-and-oak storehouse with an elevator head on the roof and " +
      "grain chutes running down the side. The new owners glazed the chutes as stair shafts with clean glass, opened a glass entrance with a " +
      "friendly quartz surround and a COMMUNITY SERVICES sign into the old loading bays at street level, and added planters and lamps; " +
      "industrial old bones dressed as a friendly corporate front",
  },
  "meridian": {
    name: "Meridian Yield & Exchange", newness: 0.95, where: "operator avenue", size: { w: 35, d: 31, h: 20 },
    what: "the nicest building on the Row: a bright, low-rise campus of two or three linked buildings of quartz, calcite and glass around a " +
      "landscaped courtyard that was the Concord's guest square, crisp and young; the old square's deepslate paving, its oak-shaded fountain and " +
      "a stretch of the old Concord arcade are kept as features in the courtyard; the founder's study is a glass pavilion set back on the roof " +
      "of the main building",
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
    : b.newness < 0.6 ? "the Concord building, adapted: a few clear operator interventions at the street, entrance and windows"
    : b.newness < 0.9 ? "the Concord building, extensively adapted by a wealthy owner: many operator interventions, but still recognisably the old building"
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
