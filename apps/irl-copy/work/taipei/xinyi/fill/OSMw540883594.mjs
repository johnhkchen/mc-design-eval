import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw540883594: Xinyi-district low-rise, c. 1980s-90s Taipei shophouse-style block.
// Two storeys over a shopfront ground floor, white concrete facade with stone-brick base and
// cornice, glass-and-frame window grids, a central entrance, warm lights behind glass,
// and a flat gray concrete roof with parapet and a small roof plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883594";
const W = 8, H = 23, D = 6;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let B = Infinity;
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, gy);
  B = Math.min(B, gy);
}

const g = new Voxels([W, H, D]);

const inside = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// Place a block only on footprint cells and only above that cell's ground.
const put = (x, y, z, id, props) => {
  if (!inside(x, z)) return;
  if (y < groundAt(x, z) || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PARAPET = { up: "true", north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };

// Absolute storey lines (relative to B, the lowest ground):
// r0 plinth | r1-3 ground-floor shopfront glass | r4 lintel | r5 storey band (floor 2)
// r6 sill | r7-8 upper windows | r9 head | r10 cornice | r11 roof deck | r12 parapet
const ROOF_R = 11;
const PARAPET_R = 12;

// Foundation: solid fill from y 0 up to each cell's ground.
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");
}

// Interior floor slabs and roof deck over every footprint cell.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  for (const r of [5, 10]) {
    put(x, B + r, z, "light_gray_concrete");
  }
  put(x, B + ROOF_R, z, "gray_concrete");
}

// Perimeter facades.
for (const [x, z, gy] of cells) {
  const eN = !inside(x, z - 1);
  const eS = !inside(x, z + 1);
  const eW = !inside(x - 1, z);
  const eE = !inside(x + 1, z);
  const perim = eN || eS || eW || eE;
  if (!perim) continue;

  const onNS = eN || eS;
  const face = onNS ? "NS" : "EW";
  const idx = onNS ? x : z;
  const n = onNS ? W : D;
  const pillar = idx === 0 || idx === n - 1 || idx % 3 === 0;
  const front = eS && z === D - 1 && x === 3; // entrance on the street (south) face
  const paneProps = face === "NS" ? PANE_NS : PANE_EW;

  const lo = Math.max(gy, B);
  for (let y = lo; y <= B + 10; y++) {
    const r = y - B;
    if (r === 0) {
      put(x, y, z, "stone_bricks");
    } else if (r <= 3) {
      if (front && r === 1) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (front && r === 2) put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (front && r === 3) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      else if (pillar) put(x, y, z, "polished_andesite");
      else put(x, y, z, "glass_pane", paneProps);
    } else if (r === 4) {
      put(x, y, z, "white_concrete");
    } else if (r === 5) {
      put(x, y, z, "smooth_stone");
    } else if (r === 6) {
      put(x, y, z, "white_concrete");
    } else if (r === 7 || r === 8) {
      if (pillar) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", paneProps);
    } else if (r === 9) {
      put(x, y, z, "white_concrete");
    } else if (r === 10) {
      put(x, y, z, "stone_bricks");
    }
  }

  // Parapet ring on the roof edge.
  put(x, B + PARAPET_R, z, "stone_brick_wall", PARAPET);
}

// Roof plant box near the middle of the roof.
for (const [x, z] of [[2, 2], [3, 2]]) {
  put(x, B + ROOF_R + 1, z, "light_gray_concrete");
}

// Warm lights behind glass: shopfront and upper windows on the street face.
put(1, B + 2, D - 2, "glowstone");
put(5, B + 2, D - 2, "glowstone");
put(2, B + 7, D - 2, "glowstone");
put(5, B + 8, D - 2, "glowstone");

g.save(`${DIR}/${ID}.nbt`);
