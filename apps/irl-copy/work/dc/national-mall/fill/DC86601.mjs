import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/../src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC86601.cells.json`, "utf8"));

const W = 6, H = 30, D = 14;
const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => g.set(x, y, z, id, props);

const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(`${x},${z}`, { gr, roof });
const inside = (x, z) => map.has(`${x},${z}`);

function faces(x, z) {
  const f = [];
  if (!inside(x, z - 1)) f.push("north");
  if (!inside(x, z + 1)) f.push("south");
  if (!inside(x - 1, z)) f.push("west");
  if (!inside(x + 1, z)) f.push("east");
  return f;
}
const isCorner = (f) => f.length >= 2;

// Clean roof: one level from the median lidar height (tiers, not noise).
const roofs = cells.map(([, , , r]) => r).sort((a, b) => a - b);
const roofLevel = Math.min(roofs[Math.floor(roofs.length / 2)], H - 4);

// Street front = z-minimum edge. Entrance bay nearest x=2.5, not a corner.
const minZ = Math.min(...cells.map(([, z]) => z));
let door = null;
for (const [x, z] of cells) {
  if (z !== minZ) continue;
  if (isCorner(faces(x, z))) continue;
  if (!door || Math.abs(x - 2.5) < Math.abs(door.x - 2.5)) door = { x, z };
}

// Rooftop penthouse on an interior roof cell nearest the centre of the footprint.
let penthouse = null;
for (const [x, z] of cells) {
  if (faces(x, z).length) continue;
  const d = Math.abs(x - 2.5) + Math.abs(z - 6.5);
  if (!penthouse || d < penthouse.d) penthouse = { x, z, d };
}

const STOREY = 4;

for (const [x, z, gr] of cells) {
  const ground = gr;
  const top = Math.max(roofLevel, ground + 8);
  const f = faces(x, z);
  const perim = f.length > 0;
  const corner = isCorner(f);

  // Foundation
  for (let y = 0; y < ground; y++) set(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs per storey, air between, roof deck on top
    for (let fl = ground; fl <= top - 2; fl += STOREY) set(x, fl, z, "smooth_stone");
    set(x, top - 1, z, "smooth_stone");
    continue;
  }

  // Exterior wall body
  for (let y = ground; y <= top - 1; y++) set(x, y, z, "bricks");

  // Storey belts
  for (let fl = ground; fl <= top - 2; fl += STOREY) set(x, fl, z, "stone_bricks");

  // Cornice and parapet
  set(x, top - 2, z, "stone_bricks");
  set(x, top - 1, z, "stone_bricks");

  const isDoor = door && x === door.x && z === door.z;
  const face = f[0];
  const idx = face === "north" || face === "south" ? x : z;

  if (isDoor) {
    // Stone surround: jambs flank the door, solid lintel above
    for (const dx of [-1, 1]) {
      if (inside(x + dx, z)) {
        set(x + dx, ground + 1, z, "stone_bricks");
        set(x + dx, ground + 2, z, "stone_bricks");
      }
      if (inside(x + dx, z) && !isCorner(faces(x + dx, z))) {
        // jamb cells also get the lintel row
      }
    }
    set(x, ground + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, ground + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    set(x, ground + 3, z, "stone_bricks");
    set(x, ground + 3, z, "stone_brick_slab", { type: "top" });
  } else if (!corner && idx % 2 === 1) {
    // Windows: tinted glass with stone frames; warm light in some interior rooms
    const inward =
      face === "north" ? [x, z + 1] :
      face === "south" ? [x, z - 1] :
      face === "west" ? [x + 1, z] : [x - 1, z];
    for (let k = 0; ; k++) {
      const fl = ground + k * STOREY;
      if (fl + 2 > top - 3) break;
      set(x, fl + 1, z, "light_blue_stained_glass_pane");
      set(x, fl + 2, z, "light_blue_stained_glass_pane");
      if (inside(...inward) && k % 2 === 0) {
        set(inward[0], fl + 1, inward[1], "shroomlight");
      }
    }
  }
}

// Rooftop penthouse: a stone box with glazed sides, sitting on the roof deck.
if (penthouse) {
  const { x, z } = penthouse;
  const base = roofLevel - 1; // roof deck level
  for (let y = base + 1; y <= base + 3; y++) {
    set(x, y, z, "stone_bricks");
  }
  set(x, base + 2, z, "light_blue_stained_glass_pane");
  set(x, base + 4, z, "stone_brick_slab", { type: "bottom" });
}

g.save(`${dir}/DC86601.nbt`);
