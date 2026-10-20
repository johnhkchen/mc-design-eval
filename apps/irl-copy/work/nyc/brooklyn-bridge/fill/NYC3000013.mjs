import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000013";
const W = 11, H = 27, D = 41;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- helpers -------------------------------------------------------------
const cellMap = new Map();
for (const c of cells) cellMap.set(`${c[0]},${c[1]}`, c);

const has = (x, z) => cellMap.has(`${x},${z}`);
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

function put(x, y, z, id, props) {
  if (!inB(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function perimeterOf(x, z) {
  return !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
}

// Storey pitch 3 blocks, smoothed to clean tiers
function infoOf(x, z) {
  const c = cellMap.get(`${x},${z}`);
  const gr = Math.max(0, Math.round(c[2]));
  const r = Math.round(c[3]);
  let n = Math.max(1, Math.round((r - gr) / 3));
  n = Math.min(n, Math.max(1, Math.floor((22 - gr) / 3)));
  return { g: gr, n, top: gr + 3 * n };
}

// ---- main massing --------------------------------------------------------
const interior = [];

for (const c of cells) {
  const x = c[0], z = c[1];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  const { g: gr, n, top } = infoOf(x, z);

  const fW = !has(x - 1, z), fE = !has(x + 1, z);
  const fN = !has(x, z - 1), fS = !has(x, z + 1);
  const perim = fW || fE || fN || fS;
  const corner = (fW || fE) && (fN || fS);

  // foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // storey floor lines / roof deck / base course
  for (let k = 0; k <= n; k++) {
    const yf = gr + 3 * k;
    if (!perim) {
      put(x, yf, z, k === n ? "stone" : "smooth_stone");
    } else if (k === 0) {
      put(x, yf, z, "polished_granite");           // base course
    } else {
      put(x, yf, z, "stone_bricks");               // storey line / cornice
    }
  }

  if (!perim) {
    interior.push({ x, z, top });
    continue;
  }

  // walls for each storey
  const face = fW ? "west" : fE ? "east" : fN ? "north" : "south";
  const along = (fW || fE) ? z : x;

  for (let k = 0; k < n; k++) {
    const yf = gr + 3 * k;
    for (const row of [yf + 1, yf + 2]) {
      if (corner) {
        // quoin: alternate stone and brick so corners read as stone-banded
        put(x, row, z, (row - yf) === 1 ? "stone_bricks" : "bricks");
        continue;
      }
      if (k === 0 && face === "north") {
        // Street-front shopfront: glass bays between brick/stone piers
        const isDoor = along === Math.floor(W / 2);
        if (isDoor) {
          const half = row === yf + 1 ? "lower" : "upper";
          put(x, row, z, "dark_oak_door", {
            facing: "north", half, hinge: "left", open: "false", powered: "false",
          });
        } else if (along % 4 === 0) {
          put(x, row, z, "polished_granite");      // shop piers
        } else {
          put(x, row, z, "glass");
        }
      } else {
        // upper storeys: 2-wide glass windows between 2-wide brick piers
        if (along % 4 === 1 || along % 4 === 2) {
          put(x, row, z, "glass");
        } else {
          put(x, row, z, "bricks");
        }
      }
    }

    // warm light behind some glazing (lantern standing on floor slab, inside)
    const isGlass = !corner && (
      (k === 0 && face === "north" && along % 4 !== 0 && along !== Math.floor(W / 2)) ||
      (!(k === 0 && face === "north") && (along % 4 === 1 || along % 4 === 2))
    );
    if (isGlass) {
      const lit = (k === 0) ? (along % 4 === 2) : ((along + k) % 3 === 0);
      if (lit) {
        let ix = x, iz = z;
        if (face === "north") iz = z + 1;
        else if (face === "south") iz = z - 1;
        else if (face === "west") ix = x + 1;
        else if (face === "east") ix = x - 1;
        if (has(ix, iz) && !perimeterOf(ix, iz)) {
          put(ix, yf + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    }
  }

  // parapet / cornice cap on the roofline
  put(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- roof equipment: one brick chimney on an interior roof cell ---------
if (interior.length > 0) {
  const ch = interior[Math.floor(interior.length / 2)];
  for (let y = ch.top + 1; y <= ch.top + 3; y++) put(ch.x, y, ch.z, "bricks");
  put(ch.x, ch.top + 4, ch.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
