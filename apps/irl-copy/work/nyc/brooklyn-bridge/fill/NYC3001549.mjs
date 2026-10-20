import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001549.cells.json`, "utf8"));

const W = 12, H = 25, D = 6;
const g = new Voxels([W, H, D]);

const cellMap = new Map(
  cells.map((c) => [`${c[0]},${c[1]}`, { gy: Math.round(c[2]), roof: Math.round(c[3]) }])
);
const inFp = (x, z) => x >= 0 && x < W && z >= 0 && z < D && cellMap.has(`${x},${z}`);
const isExt = (x, z) => !inFp(x, z - 1) || !inFp(x, z + 1) || !inFp(x - 1, z) || !inFp(x + 1, z);
const faces = (x, z) => {
  const f = [];
  if (!inFp(x, z - 1)) f.push("north");
  if (!inFp(x, z + 1)) f.push("south");
  if (!inFp(x - 1, z)) f.push("west");
  if (!inFp(x + 1, z)) f.push("east");
  return f;
};

// One level roof for the whole building: median of the lidar roof heights.
const roofs = [...cellMap.values()].map((c) => c.roof).sort((a, b) => a - b);
const ROOF = roofs[Math.floor(roofs.length / 2)];

const BODY = "bricks";
const BASE = "stone_bricks";
const TRIM = "smooth_stone";
const PARAPET = "stone_brick_slab";
const GLASS = "glass";
const DOOR_X = 5;
const WIN_Z = new Set([2, 3, 4, 7, 8, 9]); // long faces
const WIN_X = new Set([2, 3, 4]);          // short faces

const windowFace = (f, x, z) =>
  (f === "north" || f === "south") ? WIN_Z.has(x) : WIN_X.has(z);

const innerOf = (f, x, z) => {
  if (f === "north") return [x, z + 1];
  if (f === "south") return [x, z - 1];
  if (f === "west") return [x + 1, z];
  return [x - 1, z];
};

for (const [key, { gy }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const top = Math.min(24, Math.max(ROOF, gy + 12));
  const bases = [gy, gy + 4, gy + 7, gy + 10].filter((b) => b < top - 2);

  for (let y = 0; y < gy; y++) g.set(x, y, z, BASE);

  const ext = isExt(x, z);
  const fs = faces(x, z);
  const corner = fs.length >= 2;
  // Quoins: alternating stone at the corner columns.
  const quoin = (y) => corner && (y % 2 === 0);

  if (ext) {
    for (let y = gy; y <= top - 2; y++) {
      let base = gy;
      for (const b of bases) if (b <= y) base = b;
      const rel = y - base;

      // Double stone cornice under the parapet.
      if (y === top - 2) { g.set(x, y, z, TRIM); continue; }

      // Entrance on the centre of the long north face, with a hood above.
      if (!corner && fs[0] === "north" && x === DOOR_X && (y === gy || y === gy + 1)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gy ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (!corner && fs[0] === "north" && x === DOOR_X && y === gy + 2) {
        g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      if (bases.includes(y)) { g.set(x, y, z, TRIM); continue; }
      if (!corner && fs.length === 1 && windowFace(fs[0], x, z) && (rel === 1 || rel === 2)) {
        g.set(x, y, z, GLASS);
        const storeyIdx = bases.indexOf(base);
        if (rel === 1 && (x + z + storeyIdx) % 3 === 0) {
          const [ix, iz] = innerOf(fs[0], x, z);
          if (inFp(ix, iz) && !isExt(ix, iz)) g.set(ix, y, iz, "glowstone");
        }
        continue;
      }
      if (quoin(y)) { g.set(x, y, z, BASE); continue; }
      g.set(x, y, z, BODY);
    }
  } else {
    for (const b of bases) g.set(x, b, z, TRIM);
  }

  // Roof deck over every footprint cell.
  g.set(x, top - 1, z, TRIM);
  // Parapet on the perimeter.
  if (ext) g.set(x, top, z, PARAPET, { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/NYC3001549.nbt`);
