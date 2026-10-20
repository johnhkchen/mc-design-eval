import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001381";

const W = 23, H = 32, D = 18;
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint and massing -------------------------------------------------
const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gg = Math.max(0, Math.round(gr));
  // lidar roof -> clean even tiers, at least one ground floor plus one upper storey
  let top = Math.round(rf / 2) * 2;
  top = Math.min(H - 1, Math.max(gg + 7, top));
  cellMap.set(key(x, z), { x, z, g: gg, top });
}
const has = (x, z) => cellMap.has(key(x, z));

// Neighbour-based exposure of each footprint cell
function faces(x, z) {
  return {
    n: !has(x, z - 1), // outward toward -z
    s: !has(x, z + 1), // outward toward +z
    w: !has(x - 1, z), // outward toward -x
    e: !has(x + 1, z), // outward toward +x
  };
}

// Storey floors: slab at ground level g, then every 3 blocks from g+4
const isFloor = (y, gg) => y === gg || (y >= gg + 4 && (y - gg - 4) % 3 === 0);

const BRICK = "bricks";
const TRIM = "stone_bricks";
const FOUND = "stone_bricks";
const SLAB = "smooth_stone";
const GLASS = "glass_pane";

const paneProps = (alongX) =>
  alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- per-cell build --------------------------------------------------------
for (const c of cellMap.values()) {
  const { x, z, g: gg, top } = c;
  const f = faces(x, z);
  const ext = f.n || f.s || f.w || f.e;
  const corner = (f.n || f.s) && (f.w || f.e);
  const alongX = (f.n || f.s) && !corner; // wall face runs east-west
  const alongZ = (f.w || f.e) && !corner; // wall face runs north-south
  const idx = alongX ? x : z;
  const isPillar = !ext || corner || idx % 3 === 0;

  // foundation and ground-floor slab
  for (let y = 0; y < gg; y++) g.set(x, y, z, FOUND);
  g.set(x, gg, z, SLAB);

  for (let y = gg + 1; y <= top; y++) {
    if (!ext) {
      // interior: air gap, floor slabs and roof slab only
      if (y === top - 1 || isFloor(y, gg)) g.set(x, y, z, SLAB);
      continue;
    }

    // exterior shell
    if (y === top) {
      // low stone coping instead of battlements
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === top - 1) {
      g.set(x, y, z, TRIM); // cornice band
      continue;
    }
    if (y <= gg + 3) {
      // shopfront: glass between pillars, stone sign band on top
      if (y === gg + 3 || isPillar) g.set(x, y, z, TRIM);
      else g.set(x, y, z, GLASS, paneProps(alongX));
      continue;
    }
    // upper storeys: sills, window rows and brick piers
    const rel = (y - (gg + 4)) % 3;
    const windowCol = !isPillar;
    if (rel === 0) {
      if (windowCol) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, BRICK);
    } else {
      if (!windowCol) g.set(x, y, z, BRICK);
      else {
        const lit = rel === 1 && ((idx * 5 + gg * 3 + y) % 11 === 0);
        if (lit) g.set(x, y, z, "glowstone");
        else g.set(x, y, z, GLASS, paneProps(alongX));
      }
    }
  }

  // roof-top plant: a few brick chimneys standing on the interior roof slab
  if (!ext && top + 2 <= H - 1 && (x * 3 + z * 5) % 9 === 4) {
    g.set(x, top, z, BRICK);
    g.set(x, top + 1, z, BRICK);
    g.set(x, top + 2, z, "brick_slab", { type: "top", waterlogged: "false" });
  }
}

// ---- entrance: one door on the north (-z) face near the middle ------------
const doorCands = [...cellMap.values()]
  .filter((c) => {
    const f = faces(c.x, c.z);
    return f.n && !(f.w || f.e);
  })
  .sort((a, b) => a.x - b.x);

if (doorCands.length) {
  const d = doorCands[Math.floor(doorCands.length / 2)];
  const base = { facing: "north", hinge: "left", open: "false", powered: "false" };
  // solid lintel course above the door so the hanging lantern has support
  g.set(d.x, d.g + 4, d.z, BRICK);
  g.set(d.x, d.g + 1, d.z, "dark_oak_door", { ...base, half: "lower" });
  g.set(d.x, d.g + 2, d.z, "dark_oak_door", { ...base, half: "upper" });
  // warm hanging lantern over the entrance, in the sign band
  g.set(d.x, d.g + 3, d.z, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
