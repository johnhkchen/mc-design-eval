import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 108 South Street, South Street Seaport, 1819. Federal-era brick commercial/residential
// block: stone base and cornice, brick walls on one shared storey grid, a shopfront at
// street level with a central door, upper storeys with window bays, flat slate roof behind
// a parapet, and a small roof bulkhead.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1001329.cells.json`, "utf8"));

const W = 5, H = 24, D = 18;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(key(x, z), { g: Math.round(gr), r: Math.round(rf) });
}
const has = (x, z) => map.has(key(x, z));

// Building-wide storey grid: smooth the lidar into one roof line and one set of floor lines.
const grounds = [...map.values()].map(c => c.g).sort((a, b) => a - b);
const roofs = [...map.values()].map(c => c.r).sort((a, b) => a - b);
const G = grounds[0];                                  // grid datum = lowest ground
const maxBase = grounds[grounds.length - 1];
const medRoof = roofs[Math.floor(roofs.length / 2)];

let nf = Math.max(3, Math.min(6, Math.round((medRoof - G) / 3)));
nf = Math.max(nf, Math.ceil((maxBase + 6 - G) / 3));  // every cell gets at least two storeys above its ground
while (G + 3 * nf + 2 > H - 1 && nf > 3) nf--;
const TOP = G + 3 * nf;                               // common roof line

// Outward normal of a footprint cell (0 on an axis where the cell is interior)
function outward(x, z) {
  const ox = !has(x - 1, z) ? -1 : !has(x + 1, z) ? 1 : 0;
  const oz = !has(x, z - 1) ? -1 : !has(x, z + 1) ? 1 : 0;
  return { ox, oz };
}

const facingOf = (ox, oz) => {
  if (ox === -1) return "west";
  if (ox === 1) return "east";
  if (oz === -1) return "north";
  return "south";
};

for (const [k, { g: base }] of map) {
  const [x, z] = k.split(",").map(Number);
  const { ox, oz } = outward(x, z);
  const isEdge = ox !== 0 || oz !== 0;
  const corner = ox !== 0 && oz !== 0;

  // Foundation from y 0 up to this cell's own ground
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  // Walls, floors, shopfront and windows on the shared storey grid
  for (let y = base; y < TOP; y++) {
    const kStorey = Math.floor((y - G) / 3);
    const within = (y - G) % 3;

    if (!isEdge) {
      if (y === base) g.set(x, y, z, "stone_bricks");
      else if (within === 0 && kStorey >= 1) g.set(x, y, z, "oak_planks");
      continue;
    }

    if (corner || y === base) {
      g.set(x, y, z, y === base ? "stone_bricks" : "bricks");
      continue;
    }

    const idx = ox !== 0 ? z : x;
    const inX = x - ox, inZ = z - oz;          // interior neighbour, inward
    const inwardOK = has(inX, inZ);

    if (kStorey === 0) {
      // Shopfront: stone sill course, glass bays, spruce piers, central door
      const doorIdx = ox !== 0 ? 8 : 2;
      if (idx === doorIdx && within === 1) {
        g.set(x, y, z, "spruce_door", {
          facing: facingOf(ox, oz), half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (idx === doorIdx && within === 2) {
        g.set(x, y, z, "spruce_door", {
          facing: facingOf(ox, oz), half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (within === 0) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      } else if (idx % 3 !== 0) {
        g.set(x, y, z, "glass");
        if (within === 1 && inwardOK && idx % 6 === 1) {
          g.set(inX, y, inZ, "shroomlight");
        }
      } else {
        g.set(x, y, z, "spruce_log");
      }
    } else {
      // Upper storeys: spandrel course, paired windows with brick piers
      if (within === 0) {
        g.set(x, y, z, "bricks");
      } else if (idx % 3 !== 0) {
        g.set(x, y, z, "glass_pane");
        if (within === 1 && inwardOK && kStorey % 2 === 1 && idx % 6 === 1) {
          g.set(inX, y, inZ, "shroomlight");
        }
      } else {
        g.set(x, y, z, "bricks");
      }
    }
  }

  // Roof deck: stone cornice on the perimeter, slate inside
  g.set(x, TOP, z, isEdge ? "stone_bricks" : "deepslate_tiles");

  // Parapet and coping on the perimeter
  if (isEdge && TOP + 1 < H) g.set(x, TOP + 1, z, "bricks");
  if (isEdge && TOP + 2 < H) g.set(x, TOP + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof bulkhead: a small stair-housing block set back from the street front
for (let x = 1; x <= 3; x++) {
  for (let z = 6; z <= 9; z++) {
    if (!has(x, z)) continue;
    const { ox, oz } = outward(x, z);
    if (ox !== 0 || oz !== 0) continue;
    g.set(x, TOP + 1, z, "stone_bricks");
    if (x === 2 && z === 7) g.set(x, TOP + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${dir}/NYC1001329.nbt`);
