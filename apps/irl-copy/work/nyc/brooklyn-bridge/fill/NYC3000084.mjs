import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000084";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 26, D = 3;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, ground, roof] of cells) {
  map.set(key(x, z), { ground: Math.round(ground), roof: Math.round(roof) });
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => map.has(key(x, z));
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Base datum: highest ground under the footprint, so every floor plate is level.
const B = Math.max(0, ...[...map.values()].map(c => c.ground));

// Roof: smooth lidar noise into flat tiers around the median roof height.
const roofs = [...map.values()].map(c => c.roof).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
const topOf = (c) => {
  const raw = Math.abs(c.roof - med) <= 2 ? med : c.roof;
  return Math.min(Math.max(raw, B + 4), H - 2);
};

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS_STREET = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_END = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const LANTERN = { hanging: "true", waterlogged: "false" };
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [x, z, c] of [...map].map(([k, v]) => {
  const [xx, zz] = k.split(",").map(Number);
  return [xx, zz, v];
})) {
  const isEdge = edge(x, z);
  const street = z === minZ;
  const back = z === maxZ && !street;
  const endW = !street && !back && (x === minX || x === maxX);
  const top = topOf(c);

  // Foundation: solid from y0 up to the common base datum.
  for (let y = 0; y < B; y++) set(x, y, z, "stone_bricks");

  for (let y = B; y <= top; y++) {
    const rel = y - B;

    if (y === top) {
      // Parapet on exterior cells only.
      if (isEdge) set(x, y, z, "brick_wall");
      continue;
    }

    if (y === top - 1) {
      // Roof deck (interior) / cornice course (exterior).
      set(x, y, z, isEdge ? "chiseled_stone_bricks" : "smooth_stone");
      continue;
    }

    if (rel % 2 === 0) {
      // Floor plate / storey string course.
      if (!isEdge) {
        set(x, y, z, "smooth_stone");
      } else if (rel === 0) {
        set(x, y, z, "polished_granite");
      } else if (street && rel === 2) {
        if (x === 2) set(x, y, z, "oak_door", DOOR_UPPER);
        else set(x, y, z, "dark_oak_planks");
      } else {
        set(x, y, z, "chiseled_stone_bricks");
      }
      continue;
    }

    // Window row (rel odd).
    const k = (rel - 1) / 2;
    if (!isEdge) {
      // Interior air behind the glass; warm lanterns hang from the floor above.
      if (z === 1 && x % 2 === 1 && (x + k) % 3 === 0 && y + 1 < top) {
        set(x, y, z, "lantern", LANTERN);
      }
      continue;
    }

    if (street || back) {
      if (street && k === 0) {
        if (x === 0 || x === 9) set(x, y, z, "dark_oak_log");
        else if (x === 2) set(x, y, z, "oak_door", DOOR_LOWER);
        else set(x, y, z, "glass_pane", GLASS_STREET);
      } else if (x >= 1 && x <= 7 && x % 2 === 1) {
        set(x, y, z, "glass_pane", GLASS_STREET);
      } else {
        set(x, y, z, "bricks");
      }
    } else if (endW) {
      if (z === 1) set(x, y, z, "glass_pane", GLASS_END);
      else set(x, y, z, "bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
