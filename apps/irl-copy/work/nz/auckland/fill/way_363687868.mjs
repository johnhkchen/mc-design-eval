// Way 363687868: a four-storey 1960s-70s concrete office/apartment block on a 23 x 23 footprint, Mt Eden side of the city.
// Massing from the lidar roof: main body to 17 blocks (parapet at 16), lower three-storey wings where the lidar reads 11-15.
// Each storey: a floor slab across the footprint (on the perimeter shell, so it is never hanging), two rows of glass in a
// 1-block shell with an air gap behind, a dark spandrel line. White piers every third bay, a base course, a canopied
// entrance, lanterns standing behind some windows, and a small lift overrun on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_363687868.cells.json", "utf8"));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const key = (x, z) => `${x},${z}`;

// the footprint with the lidar roof smoothed into two flat tiers: main (deck 16) and lower wing (deck 12)
const fp = new Map();
for (const [x, z, g, roof] of cells) fp.set(key(x, z), { g, deck: roof >= 16 ? 16 : 12 });
const at = (x, z) => fp.get(key(x, z));
const outside = (x, z) => !at(x, z);
const outward = (x, z) => Object.keys(DIRS).filter((d) => outside(x + DIRS[d][0], z + DIRS[d][1]));
const isRing = (x, z) => outward(x, z).length > 0;
const storeyFloors = (c) => { const F = []; for (let k = 0; k < 4; k++) { const f = c.g + 4 * k; if (f >= c.deck) break; F.push(f); } return F; };

// the facade a shell cell faces: its north/south face if it has one (bays run along x), else east/west (bays run along z)
const facade = (out) => out.find((d) => d === "N" || d === "S") ?? out[0];
const bayOf = (x, z, dir) => (dir === "N" || dir === "S" ? x : z);

// the entrance: a ground-floor shell cell on the south face over solid ground, its canopy outside, nearest the middle
let door = null;
for (const [x, z] of cells) {
  const c = at(x, z); if (!c || c.g !== 1 || !outward(x, z).includes("S")) continue;
  if (!outside(x - 1, z + 1) || !outside(x, z + 1) || !outside(x + 1, z + 1)) continue;
  if (door === null || Math.abs(x - 11) < Math.abs(door[0] - 11)) door = [x, z];
}

const g = new Voxels([23, 30, 23]);
const glass = "light_blue_stained_glass", pier = "white_concrete", line = "stone";
const base = "polished_andesite", cornice = "smooth_stone", roofDeck = "stone";
const lanterns = [];

for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  const F = storeyFloors(c), out = outward(x, z), ring = out.length > 0;
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < c.g; y++) g.set(x, y, z, base);
  // the roof deck over the whole footprint (the cornice on the shell)
  g.set(x, c.deck, z, ring ? cornice : roofDeck);
  F.forEach((f, si) => {
    // floor slab across the footprint; at the ground it is the base course on the shell
    g.set(x, f, z, si === 0 && ring ? base : line);
    if (!ring) return;
    const dir = facade(out);
    const bay = bayOf(x, z, dir);
    const isPier = bay % 3 === 0;
    for (const rel of [1, 2]) {
      const y = f + rel; if (y >= c.deck) continue;
      if (door && x === door[0] && z === door[1] && si === 0) {
        g.set(x, y, z, "iron_door", { facing: "south", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, isPier ? pier : glass);
      }
    }
    // spandrel line under the next floor (the cornice at the top is already set)
    if (f + 3 < c.deck) g.set(x, f + 3, z, line);
    // a lantern standing on the slab behind some glazed bays on the upper storeys
    if (!isPier && si >= 1 && (bay + 2 * si) % 6 === 1) {
      const [dx, dz] = DIRS[dir]; const ix = x - dx, iz = z - dz;
      const inner = at(ix, iz);
      if (inner && !isRing(ix, iz) && storeyFloors(inner).includes(f)) lanterns.push([ix, f + 1, iz]);
    }
  });
}
for (const [x, y, z] of lanterns) g.set(x, y, z, "lantern", { hanging: "false" });

// the canopy over the entrance: a plate one cell out from the wall, carried by two posts on the ground beside the door
if (door) {
  const [x, z] = door, c = at(x, z), y0 = c.g + 3;
  for (const a of [-1, 0, 1]) if (outside(x + a, z + 1)) g.set(x + a, y0, z + 1, "smooth_stone");
  for (const a of [-1, 1]) for (let y = 0; y < y0; y++) g.set(x + a, y, z + 1, y < c.g ? base : "smooth_stone");
}

// a lift overrun on the main roof (3 x 3, two blocks above the deck), on the cells nearest the middle
let best = null;
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1 && ok; dz++) {
    const d = at(x + dx, z + dz); if (!d || d.deck !== 16 || isRing(x + dx, z + dz)) ok = false;
  }
  if (ok && (!best || Math.abs(x - 11) + Math.abs(z - 11) < Math.abs(best[0] - 11) + Math.abs(best[1] - 11))) best = [x, z];
}
if (best) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const y of [17, 18]) g.set(best[0] + dx, y, best[1] + dz, "white_concrete");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_363687868.nbt");
console.log(JSON.stringify({ door, overrun: best, lanterns: lanterns.length, blocks: g.count() }));
