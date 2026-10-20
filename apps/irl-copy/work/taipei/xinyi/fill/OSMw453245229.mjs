import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s Taipei commercial-residential block: 7 storeys of 5 blocks
// on a stone plinth, white tiled bays with tinted-glass windows, a
// light-grey floor band per storey, a red-tile parapet cap and a
// central penthouse with a terracotta crown.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245229";
const W = 34, H = 47, D = 16;
const TOP = 35;          // roof slab level (7 storeys x 5)
const PARAPET_TOP = 37;  // parapet wall top
const PH_TOP = 40;       // penthouse crown

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();     // "x,z" -> ground (foundation top)
for (const c of raw) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(`${x},${z}`, Math.max(0, Math.min(TOP - 5, Math.round(gr))));
}
const cells = [...G.entries()].map(([k, g0]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, g0 };
});

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const K = (x, z) => `${x},${z}`;
const has = (x, z) => G.has(K(x, z));
const missL = (x, z) => !has(x - 1, z);
const missR = (x, z) => !has(x + 1, z);
const missF = (x, z) => !has(x, z - 1);   // front (z = low side)
const missB = (x, z) => !has(x, z + 1);
const zFace = (x, z) => missF(x, z) || missB(x, z);
const xFace = (x, z) => missL(x, z) || missR(x, z);
const perim = (x, z) => zFace(x, z) || xFace(x, z);
// 'z' = wall running along x (front/back), 'x' = end wall, null = pier/corner/interior
const kind = (x, z) => {
  const zf = zFace(x, z), xf = xFace(x, z);
  if (zf && !xf) return "z";
  if (xf && !zf) return "x";
  return null;
};
const winAt = (x, z, y) => {
  const k = kind(x, z);
  if (!k) return false;
  const r = y % 5;
  if (r < 1 || r > 3) return false;
  return k === "z" ? [1, 2].includes(x % 4) : [1, 2].includes(z % 4);
};
const inward = (x, z) => {
  const k = kind(x, z);
  if (k === "z") return missF(x, z) ? [x, z + 1] : [x, z - 1];
  if (k === "x") return missL(x, z) ? [x + 1, z] : [x - 1, z];
  return null;
};

// Front cells (low z side) for the entrance
const frontCells = cells.filter(c => missF(c.x, c.z) && c.g0 <= 2);
let doorX = 16;
if (frontCells.length) {
  doorX = frontCells.reduce((best, c) => (Math.abs(c.x - 16) < Math.abs(best - 16) ? c.x : best), frontCells[0].x);
}

// 1. Foundation, slabs and facade
for (const { x, z, g0 } of cells) {
  const isP = perim(x, z);
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  for (let y = g0; y <= TOP; y++) {
    const isLevel = y === g0 || (y % 5 === 0);
    if (isLevel) {
      if (isP) put(x, y, z, y === g0 ? "stone_bricks" : "light_gray_concrete");
      else put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!isP) continue; // air behind facade
    if (winAt(x, z, y)) {
      const k = kind(x, z);
      const lit = ((x + z + Math.floor(y / 5)) % 3 === 0) && y % 5 === 2;
      // pane connections to neighbouring windows in the same row
      let props;
      if (k === "z") {
        props = {
          east: winAt(x + 1, z, y) ? "true" : "false",
          west: winAt(x - 1, z, y) ? "true" : "false",
          north: "false", south: "false",
        };
      } else {
        props = {
          north: winAt(x, z - 1, y) ? "true" : "false",
          south: winAt(x, z + 1, y) ? "true" : "false",
          east: "false", west: "false",
        };
      }
      put(x, y, z, "gray_stained_glass_pane", props);
      if (lit) {
        const inw = inward(x, z);
        if (inw) {
          const [ix, iz] = inw;
          const ig = G.get(K(ix, iz));
          if (ig !== undefined && !perim(ix, iz) && ig <= y - 1) {
            put(ix, y, iz, "shroomlight");
          }
        }
      }
    } else if (y % 5 === 4) {
      put(x, y, z, "white_concrete");           // spandrel
    } else {
      put(x, y, z, "white_concrete");           // pier
    }
  }
}

// 2. Ground-floor shopfront on the front face
for (const { x, z, g0 } of cells) {
  if (!(missF(x, z) && g0 <= 2)) continue;
  for (let y = g0 + 1; y <= 4; y++) {
    if (x % 4 === 0) {
      put(x, y, z, "stone_bricks");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }
  if (x === doorX) {
    put(x, g0 + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, g0 + 2, z, "dark_oak_door", { half: "upper", hinge: "left", powered: "false" });
    if (g0 <= 1) put(x, 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 3. Central penthouse on the roof slab
const PX0 = 9, PX1 = 24, PZ0 = 4, PZ1 = 11;
let phOK = true;
for (let x = PX0; x <= PX1; x++) for (let z = PZ0; z <= PZ1; z++) if (!has(x, z)) phOK = false;
if (phOK) {
  for (let x = PX0; x <= PX1; x++) {
    for (let z = PZ0; z <= PZ1; z++) {
      const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
      for (let y = TOP + 1; y <= 39; y++) {
        if (!edge) continue;
        if (y === 37 || y === 38) put(x, y, z, "gray_stained_glass");
        else put(x, y, z, "white_concrete");
      }
      put(x, PH_TOP, z, "red_terracotta");
    }
  }
}

// 4. Parapet with red tile cap on the perimeter
for (const { x, z } of cells) {
  if (!perim(x, z)) continue;
  put(x, TOP + 1, z, "white_concrete");
  put(x, TOP + 2, z, "white_concrete");
  put(x, PARAPET_TOP, z, "red_terracotta");
}

g.save(`${DIR}/${ID}.nbt`);
