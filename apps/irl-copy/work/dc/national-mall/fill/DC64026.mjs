// 799 9th St NW (Commercial-Office-Large), a 1960s-70s precast-concrete office: a 15-block podium with a
// shopfront ground floor on the 9th St (west) face, a 18-block tower set in from the podium edge, and a single-storey
// retail wing on the east side. Storeys are 3 blocks: a storey line (band) at the floor, then two window rows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64026.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64026.nbt";

const W = 27, Z = 17, Y = 30;
const roof = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, r]));
const inF = (x, z) => roof.has(`${x},${z}`);

// Massing tiers from the lidar roof: a single-storey wing (roof 4), a 15-block podium, and an 18-block tower set
// in from the podium edge (the lidar's 17-18 zone, squared off into one clean block).
const TOWER = { x0: 5, x1: 18, z0: 3, z1: 10 };
const H = (x, z) => {
  const r = roof.get(`${x},${z}`);
  if (r <= 6) return 4;
  if (x >= TOWER.x0 && x <= TOWER.x1 && z >= TOWER.z0 && z <= TOWER.z1) return 18;
  return 15;
};
const hOf = (x, z) => (inF(x, z) ? H(x, z) : -1);
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// A face is exposed when the neighbour behind it is outside the footprint or stands lower than this level.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => hOf(x + dx, z + dz) <= y);
const isPerim = (x, z, y) => exposed(x, z, y).length > 0;

// Materials
const BASE = "polished_granite", BODY = "white_concrete", BAND = "smooth_quartz", PIER = "light_gray_concrete";
const CAP = "light_gray_concrete", FLOOR = "smooth_stone", PARAPET = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane", SHOP = "glass_pane";

const v = new Voxels([W, Y, Z]);
const DOOR = [1, 7];                 // the 9th St entrance: west face, mid-block
const LIT = (x, y, z) => ((x * 7 + z * 13 + Math.floor(y / 3) * 5) % 23 === 0);   // sparse warm panes, not speckle

const paneState = (dir) => (dir[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false" }    // a wall running north-south (east or west face)
  : { north: "false", south: "false", east: "true", west: "true" });  // a wall running east-west

for (const [key, r] of roof) {
  const [x, z] = key.split(",").map(Number);
  const h = H(x, z);
  for (let y = 0; y < h; y++) {
    const ex = exposed(x, z, y);
    const perim = ex.length > 0;
    const dir = ex.find(([dx]) => dx !== 0) ?? ex[0];   // the face shown (a corner takes its x-facing face)
    const idx = dir && dir[0] !== 0 ? z : x;           // position along that face, for the bay rhythm

    if (y === h - 1) { v.set(x, y, z, CAP); continue; }              // roof slab on every cell
    if (!perim) { if (y % 3 === 0) v.set(x, y, z, FLOOR); continue; }  // interior: slab per storey, air between

    if (y === 0) {
      const door = x === DOOR[0] && z === DOOR[1] && dir && dir[0] === -1;
      if (door) v.set(x, y, z, "polished_granite_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
      else v.set(x, y, z, BASE);
      continue;
    }
    if (y % 3 === 0) {                                  // storey line: a band (or the entrance canopy)
      const canopy = dir && dir[0] === -1 && x === 1 && z >= DOOR[1] - 1 && z <= DOOR[1] + 1;
      v.set(x, y, z, canopy ? "dark_oak_slab" : BAND, canopy ? { type: "bottom", waterlogged: "false" } : undefined);
      continue;
    }
    const k = Math.floor(y / 3);
    if (k === 0 && dir && dir[0] === -1) {               // ground-floor shopfront on 9th St
      if (x === DOOR[0] && z === DOOR[1]) {
        const half = y === 1 ? "lower" : "upper";
        v.set(x, y, z, "dark_oak_door", { facing: "west", half, hinge: "left", open: "false", powered: "false" });
      } else if (idx % 3 === 0) v.set(x, y, z, BASE);
      else v.set(x, y, z, SHOP, paneState(dir));
      continue;
    }
    // upper storeys, and the other faces: piers on the bay line, glass between, a few lit panes
    if (!dir) { v.set(x, y, z, BODY); continue; }
    if (idx % 3 === 0) v.set(x, y, z, PIER);
    else if (k >= 1 && LIT(x, y, z)) v.set(x, y, z, "glowstone");
    else v.set(x, y, z, GLASS, paneState(dir));
  }
  // parapet on the top edge of the perimeter
  if (exposed(x, z, h - 1).length > 0) v.set(x, h, z, PARAPET);
}

// Entrance: a lantern under the canopy, inside the vestibule (a block above it, the floor slab at y 3)
v.set(2, 2, DOOR[1], "lantern", { hanging: "true", waterlogged: "false" });

// Rooftop plant: a 2x2 air-handler on the podium roof and a smaller one on the tower roof
for (const [x0, z0, y0] of [[20, 9, 15], [9, 6, 18]]) {
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) for (let y = y0; y < y0 + 2; y++) v.set(x0 + dx, y, z0 + dz, PIER);
}

const r = v.save(OUT);
console.log(`wrote ${OUT}: ${r.blocks} blocks, ${r.palette} palette entries`);
