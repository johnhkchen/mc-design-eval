// White pavilions and galleria (P3): D, D1, D2 (white panels and glass, flat roofs), the E galleria arcade with its
// glass skylights, the red canopy over D's north entrance, and the doors. Builds only into air: an earlier part's
// cell is never overwritten, and a refused write is simply skipped.
import { doorPair, redCanopy, galleriaSkylight } from "../vocab.mjs";

// The three white masses (plan.md: D, D1, D2a+D2b) and the galleria rects (E1..E3), by name.
const GROUPS = {
  D: { top: 14, rects: [[136, 96, 207, 119]], coping: true },
  D1: { top: 7, rects: [[208, 100, 211, 103]], coping: true },
  D2: { top: 7, rects: [[208, 112, 219, 119], [212, 120, 219, 123]], coping: true },
  E: { top: 6, rects: [[104, 120, 199, 123], [104, 124, 171, 127], [108, 128, 123, 131]], coping: false },
};

const inRects = (rects, x, z) => rects.some(([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1);

/** The name of the mass that owns cell (x, z), or null (open ground, the lightwell, the Armory). */
function groupOf(x, z) {
  for (const [name, { rects }] of Object.entries(GROUPS)) if (inRects(rects, x, z)) return name;
  return null;
}

/** Write only into air: an earlier part's cell (or a door cell already placed here) is left as it is. */
function put(g, x, y, z, block, state) {
  if (g.isAir(x, y, z)) g.set(x, y, z, block, state);
}

/** A cell of group `name` is wall when one of its four neighbours lies outside the group, except the galleria's open
 *  arch into the Armory hall (x 104, z 122..127 faces x 103, the cut in B's wall that is left air). */
function isWall(name, x, z) {
  if (groupOf(x, z) !== name) return false;
  if (name === "E" && x === 104 && z >= 122 && z <= 127) return false;
  return [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([nx, nz]) => groupOf(nx, nz) !== name);
}

/** Walls of one mass: a 1-high base, a glass body with white piers, a white band and fascia, a coping on the flat
 *  roof, and the flat roof deck laid over the interior. Only air cells are written, so the doors and canopy placed
 *  first keep their openings. */
function envelope(g, name) {
  const { top, coping } = GROUPS[name];
  const cells = [];
  for (const [x0, z0, x1, z1] of GROUPS[name].rects)
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (groupOf(x, z) === name) cells.push([x, z]);
  const walls = cells.filter(([x, z]) => isWall(name, x, z));
  const wallSet = new Set(walls.map(([x, z]) => `${x},${z}`));
  // the mass's extent along each face, so its corners and every 7th cell carry a white pier
  const xs = cells.map(([x]) => x), zs = cells.map(([, z]) => z);
  const bx = [Math.min(...xs), Math.max(...xs)], bz = [Math.min(...zs), Math.max(...zs)];
  for (const [x, z] of walls) {
    const onXFace = !wallSet.has(`${x},${z - 1}`) || !wallSet.has(`${x},${z + 1}`);
    const along = onXFace ? x : z, [a0, a1] = onXFace ? bx : bz;
    const pier = (along - a0) % 7 === 0 || along === a1 || along === a0;
    const state = {
      north: String(wallSet.has(`${x},${z - 1}`)), south: String(wallSet.has(`${x},${z + 1}`)),
      east: String(wallSet.has(`${x + 1},${z}`)), west: String(wallSet.has(`${x - 1},${z}`)),
    };
    put(g, x, 1, z, "light_gray_concrete");
    for (let y = 2; y < top; y++) {
      if (y === 7 || pier) put(g, x, y, z, "white_concrete");
      else put(g, x, y, z, "glass_pane", state);
    }
    put(g, x, top, z, "white_concrete");
    if (coping) put(g, x, top + 1, z, "light_gray_concrete");
  }
  // flat roof deck over the interior (white panel on the pavilions, quartz under the galleria's skylights)
  for (const [x, z] of cells) if (!wallSet.has(`${x},${z}`)) put(g, x, top, z, name === "E" ? "smooth_quartz" : "white_concrete");
}

export function build(g) {
  // doors first, so the walls that follow leave their openings as they are
  doorPair(g, { x: 170, z: 96, face: "north", width: 4 });           // D north entrance under the red canopy
  doorPair(g, { x: 211, z: 101, face: "east", width: 2 });          // D1 kiosk
  doorPair(g, { x: 215, z: 123, face: "south", width: 2 });         // D2 annex, south
  doorPair(g, { x: 118, z: 120, face: "north", width: 4 });         // galleria north doors, to the lawn
  doorPair(g, { x: 146, z: 127, face: "south", width: 4 });         // galleria south doors, to the plaza
  doorPair(g, { x: 184, z: 123, face: "south", width: 4 });         // galleria south doors, east arm
  redCanopy(g, { x0: 168, x1: 175, z0: 93, z1: 95 });

  // galleria skylights go in before its roof is laid, so the strip is glass and not quartz
  galleriaSkylight(g, { rect: { x0: 104, z0: 120, x1: 199, z1: 123 } });
  galleriaSkylight(g, { rect: { x0: 104, z0: 124, x1: 171, z1: 127 } });
  galleriaSkylight(g, { rect: { x0: 108, z0: 128, x1: 123, z1: 131 } });

  for (const name of Object.keys(GROUPS)) envelope(g, name);

  // hanging lanterns under each galleria skylight, hung from the glass strip (ceiling at y 6)
  for (let x = 107; x <= 196; x += 6) put(g, x, 5, 121, "lantern", { hanging: "true" });
  for (let x = 107; x <= 168; x += 6) put(g, x, 5, 125, "lantern", { hanging: "true" });
  for (let x = 111; x <= 120; x += 6) put(g, x, 5, 129, "lantern", { hanging: "true" });
}
