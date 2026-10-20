import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738280";

const W = 18, H = 33, D = 24;
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint map: "x,z" -> ground height
const G = new Map();
let L = Infinity, M = -Infinity;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(`${x},${z}`, gr);
  L = Math.min(L, gr);
  M = Math.max(M, gr);
}
if (!G.size) { L = 0; M = 0; }

// Roof deck sits about 21 blocks above the lowest ground; never below the highest ground + margin.
const R = Math.max(L + 21, M + 3);

const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const inF = (x, z) => G.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz)).length;
const nearEdge = (x, z) => DIRS.some(([dx, dz]) => inF(x + dx, z + dz) && exposed(x + dx, z + dz) > 0);

// Body: per cell, foundation up to ground, storeys of 5 blocks, cornice, deck, parapet.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const e = exposed(x, z);
  const perim = e > 0;

  // Foundation fill from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Storeys
  for (let y = gr; y <= R - 3; y++) {
    const off = y - gr;
    const k = Math.floor(off / 5);
    const o = off % 5;

    if (!perim) {
      // Interior: floor slabs only, with a glowstone just behind some windows (air gap kept)
      if (o === 0) put(x, y, z, "light_gray_concrete");
      else if (o === 2 && nearEdge(x, z) && ((x * 7 + z * 3 + k) % 5 === 0)) put(x, y, z, "glowstone");
      continue;
    }

    if (o === 0) {
      // Storey line / base course
      put(x, y, z, k === 0 ? "stone_bricks" : "light_gray_concrete");
      continue;
    }
    if (o === 4) {
      // Spandrel
      put(x, y, z, "white_concrete");
      continue;
    }

    // o = 1..3: glazed band
    if (k === 0 && z === 0 && (x === 8 || x === 9) && o <= 2) {
      // Main entrance, north-facing, two-high door
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: o === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (e >= 2 || (x + z) % 3 === 0) {
      // Mullion / corner frame
      put(x, y, z, "white_concrete");
      continue;
    }
    if (o === 2 && k > 0 && ((x * 5 + z + k) % 7 === 0)) {
      // Warm lit window
      put(x, y, z, "shroomlight");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Cornice course under the roof
  if (perim && R - 2 >= gr) put(x, R - 2, z, "stone_bricks");

  // Roof deck over the whole footprint
  if (R - 1 >= gr) put(x, R - 1, z, "light_gray_concrete");

  // Parapet on the perimeter
  if (perim) put(x, R, z, "white_concrete");
}

// Roof plant room: a 6 x 8 penthouse centred on the roof, only if it sits fully on the footprint.
const PX0 = 6, PX1 = 11, PZ0 = 8, PZ1 = 15;
let penthouseOk = R + 3 < H;
for (let x = PX0; x <= PX1 && penthouseOk; x++)
  for (let z = PZ0; z <= PZ1; z++)
    if (!inF(x, z) || !G.has(`${x},${R - 1}`.length ? `${x},${z}` : "")) penthouseOk = false;

if (penthouseOk) {
  for (let x = PX0; x <= PX1; x++) {
    for (let z = PZ0; z <= PZ1; z++) {
      const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
      // Walls: solid, with a louvred glass band at mid height
      for (let y = R; y <= R + 2; y++) {
        if (!edge) continue;
        if (y === R + 1 && (x + z) % 2 === 0) put(x, y, z, "light_blue_stained_glass");
        else put(x, y, z, "white_concrete");
      }
      // Roof of the plant room
      put(x, R + 3, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
