import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403767";
const W = 27, H = 23, D = 20;

const key = (x, z) => `${x},${z}`;
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint lookup and lowest ground (y 0 reference).
const ground = new Map();
let base = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  base = Math.min(base, gr);
}
const has = (x, z) => ground.has(key(x, z));

// Roof sits 11 blocks above the lowest ground: levels lv 0..10 relative to base.
const TOP = base + 10;

// Facade of an edge cell: which side is exposed and the coordinate running along it.
function facade(x, z) {
  if (!has(x, z - 1)) return { face: "n", k: x };
  if (!has(x, z + 1)) return { face: "s", k: x };
  if (!has(x - 1, z)) return { face: "w", k: z };
  if (!has(x + 1, z)) return { face: "e", k: z };
  return null;
}

// Entrance: on the north face (or any face if none), at the middle of the run,
// on cells sitting at base ground so the door has solid floor under it.
let door = null;
{
  const edge = [];
  for (const [x, z, gr] of cells) {
    const f = facade(x, z);
    if (f && f.face === "n" && gr === base) edge.push({ x, z, k: f.k });
  }
  if (edge.length) {
    const ks = edge.map((c) => c.k);
    const mid = (Math.min(...ks) + Math.max(...ks)) / 2;
    edge.sort((a, b) => Math.abs(a.k - mid) - Math.abs(b.k - mid));
    door = edge[0];
  }
}

const g = new Voxels([W, H, D]);

for (const [x, z, gr] of cells) {
  const f = facade(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  for (let y = gr; y <= TOP; y++) {
    const lv = y - base;
    const isDoor = door && door.x === x && door.z === z;

    // Entrance door and hanging lantern above it.
    if (isDoor && (lv === 1 || lv === 2)) {
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half: lv === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoor && lv === 3) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    // Floor / ceiling slabs (also the base course on the edge and the roof deck).
    if (lv === 0 || y === gr) {
      g.set(x, y, z, f ? "polished_granite" : "smooth_stone");
      continue;
    }
    if (lv === 5 || lv === 9) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Roof parapet cornice on the edge; roof equipment on the interior deck.
    if (lv === 10) {
      if (f) {
        g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      } else if ((x * 5 + z * 3) % 7 === 0 && x % 3 === 1) {
        g.set(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    // Interior: air gap behind the glass.
    if (!f) continue;

    const k = f.k;
    const pillar = k % 3 === 0;
    const warm = (x * 31 + z * 17 + y * 7) % 5 === 0;

    if (lv === 4) {
      // Lintel over the shopfront.
      g.set(x, y, z, "white_concrete");
    } else if (lv >= 1 && lv <= 3) {
      // Shopfront: tinted glass bays between white concrete piers.
      if (pillar) g.set(x, y, z, "white_concrete");
      else if (warm && lv === 2) g.set(x, y, z, "glowstone");
      else g.set(x, y, z, "light_blue_stained_glass");
    } else if (lv >= 6 && lv <= 8) {
      // Upper storeys: window grid with piers and occasional warm lights.
      if (pillar) g.set(x, y, z, "white_concrete");
      else if (warm && lv === 7) g.set(x, y, z, "glowstone");
      else g.set(x, y, z, "cyan_stained_glass");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
