// DC81432: 30 E Street SW, Washington DC 20024, Public Service (federal office), as a 1.21.1 module.
// Reading of the record: lidar roofs 12 to 15 blocks above y 0 (about 36 m at 0.42 blocks/m), a 44 x 20 footprint
// that is one wide block with a stepped-up core. That is a three-storey stripped-classical office block of the
// mid-20th century: pale limestone walls (calcite), a granite-look plinth and string courses (polished andesite), a
// glazed window grid on three-cell bays with calcite piers, and an attic storey over the core where the roof rises.
// Two entrances on the north face, under calcite lintels. Warm glow in some windows; roof units on the flat roof.
// The lidar roof is median-smoothed (3x3) and snapped to three tiers (12, 14, 15), then the tiers take a 3x3 majority so
// single-cell steps drop out. Every column is solid from y 0 up to its ground (foundation), and every storey, attic
// and roof deck is a full-footprint slab, so nothing floats. Interiors are air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81432.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81432.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const outward = (c) => DIRS.filter(([dx, dz]) => !inF(c.x + dx, c.z + dz));   // directions that leave the footprint
const shell = (c) => outward(c).length > 0;

// Palette
const BASE = "polished_andesite";   // granite-look plinth, floor string courses, the ground-floor base course
const STONE = "calcite";            // limestone walls, piers, lintels, head courses, cornice
const FLOOR = "smooth_stone";       // interior floor slabs and roof decks
const GLASS = "glass_pane";
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const UNIT = "iron_block";          // roof plant on the flat roof

// Roof: 3x3 median of the lidar per cell, then snapped to three tiers.
const median3 = (c) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = F.get(key(c.x + dx, c.z + dz)); if (n) v.push(n.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (h) => (h <= 13 ? 12 : h === 14 ? 14 : 15);     // three storeys; attic; penthouse core
const tier0 = new Map([...F.values()].map((c) => [key(c.x, c.z), tierOf(median3(c))]));
// Majority of the tier over the 3x3 (a tie keeps the cell's own tier): one-cell islands of steps drop out.
const T = new Map();
for (const c of F.values()) {
  const count = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const t = tier0.get(key(c.x + dx, c.z + dz)); if (t !== undefined) count.set(t, (count.get(t) || 0) + 1);
  }
  const own = tier0.get(key(c.x, c.z));
  let best = own, bestN = count.get(own) || 0;
  for (const [t, n] of count) if (n > bestN) { best = t; bestN = n; }
  T.set(key(c.x, c.z), best);
}
const tierAt = (c) => T.get(key(c.x, c.z));

// Entrances: two doors on the north face (outward -z), on window bays of the ground storey at the 12 tier.
const north = [...F.values()].filter((c) => c.g === 0 && tierAt(c) === 12 && outward(c).some(([dx, dz]) => dx === 0 && dz === -1))
  .filter((c) => c.x % 3 === 1).sort((a, b) => a.x - b.x);
const doors = new Map();
if (north.length >= 2) {
  for (const i of [Math.floor(north.length / 4), Math.floor((3 * north.length) / 4)]) {
    const c = north[i]; doors.set(key(c.x, c.z), c);
  }
}

const g = new Voxels([44, 27, 20]);

for (const c of F.values()) {
  const gr = c.g, top = tierAt(c), edge = shell(c), out = outward(c);
  const along = out.some(([, dz]) => dz !== 0) ? c.x : c.z;     // position along the face the cell sits on
  const pier = out.length >= 2 || along % 3 === 0;              // corners and every third cell are calcite piers
  const isDoor = doors.has(key(c.x, c.z));

  // Foundation under the cell's ground.
  for (let y = 0; y < gr; y++) g.set(c.x, y, c.z, BASE);

  for (let y = gr; y < top; y++) {
    if (isDoor && edge && y <= gr + 1) {                          // the door leaves the floor band open
      const d = out[0];
      g.set(c.x, y, c.z, DOOR, { facing: NAME[`${d[0]},${d[1]}`], half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const band = y === gr || y === 4 || y === 8 || y === 12;     // floor level: string course on the shell, slab inside
    const head = y === 3 || y === 7 || y === 11 || y === top - 1; // head course; the top one is the roof deck
    if (band) { g.set(c.x, y, c.z, edge ? BASE : FLOOR); continue; }
    if (y === top - 1) { g.set(c.x, y, c.z, edge ? STONE : FLOOR); continue; }
    if (head) { if (edge) g.set(c.x, y, c.z, STONE); continue; }  // interior stays air under the deck of a storey
    if (!edge) continue;                                          // interior air behind the glass
    if (isDoor && y === gr + 2) { g.set(c.x, y, c.z, STONE); continue; }
    if (pier) { g.set(c.x, y, c.z, STONE); continue; }
    // A glazed bay: panes connect along the face.
    const along2 = out.some(([, dz]) => dz !== 0);
    g.set(c.x, y, c.z, GLASS, along2
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" });
    // Some lit windows: a glowstone on the room floor just behind the pane (lowest window row only).
    if (y === gr + 1 && out.length === 1 && (along * 7 + c.z * 3 + gr * 5) % 9 === 0) {
      const [dx, dz] = out[0];
      const ix = c.x - dx, iz = c.z - dz;
      if (inF(ix, iz) && !shell({ x: ix, z: iz })) g.set(ix, y, iz, LAMP);
    }
  }

  // Roof plant: a few units on the flat deck of the lower roof, standing on the deck (interior only).
  if (!edge && top === 12 && c.x % 9 === 4 && c.z % 7 === 3) g.set(c.x, top, c.z, UNIT);
}

const r = g.save(OUT);
console.log(`DC81432: ${r.blocks} blocks, ${r.palette} palette entries, doors ${doors.size}`);
