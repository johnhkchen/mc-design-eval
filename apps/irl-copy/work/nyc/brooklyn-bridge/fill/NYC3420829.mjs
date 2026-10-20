import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Open Space pavilion, 146 Furman Street: stone plinth, spruce frame, glazed
// perimeter, flat stone-capped roof with a door canopy and warm lantern ceiling.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3420829.cells.json", "utf8"));

const W = 7, H = 15, D = 7;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const has = (x, z) => info.has(key(x, z));

// Lidar roof heights, smoothed to one flat tier
const raw = cells.map(c => Math.round(c[3]));
const sorted = [...raw].sort((a, b) => a - b);
const base = sorted[Math.floor(sorted.length / 2)];

const info = new Map();
for (const c of cells) {
  const x = Math.round(c[0]), z = Math.round(c[1]);
  const ground = Math.max(0, Math.min(H - 6, Math.round(c[2])));
  let roof = Math.round(c[3]);
  roof = Math.min(Math.max(roof, base - 1), base + 1);
  // Minimum storey so the door, beam and roof all fit
  roof = Math.max(ground + 4, Math.min(H - 1, roof));
  info.set(key(x, z), { x, z, ground, roof });
}

function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

const FRAME = "stripped_spruce_log";
const BEAM = "spruce_planks";
const CAP = "smooth_stone_slab";
const PLINTH = "stone_bricks";
const FLOOR = "smooth_stone";
const GLASS = "glass";

// Door: a perimeter cell on the north face if one exists, else any outward cell
let doorCell = null;
for (const cand of [[3, 0], [2, 0], [4, 0], [0, 3], [6, 3], [3, 6]]) {
  const c = info.get(key(cand[0], cand[1]));
  if (c && outward(c.x, c.z)) { doorCell = c; break; }
}
const doorKey = doorCell ? key(doorCell.x, doorCell.z) : null;

for (const c of info.values()) {
  const { x, z, ground, roof } = c;
  const perimX = !has(x - 1, z) || !has(x + 1, z);
  const perimZ = !has(x, z - 1) || !has(x, z + 1);
  const perimeter = perimX || perimZ;
  const corner = perimX && perimZ;

  // Plinth from y 0 to ground, then the pavilion floor
  for (let y = 0; y < ground; y++) g.set(x, y, z, PLINTH);
  g.set(x, ground, z, FLOOR);

  // Flat roof cap on every cell
  g.set(x, roof - 1, z, CAP, { type: "bottom", waterlogged: "false" });

  if (perimeter) {
    // Stone base course on the plinth edge
    g.set(x, ground, z, PLINTH);
    // Beam ring under the cap
    g.set(x, roof - 2, z, BEAM);
    // Glazed wall between floor and beam
    for (let y = ground + 1; y <= roof - 3; y++) {
      if (corner) g.set(x, y, z, FRAME, { axis: "y" });
      else if (((perimX ? z : x) % 2) === 0) g.set(x, y, z, FRAME, { axis: "y" });
      else g.set(x, y, z, GLASS);
    }
  } else {
    // Interior: four central posts, otherwise open air
    const posts = [[2, 2], [4, 2], [2, 4], [4, 4]];
    if (posts.some(([px, pz]) => px === x && pz === z)) {
      for (let y = ground + 1; y <= roof - 2; y++) g.set(x, y, z, FRAME, { axis: "y" });
    }
    // Lantern hung from the beam ring at the centre
    if (x === 3 && z === 3 && roof - 3 > ground) {
      g.set(x, roof - 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// Entrance: door pair on the outward face, with a canopy slab over it
if (doorCell) {
  const f = outward(doorCell.x, doorCell.z);
  const { x, z, ground, roof } = doorCell;
  // Clear the glazing for the door opening
  g.set(x, ground + 1, z, "spruce_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, ground + 2, z, "spruce_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy: a slab projecting one block out from the beam
  const dx = f === "west" ? -1 : f === "east" ? 1 : 0;
  const dz = f === "north" ? -1 : f === "south" ? 1 : 0;
  const cx = x + dx, cz = z + dz;
  g.set(cx, roof - 2, cz, CAP, { type: "bottom", waterlogged: "false" });
  g.set(x, roof - 2, z, BEAM);
  g.set(x, ground + 3 <= roof - 2 ? ground + 3 : ground + 2, z, PLINTH); // filler keeps the door reveal solid
  if (roof - 3 > ground + 2) g.set(x, roof - 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm glowstone behind glass on a few glazed bays
let lit = 0;
for (const c of info.values()) {
  if (lit >= 4) break;
  const { x, z, ground, roof } = c;
  const onEdge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (!onEdge || roof - 3 < ground + 2) continue;
  if (doorKey === key(x, z)) continue;
  if ((x + z) % 4 === 1 && !((x === 0 || x === 6) && (z === 0 || z === 6))) {
    g.set(x, ground + 2, z, "glowstone");
    lit++;
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3420829.nbt");
