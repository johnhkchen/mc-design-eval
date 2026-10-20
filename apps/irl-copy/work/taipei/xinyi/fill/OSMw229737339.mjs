import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Taipei City Council (Xinyi, Taipei): 1990s civic block. Two storeys of
// white-tiled concrete over a stone plinth, with quartz pilasters and
// lintels framing cyan-tinted window bays, a green glazed parapet band,
// a lit central lobby on the north (street) face, and a louvred plant box
// on the roof. Parapet top sits at y 11 above the lowest ground, per lidar.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw229737339";
const W = 70, H = 23, D = 129;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
let minX = Infinity, maxX = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
}
const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`) ?? 0;
const DIRS = [
  { name: "W", dx: -1, dz: 0 },
  { name: "E", dx: 1, dz: 0 },
  { name: "N", dx: 0, dz: -1 },
  { name: "S", dx: 0, dz: 1 },
];
const openFaces = (x, z) => DIRS.filter((d) => !inside(x + d.dx, z + d.dz));
const isPerim = (x, z) => inside(x, z) && openFaces(x, z).length > 0;

const g = new Voxels([W, H, D]);
const place = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const cx = Math.floor((minX + maxX) / 2); // lobby column on the north face
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// 1) Foundations, slabs, roof deck, and the perimeter shell
for (const [x, z, gr0] of cells) {
  const gr = Math.min(gr0, 10);
  const faces = openFaces(x, z);
  const perim = faces.length > 0;

  for (let y = 0; y < gr; y++) place(x, y, z, "stone_bricks");
  place(x, gr, z, perim ? "polished_andesite" : "smooth_stone");

  // first-floor slab (interior) / storey line (edge)
  if (gr < 5) place(x, 5, z, perim ? "smooth_quartz" : "smooth_stone");
  // roof deck (interior) / cornice (edge)
  if (gr < 10) place(x, 10, z, perim ? "smooth_quartz" : "light_gray_concrete");

  if (!perim) continue;

  const corner = faces.length >= 2;
  const d = faces[0];
  const t = d.dx !== 0 ? z : x; // position along the face
  const inner = { x: x - d.dx, z: z - d.dz };
  const innerOk = inside(inner.x, inner.z) && !isPerim(inner.x, inner.z);

  for (let y = gr + 1; y <= 9; y++) {
    if (y === 5) { place(x, y, z, "smooth_quartz"); continue; }          // storey line
    if (corner) { place(x, y, z, "white_concrete"); continue; }          // corner pier
    if (y === gr + 1 && y <= 4) { place(x, y, z, "stone_bricks"); continue; } // plinth band
    if (t % 12 === 0) { place(x, y, z, "smooth_quartz"); continue; }   // pilaster
    if (t % 4 === 0) { place(x, y, z, "white_concrete"); continue; }    // pier
    if (y === 4 || y === 9) { place(x, y, z, "smooth_quartz"); continue; } // lintel
    place(x, y, z, "cyan_stained_glass_pane", d.dx !== 0 ? PANE_EW : PANE_NS);
    // warm light in the air gap, standing on a floor slab
    if (innerOk && t % 8 === 2 && (y === 6 || (y === gr + 1 && gr + 1 <= 4))) {
      place(inner.x, y, inner.z, (y + t) % 16 === 2 ? "shroomlight" : "glowstone");
    }
  }

  // green glazed parapet on the edge
  place(x, 11, z, "green_glazed_terracotta");
  if (corner) place(x, 12, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// 2) Central lobby on the north (street) face
for (const [x, z, gr0] of cells) {
  const gr = Math.min(gr0, 10);
  const faces = openFaces(x, z);
  if (!faces.some((f) => f.name === "N")) continue;
  if (Math.abs(x - cx) > 3 || gr + 1 > 4) continue;
  const hinge = x === cx - 1 ? "left" : "right";
  if (x === cx - 1 || x === cx) {
    place(x, gr + 1, z, "iron_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    place(x, gr + 2, z, "iron_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  } else {
    place(x, gr + 1, z, "tinted_glass");
    if (gr + 2 <= 4) place(x, gr + 2, z, "tinted_glass");
  }
  if (gr + 3 <= 4) place(x, gr + 3, z, "smooth_quartz"); // lintel over the entrance
  // lobby lanterns standing on the floor just inside the doors
  const lx = Math.abs(x - cx) === 2 ? x : null;
  if (lx !== null && inside(x, z + 1) && !isPerim(x, z + 1)) {
    place(x, gr + 1, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 3) Roof plant box, centred on the roof
for (let x = 22; x <= 47; x++) {
  for (let z = 40; z <= 88; z++) {
    if (!inside(x, z)) continue;
    const edge = x === 22 || x === 47 || z === 40 || z === 88;
    if (edge) {
      place(x, 11, z, "stone_bricks");
      if ((x + z) % 3 === 0) place(x, 12, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      else place(x, 12, z, "stone_bricks");
    } else {
      place(x, 11, z, "gray_concrete");
      place(x, 12, z, "gray_concrete");
    }
    place(x, 13, z, "stone_bricks"); // cap
  }
}

g.save(`${DIR}/${ID}.nbt`);
