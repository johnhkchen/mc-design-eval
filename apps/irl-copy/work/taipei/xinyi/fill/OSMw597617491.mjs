import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 國家大第: six-storey 1980s Taipei mid-rise. Pale ceramic-tile concrete frame,
// shopfronts at street level, blue-glass windows with white sills and heads,
// stone cornice, plain parapet, one water tank and antenna on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw597617491";
const W = 54, H = 43, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, h] of cells) ground.set(`${x},${z}`, h);

const L = Math.min(...cells.map((c) => c[2]));   // lowest ground, y 0 of the record
const ROOF = L + 30;                              // roof plate row (cornice on edges)
const PARAPET = L + 31;                           // parapet course, roof top about L+31
const STOREYS = 6;
const DOOR_POS = 28;                              // single entrance per long facade

const inFP = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !inFP(x - 1, z) || !inFP(x + 1, z) || !inFP(x, z - 1) || !inFP(x, z + 1);
const alongX = (x, z) => !inFP(x - 1, z) || !inFP(x + 1, z); // on an end facade

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const inwardOf = (x, z) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (inFP(x + dx, z + dz)) return [x + dx, z + dz];
  }
  return null;
};

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: air gap behind the glass, with a floor slab per storey only.
    put(x, gr, z, "smooth_stone");
    for (let s = 1; s <= STOREYS; s++) {
      const yy = L + s * 5;
      if (yy >= gr && yy <= ROOF) put(x, yy, z, s === STOREYS ? "stone_bricks" : "smooth_stone");
    }
    continue;
  }

  // Facade ring.
  const ax = alongX(x, z);
  const pos = ax ? z : x;
  const inward = inwardOf(x, z);

  for (let y = gr; y <= PARAPET; y++) {
    const yy = y - L;

    if (y === PARAPET) { put(x, y, z, "white_concrete"); continue; }
    if (y === ROOF) { put(x, y, z, "stone_bricks"); continue; }      // cornice / roof plate

    const s = Math.floor(yy / 5);
    const o = yy % 5;
    const pier = pos % 3 === 0;

    if (o === 0 || o === 4) {                                         // storey lines
      put(x, y, z, s === 0 && o === 0 ? "stone_bricks" : "light_gray_concrete");
      continue;
    }

    if (s === 0) {                                                    // shopfront
      const door = !ax && pos === DOOR_POS;
      if (door && (o === 1 || o === 2)) {
        const facing = z === 0 ? "south" : "north";
        put(x, y, z, "dark_oak_door", {
          facing, half: o === 1 ? "lower" : "upper", hinge: "left",
          open: "false", powered: "false",
        });
        continue;
      }
      if (o === 3) { put(x, y, z, "stone_bricks"); continue; }      // lintel
      if (pier) { put(x, y, z, "stone_bricks"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      if (inward && (pos + s) % 6 === 2) {
        const [ix, iz] = inward;
        put(ix, y, iz, "glowstone");
      }
      continue;
    }

    // Upper storeys: piers and window grid with frames.
    if (pier) { put(x, y, z, "light_gray_concrete"); continue; }
    if (o === 2) {
      put(x, y, z, "light_blue_stained_glass_pane");
      if (inward && (pos + s * 3) % 7 === 0) {
        const [ix, iz] = inward;
        put(ix, y, iz, "glowstone");
      }
    } else {
      put(x, y, z, "white_concrete");                                  // sill / head frame
    }
  }
}

// Roof plant: water tank box with cap, and a lightning rod on top.
const TANK = { x0: 23, x1: 29, z0: 7, z1: 11 };
for (let x = TANK.x0; x <= TANK.x1; x++) {
  for (let z = TANK.z0; z <= TANK.z1; z++) {
    if (!inFP(x, z) || isEdge(x, z)) continue;
    for (let y = ROOF + 1; y <= ROOF + 2; y++) {
      const ring = x === TANK.x0 || x === TANK.x1 || z === TANK.z0 || z === TANK.z1;
      if (ring) put(x, y, z, "white_concrete");
    }
    put(x, ROOF + 3, z, "gray_concrete");                              // tank cap
  }
}
put(26, ROOF + 4, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
put(26, ROOF + 5, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
