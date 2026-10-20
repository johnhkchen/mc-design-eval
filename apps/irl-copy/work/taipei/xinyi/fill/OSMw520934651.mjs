import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 第三院區: a two-storey, mid-century-style institutional annex in white tiled concrete
// with a quartz cornice, stone plinth, light-blue glazing in white frames, and a
// central glazed entrance on the north face. Roof level is absolute y = 11.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw520934651";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 65, H = 23, D = 36;
const ROOF = 10;   // parapet / roof deck course (top surface at y = 11)
const FLOOR = 5;   // upper floor line
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(ROOF - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const gr = (x, z) => ground.get(key(x, z));

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const NORMALS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const outward = (x, z) => NORMALS.filter(([dx, dz]) => !has(x + dx, z + dz));

const cellList = cells.map(([x, z]) => [x, z]);

// Main massing: foundations, walls, floor bands, roof
for (const [x, z] of cellList) {
  const G = gr(x, z);
  const outs = outward(x, z);
  const perim = outs.length > 0;
  const corner = outs.length > 1;

  // Foundation fill up to the ground, with a smooth top under the floor
  for (let y = 0; y < G - 1; y++) put(x, y, z, "stone_bricks");
  if (G > 0) put(x, G - 1, z, "smooth_stone");

  if (perim) {
    const [nx, nz] = outs[0];
    const idx = nx !== 0 ? z : x;          // position along the facade
    const bay = !corner && idx % 4 !== 0;  // window bay vs pier
    const ix = x - nx, iz = z - nz;        // inward cell
    const inwardOK = has(ix, iz) && gr(ix, iz) < ROOF - 1;

    for (let y = G; y < ROOF; y++) {
      let id = "white_concrete";
      let glass = false;
      if (y === G) id = "stone_bricks";                    // plinth course
      else if (y === FLOOR) id = "smooth_quartz";          // floor band
      else if ((y >= G + 1 && y <= 3) || y === 7 || y === 8) {
        if (bay) { id = "light_blue_stained_glass"; glass = true; }
      }
      put(x, y, z, id);

      // warm light behind some ground-floor glazing
      if (glass && y === G + 2 && idx % 8 === 1 && inwardOK && y > gr(ix, iz) - 1) {
        put(ix, y, iz, "glowstone");
      }
    }
  } else {
    // interior floor slab at the upper floor line
    if (G <= FLOOR) put(x, FLOOR, z, "light_gray_concrete");
  }

  // roof: quartz parapet at the perimeter, grey roof deck inside
  put(x, ROOF, z, perim ? "smooth_quartz" : "light_gray_concrete");
}

// Roof equipment: a few mechanical plinths on the deck
for (const [x, z] of cellList) {
  if (outward(x, z).length > 0) continue;
  if (x % 14 >= 5 && x % 14 <= 7 && z % 11 >= 3 && z % 11 <= 5) {
    put(x, ROOF + 1, z, "iron_block");
  }
}

// Central glazed entrance on the north (minimum z) face
const north = cellList.filter(([x, z]) =>
  outward(x, z).some(([dx, dz]) => dx === 0 && dz === -1));
if (north.length) {
  const xs = north.map(([x]) => x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  const row = north.find(([x]) => x === mid);
  const z0 = row[1];
  const G = gr(mid, z0);
  const hasAt = (x) => has(x, z0);

  for (let dx = -2; dx <= 2; dx++) {
    const x = mid + dx;
    if (!hasAt(x)) continue;
    const Gx = gr(x, z0);
    const base = Math.min(G, Gx);
    if (Math.abs(dx) === 2) {
      // stone pier
      for (let y = Gx; y <= G + 3 && y < ROOF; y++) put(x, y, z0, "white_concrete");
    } else if (dx === 0) {
      // door: lower and upper halves, glass transom above
      put(x, G, z0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, G + 1, z0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, G + 2, z0, "light_blue_stained_glass");
      put(x, G + 3, z0, "white_concrete");
    } else {
      // flanking glazed bays
      put(x, G, z0, "stone_bricks");
      for (let y = G + 1; y <= G + 2; y++) put(x, y, z0, "light_blue_stained_glass");
      put(x, G + 3, z0, "white_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
