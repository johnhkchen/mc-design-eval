import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 733 15th St NW: early-20th-century brick apartment block, six storeys,
// stone base, stone storey bands and cornice, flat roof with one mechanical penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87269.cells.json`, "utf8"));
const W = 24, H = 31, D = 18;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, gr, roof] of cells) {
  cellMap.set(`${x},${z}`, { gy: Math.max(0, Math.min(H - 12, Math.round(gr))), roof: Math.round(roof) });
}
const has = (x, z) => cellMap.has(`${x},${z}`);

function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

const storeyTop = (gy, roof) => {
  const n = Math.max(2, Math.min(8, Math.round((roof - gy) / 3)));
  return Math.min(H - 4, gy + 3 * n);
};

// Entrance: middle of the north street face at ground level
const northXs = [];
for (const [k] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (faces(x, z).includes("north")) northXs.push(x);
}
northXs.sort((a, b) => a - b);
let doorX = -1, doorZ = -1;
if (northXs.length) { doorX = northXs[Math.floor(northXs.length / 2)]; doorZ = 0; }
else {
  for (const [k] of cellMap) {
    const [x, z] = k.split(",").map(Number);
    if (faces(x, z).length) { doorX = x; doorZ = z; break; }
  }
}

// Mechanical penthouse footprint: inner cells near the plan centre, on the tallest tier
let maxRoof = 0;
for (const [, c] of cellMap) maxRoof = Math.max(maxRoof, storeyTop(c.gy, c.roof));
const penthouse = new Set();
for (const [k, c] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (faces(x, z).length === 0 && x >= 7 && x <= 16 && z >= 5 && z <= 12 && storeyTop(c.gy, c.roof) === maxRoof) {
    penthouse.add(k);
  }
}

for (const [k, { gy, roof }] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const T = storeyTop(gy, roof);
  const f = faces(x, z);
  const ring = f.length > 0;
  const corner = f.length >= 2;
  const face = f[0];
  const along = face === "north" || face === "south" ? x : z;

  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gy; y < T; y++) {
    const r = y - gy;
    const top = y === T - 1;

    if (!ring) {
      g.set(x, y, z, top ? "smooth_stone" : "bricks");
      continue;
    }
    if (top) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (r === 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Entrance: two-block door opening in the north wall, ground storey, centre bay
    if (x === doorX && z === doorZ && face === "north" && (r === 1 || r === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (corner) {
      g.set(x, y, z, r % 3 === 2 ? "stone_bricks" : "bricks");
      continue;
    }
    if (r % 3 === 2) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (along % 3 === 0) {
      g.set(x, y, z, "bricks");
      continue;
    }

    // Sparse warm light: a few lit windows on upper storeys only
    const storey = Math.floor(r / 3);
    const lit = storey >= 2 && (along * 5 + storey * 7 + z) % 13 === 0;
    if (lit) {
      g.set(x, y, z, "glowstone");
    } else if (face === "north" || face === "south") {
      g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    } else {
      g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    }
  }

  // Single clustered mechanical penthouse with a stone parapet
  if (penthouse.has(k) && T + 2 < H) {
    g.set(x, T, z, "stone_bricks");
    g.set(x, T + 1, z, "stone_bricks");
    if (x % 3 === 0 || z % 3 === 0) g.set(x, T + 1, z, "smooth_stone");
  }
}

g.save(`${DIR}/DC87269.nbt`);
