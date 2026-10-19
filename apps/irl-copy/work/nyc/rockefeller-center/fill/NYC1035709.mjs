// NYC1035709: 10 East 53rd Street, a 1971 commercial and office tower midblock in Midtown. Forty-seven storeys of
// bronze-grey glass curtain wall on aluminium mullions, precast spandrel bands every three blocks, over a granite base
// and a ground storey of shopfronts. The tower core (lidar 139-141) rises from the middle of the lot with a shoulder
// setback at storey 41 and a smaller crown above it; the north block (lidar 131-137) is 45 storeys; the north and
// south street walls (lidar 42) are 14 storeys with the lobby in the south face (z 44) under a black marquee; the rest
// is a one-block granite and stone plaza. Every column starts at y 0 and stands on the one below, no interiors: an
// air cell behind each pane, a floor slab per storey, and a few warm lights behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035709.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const X = 28, Z = 45, Y = 153;
const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, g, r] of cells) raw.set(key(x, z), { g, r });

// Massing classes from the lidar roof, then a 3x3 weighted mode so the tiers come out as clean blocks, not noise.
const classOf = (r) => (r <= 1 ? "plinth" : r < 30 ? "low" : r <= 60 ? "wing" : r <= 137 ? "mid" : "tower");
const cls = new Map();
for (const [k, { r }] of raw) cls.set(k, classOf(r));
const smooth = new Map();
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number), votes = {};
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const nk = key(x + dx, z + dz); if (!cls.has(nk)) continue;
    const c = cls.get(nk); votes[c] = (votes[c] ?? 0) + (dx || dz ? 1 : 1.5);
  }
  const own = cls.get(k);
  smooth.set(k, Object.entries(votes).sort((a, b) => b[1] - a[1] || (a[0] === own ? -1 : 1))[0][0]);
}

// Column tops (exclusive): the tier heights, with the tower's shoulder stepping in to 124 outside a 9 x 6 inner core.
const TOP = { plinth: 1, low: 17, wing: 43, mid: 136, tower: 142 };
const H = new Map();
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number), c = smooth.get(k);
  let h = TOP[c];
  if (c === "tower" && !(x >= 13 && x <= 21 && z >= 29 && z <= 34)) h = 124;
  H.set(k, h);
}
const height = (x, z) => H.get(key(x, z)) ?? 0;
const occ = (x, z, y) => y >= 0 && y < height(x, z);

const g = new Voxels([X, Y, Z]);
const lights = [];
const FACES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number), h = height(x, z), top = h - 1;
  for (let y = 0; y < h; y++) {
    const faces = FACES.filter(([dx, dz]) => !occ(x + dx, z + dz, y));
    const env = faces.length > 0;

    // Base course and plaza paving on the ground.
    if (y === 0) { g.set(x, y, z, h === 1 ? "smooth_stone" : "polished_granite"); continue; }
    // Roof: a cornice ring on the edge, tar-grey deck inside.
    if (y === top) { g.set(x, y, z, env ? "light_gray_concrete" : "gray_concrete"); continue; }
    // Inside: a slab per storey (floors at y = 1 mod 3), air between.
    if (!env) { if (y % 3 === 1) g.set(x, y, z, "light_gray_concrete"); continue; }

    const ground = y <= 3;
    // Lobby: a black marquee over the south entrance, two doors with lanterns above them.
    if (z === Z - 1 && y === 4 && x >= 8 && x <= 13) { g.set(x, y, z, "black_concrete"); continue; }
    if (z === Z - 1 && (x === 10 || x === 11) && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "south", half: y === 1 ? "lower" : "upper", hinge: x === 10 ? "left" : "right", open: "false", powered: "false",
      });
      continue;
    }
    if (z === Z - 1 && (x === 10 || x === 11) && y === 3) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }

    // Spandrel bands (floor rows) and glass rows; the ground storey is a granite bulkhead over shop glass.
    if (y % 3 === 1) { g.set(x, y, z, ground ? "polished_granite" : "light_gray_concrete"); continue; }
    const corner = faces.length > 1;
    const along = faces[0][0] !== 0 ? z : x;                 // position along the face the cell sits on
    if (corner || along % 3 === 0) { g.set(x, y, z, "iron_block"); continue; }   // aluminium mullions every third cell
    g.set(x, y, z, ground ? "cyan_stained_glass" : "gray_stained_glass");
    if (!ground && (x * 31 + y * 17 + z * 7) % 11 === 0) {   // a few lit offices: a warm light in the air cell behind the pane
      const [dx, dz] = faces[0];
      lights.push([x - dx, y, z - dz]);
    }
  }
}

for (const [x, y, z] of lights) g.set(x, y, z, (x + y + z) % 5 === 0 ? "shroomlight" : "glowstone");

// Mechanical bulkhead and a lightning rod on the tower roof, standing on the deck at y 142.
for (let y = 142; y <= 144; y++) for (let z = 30; z <= 33; z++) for (let x = 15; x <= 19; x++) g.set(x, y, z, "light_gray_concrete");
g.set(17, 145, 31, "lightning_rod");

const info = g.save(`${DIR}/NYC1035709.nbt`);
const tops = [...new Set([...H.values()])].sort((a, b) => a - b);
console.log(`NYC1035709: ${info.blocks} blocks, ${info.palette} palette entries; column tops ${tops.join(", ")}; ${lights.length} lit cells`);
