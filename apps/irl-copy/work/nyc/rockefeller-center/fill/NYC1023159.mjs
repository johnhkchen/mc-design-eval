// Sheraton New York Hotel and Towers, 811 7th Avenue (1960, commercial and office, hotel). A 1960 Midtown slab: a
// 41-storey (about 125 blocks, lidar 125-138) glass-and-spandrel tower standing on a 5-storey podium block to the north,
// a 4-storey wing to the south, and an open paved court between them (lidar roof ~0). The tower is a 40 x 16 slab with
// a stepped crown: a core at 134 and a mechanical penthouse at 138 at the centre, the ring at 125. Tower glass is
// blue-grey (light blue stained glass panes) with light-grey mullions every third column and pale spandrels at each
// floor line; the podium and the base course are granite, the shopfronts glass with granite piers. The 7th Avenue
// entrance is on the west (x 0) face of the tower's base, double iron doors under a metal canopy at the storey-two
// line. Every column stands on its own ground (stone foundation from y 0), storeys are counted from that ground, and
// each tier is solid under the next. The shell is one block thick: a pane sits on the face with air behind it and a
// floor slab per storey (no interiors), a solid elevator core in the middle. Warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1023159.cells.json`, "utf8"));
const X = 41, Y = 150, Z = 54;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
const groundOf = (x, z) => cell.get(`${x},${z}`).ground;

// Roof tiers (block height above y 0), read from the lidar as clean flat tiers. Lidar under 10 is open ground (the
// court, the lot edges). Rows 42-50 are the court; row 42 is lidar noise, not wall.
const roofAt = (x, z) => {
  if (!inFoot(x, z) || lidar(x, z) < 10) return 0;
  if (z <= 25) return x >= 24 && x <= 31 && z >= 14 && z <= 17 ? 20 : 17;        // 5-storey podium, a plant box on it
  if (z <= 41) {
    if (z <= 28 && lidar(x, z) <= 20) return 17;                                  // the podium wraps the tower's NE corner
    if (x >= 9 && x <= 28 && z >= 29 && z <= 39) return x >= 14 && x <= 22 && z >= 32 && z <= 36 ? 138 : 134;
    return 125;                                                                    // the 41-storey slab
  }
  if (z >= 51) return 15;                                                          // 4-storey south wing
  return 0;
};
// The roof a neighbour presents: an unbuilt cell is open ground at its own ground level.
const topOf = (x, z) => roofAt(x, z) || groundOf(x, z);
const open = (x, y, z) => !inFoot(x, z) || topOf(x, z) <= y;
const FACES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = FACES[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, h, k) => ((u * 7919 + h * 104729 + k * 1299709) * 2654435761) % 997 < 45;      // ~1 in 22, scattered, deterministic
const inCore = (x, z) => x >= 9 && x <= 28 && z >= 29 && z <= 39;

const g = new Voxels([X, Y, Z]);
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const lights = [];

for (const [x, z] of cols) {
  const gr = groundOf(x, z), r = roofAt(x, z);
  // Foundation from y 0 up to this cell's ground; open ground is paved at that level.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (!r) { g.set(x, gr, z, "smooth_stone"); continue; }
  const mech = r === 138 || r === 20;
  const low = z <= 25;
  for (let y = gr; y < r; y++) {
    const h = y - gr, d = faceOf(x, y, z);
    if (y === r - 1) { g.set(x, y, z, "smooth_quartz"); continue; }             // parapet cap on every tier
    if (!d) {                                                                    // interior: floor slabs, a solid core
      if (inCore(x, z) || (h % 3 === 0 && h > 0)) g.set(x, y, z, "light_gray_concrete");
      else if (h === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const [dx, dz] = FACES[d], u = dx === 0 ? x : z, k = ["N", "S", "W", "E"].indexOf(d);
    const pane = dx === 0 ? NS : EW;
    if (y === r - 2) { g.set(x, y, z, "light_gray_concrete"); continue; }        // cornice band
    if (h === 0) { g.set(x, y, z, "polished_granite"); continue; }              // base course
    if (mech) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (d === "W" && x === 0 && z >= 32 && z <= 35 && h === 3) { g.set(x, y, z, "iron_block"); continue; }   // canopy
    if (d === "W" && x === 0 && (z === 33 || z === 34) && (h === 1 || h === 2)) {                              // doors
      g.set(x, y, z, "iron_door", { facing: "east", half: h === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (h % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }              // floor line, pale spandrel
    if (low) {                                                                   // podium shopfronts
      if (u % 4 === 0) g.set(x, y, z, "polished_granite");
      else g.set(x, y, z, "light_blue_stained_glass_pane", pane);
      continue;
    }
    if (u % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }        // mullion
    g.set(x, y, z, "light_blue_stained_glass_pane", pane);
    if (h % 3 === 1 && lit(u, h, k)) lights.push([x - dx, y, z - dz]);          // a lamp just behind this pane
  }
}

// Warm lamps behind some panes: only in air, so no lamp replaces a wall or the core.
for (const [x, y, z] of lights) if (!g.get(x, y, z)) g.set(x, y, z, "glowstone");

g.save(`${DIR}/NYC1023159.nbt`);
console.log("NYC1023159:", g.count(), "blocks");
