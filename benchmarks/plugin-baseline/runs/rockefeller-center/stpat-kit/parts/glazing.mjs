// Part "glazing and light": lancets with stained glass and froglight, the rose window, transept tracery windows,
// transept portals, the west lamp posts, and lanterns on the ambulatory decks. Writes only into air (the shell's openings).
import { lancet, tracery_window, portal_arch, lamp_post, roof_light } from "../vocab.mjs";

// Box of one lancet: the opening's jambs and head plus the two cells behind the face (depth 0..2), inward = the wall's interior side.
const lancetBox = (face, p, c, y0, y1, w = 3) => {
  const h = (w - 1) / 2, inward = face === "north" || face === "west" ? 1 : -1;
  const d = [p, p + 2 * inward].sort((a, b) => a - b);
  return face === "north" || face === "south"
    ? [[c - h, y0, d[0]], [c + h, y1, d[1]]]
    : [[d[0], y0, c - h], [d[1], y1, c + h]];
};

// The helper's sill is a bottom slab, so the glass above it stands on half a block of air; a full polished diorite sill
// sits on the wall below instead. Only the sill cells that are air are this part's to write: a cell the shell already
// holds stays as it is (earlier parts are locked), so the sill is taken in air-only before the lancet helper runs.
const isAir = (g, x, y, z) => !g.get(x, y, z) || /(^|_)air$/.test(g.get(x, y, z).block);
const lancetAt = (g, face, p, c, y0, y1) => {
  const w = 3, h = (w - 1) / 2, along = face === "north" || face === "south", sill = [];
  for (let u = -h; u <= h; u++) for (let d = 0; d <= 1; d++) {
    const x = along ? c + u : face === "west" ? p + d : p - d;
    const z = along ? (face === "north" ? p + d : p - d) : c + u;
    if (isAir(g, x, y0, z)) sill.push([x, y0, z]);
  }
  lancet(g, lancetBox(face, p, c, y0, y1, w), face, p, c, y0, y1, w);
  for (const [x, y, z] of sill) g.set(x, y, z, "polished_diorite");
};

export function build(g) {
  // Nave: aisle lancets on the outer walls z 4 / z 36, clerestory on z 14 / z 26 (bays centred on x 13..43).
  for (const c of [13, 19, 25, 31, 37, 43]) {
    // The bay at 43 sits inside the transept aisle (x 39..45), which has no outer wall at z 4 / z 36: clerestory only.
    if (c !== 43) {
      lancetAt(g, "north", 4, c, 6, 15);
      lancetAt(g, "south", 36, c, 6, 15);
    }
    lancetAt(g, "north", 14, c, 24, 31);
    lancetAt(g, "south", 26, c, 24, 31);
  }
  // Choir: aisle lancets on z 6 / z 34, clerestory on z 14 / z 26.
  for (const c of [67, 73, 80]) {
    lancetAt(g, "north", 6, c, 6, 15);
    lancetAt(g, "south", 34, c, 6, 15);
  }
  for (const c of [61, 67, 73]) {
    lancetAt(g, "north", 14, c, 24, 31);
    lancetAt(g, "south", 26, c, 24, 31);
  }
  // Apse faces (east end, z 19..21) and the Lady Chapel's east end.
  lancetAt(g, "east", 84, 20, 24, 31);
  lancetAt(g, "east", 104, 20, 5, 18);
  // Transept aisle lancets on the end walls z 0 / z 40.
  for (const c of [42, 62]) {
    lancetAt(g, "north", 0, c, 6, 15);
    lancetAt(g, "south", 40, c, 6, 15);
  }
  // Lady Chapel lancets on z 16 / z 24, between its buttresses.
  for (const c of [90, 94, 98]) {
    lancetAt(g, "north", 16, c, 5, 18);
    lancetAt(g, "south", 24, c, 5, 18);
  }
  // Ambulatory chapel windows on z 9 / z 31.
  lancetAt(g, "north", 9, 86, 6, 14);
  lancetAt(g, "south", 31, 86, 6, 14);

  // Rose window: built whole (rim, tracery, glass, froglight) with the west front, parts/westfront.mjs rose().

  // Transept great windows: 9-wide tracery in the end walls.
  tracery_window(g, [48, 15, 0, 56, 30, 0], "north");
  tracery_window(g, [48, 15, 40, 56, 30, 40], "south");

  // Transept portals (5 wide, copper doors), centred x 52.
  portal_arch(g, [52, 3, 0], "north", 2, 5, 8);
  portal_arch(g, [52, 3, 40], "south", 2, 5, 8);

  // Lamp posts at the ends of the west steps (z 13 and 27 are inside the towers, so the steps' edge cells carry them).
  lamp_post(g, 0, 3, 14);
  lamp_post(g, 0, 3, 26);

  // Lanterns on the flat ambulatory-chapel decks (y 21); they place only where the roofs part laid the deck.
  roof_light(g, [84, 21, 9], [89, 21, 14]);
  roof_light(g, [84, 21, 26], [89, 21, 31]);
}
