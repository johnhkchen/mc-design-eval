// Way 269465182: a two-storey Edwardian brick shop block on a falling site. Brick walls on a stone plinth, a smooth
// string course at y 4 (first floor) and a cornice at y 8, a parapet above it. Sash bays with white frames and glass,
// shopfront glass and a door on the south face. The lidar roof is 9 blocks over the lowest ground; the NW corner rises
// to 11 as a three-storey bay. Each column stands on a solid foundation to its own ground level, so the downhill
// (east) side shows an extra storey. Lamps sit in the air behind some glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465182.cells.json", "utf8"));
const g = new Voxels([40, 24, 16]);

const F = new Map();
for (const [x, z, gr] of cells) F.set(`${x},${z}`, { x, z, gr, tower: x <= 7 && z <= 4 });
const has = (x, z) => F.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
for (const c of F.values()) {
  c.out = Object.keys(DIRS).filter((d) => !has(c.x + DIRS[d][0], c.z + DIRS[d][1]));
  c.facade = c.out.length > 0;
  c.corner = c.out.some((d) => d === "N" || d === "S") && c.out.some((d) => d === "W" || d === "E");
}

// window band containing y: the ground band (above the plinth, below the first-floor line), the upper band, or the tower's
const bandAt = (c, y) => {
  if (c.tower) return y === 9 ? { lo: 9, hi: 9 } : null;
  if (y >= c.gr + 1 && y <= 3) return { lo: c.gr + 1, hi: 3 };
  if (y >= 5 && y <= 7) return { lo: 5, hi: 7 };
  return null;
};
// a bay of two glass columns between piers, on the face the cell looks out of (north/south faces run along x, the ends along z)
const alongOf = (c) => (c.out.includes("N") || c.out.includes("S") ? c.x : c.z);
const isGlassBay = (c) => [1, 2].includes(((alongOf(c) % 4) + 4) % 4);
const inward = (c) => { const o = DIRS[c.out[0]]; return [c.x - o[0], c.z - o[1]]; };

for (const c of F.values()) {
  const top = c.tower ? 10 : 8;
  for (let y = 0; y <= top; y++) {
    if (y < c.gr) { g.set(c.x, y, c.z, "stone_bricks"); continue; }                       // foundation to its own ground
    if (y === c.gr) { g.set(c.x, y, c.z, c.facade ? "stone_bricks" : "smooth_stone"); continue; }   // plinth / floor
    if (y === 8 || (c.tower && y === 10)) { g.set(c.x, y, c.z, "smooth_stone"); continue; }  // roof deck, floor, cornice
    if (y === 4 && c.gr < 4) { g.set(c.x, y, c.z, "smooth_stone"); continue; }            // first-floor line
    if (!c.facade) continue;                                                              // interior air
    const band = bandAt(c, y);
    if (band && isGlassBay(c)) {
      const frame = band.hi - band.lo >= 2 && (y === band.lo || y === band.hi);
      g.set(c.x, y, c.z, frame ? "white_concrete" : "glass_pane");
      const mid = (band.lo + band.hi) >> 1;
      if (y === mid && [1, 5].includes(((alongOf(c) % 8) + 8) % 8)) {
        const [ix, iz] = inward(c), n = F.get(`${ix},${iz}`);
        if (n && !n.facade) g.set(ix, y, iz, ((alongOf(c) % 8) + 8) % 8 === 1 ? "glowstone" : "shroomlight");
      }
      continue;
    }
    g.set(c.x, y, c.z, "bricks");                                                         // pier or blind wall
  }
  if (!c.tower && c.facade) g.set(c.x, 9, c.z, "bricks");                               // parapet above the cornice
}

// entrance: a door on a low south-facing bay, with a white lintel
const doors = [...F.values()].filter((c) => c.facade && !c.corner && !c.tower && c.out.includes("S") && c.gr <= 1 && isGlassBay(c))
  .sort((a, b) => a.x - b.x);
const d = doors.length ? doors[Math.floor(doors.length / 2)] : [...F.values()].find((c) => c.facade && c.gr <= 1);
if (d) {
  const facing = FACING[d.out[0]];
  g.set(d.x, d.gr + 1, d.z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(d.x, d.gr + 2, d.z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  if (d.gr + 3 <= 3) g.set(d.x, d.gr + 3, d.z, "white_concrete");
}

// roof plant: a copper housing on the main roof, clear of the parapet
for (const c of F.values()) {
  if (!c.tower && !c.facade && c.x >= 22 && c.x <= 27 && c.z >= 6 && c.z <= 8) g.set(c.x, 9, c.z, "copper_block");
}

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465182.nbt"));
