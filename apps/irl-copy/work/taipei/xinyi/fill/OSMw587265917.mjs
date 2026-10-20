import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s-2000s Xinyi commercial/office block: five storeys of 5 blocks on a
// white-concrete frame with light-grey spandrel bands, pale glass bays, a polished
// andesite base, a parapet and rooftop plant room. Roof slab at y=29.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265917";
const W = 41, H = 41, D = 35;
const STOREY = 5;
const ROOF = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const BODY = "white_concrete";
const BAND = "light_gray_concrete";
const PILLAR = "light_gray_concrete";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const LIGHT = "glowstone";

const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Outward normal, along-face direction, and bay index for a perimeter cell.
function face(x, z) {
  if (!has(x - 1, z)) return { out: [-1, 0], along: [0, 1], idx: z };
  if (!has(x + 1, z)) return { out: [1, 0], along: [0, 1], idx: z };
  if (!has(x, z - 1)) return { out: [0, -1], along: [1, 0], idx: x };
  return { out: [0, 1], along: [1, 0], idx: x };
}

function paneProps(along) {
  const alongZ = along[1] !== 0;
  return alongZ
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
}

// 1. Foundations, body, floor slabs, base course, windows, warm lights.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) vox.set(x, y, z, FOUND);

  const perim = isPerim(x, z);
  const f = perim ? face(x, z) : null;

  for (let y = gr; y < ROOF; y++) {
    const s = Math.floor(y / STOREY);
    const r = y % STOREY;

    if (perim && y === gr) { vox.set(x, y, z, BASE); continue; }
    if (r === 0) { vox.set(x, y, z, BAND); continue; } // floor slab / spandrel line
    if (!perim) continue; // interior air gap

    const [ax, az] = f.along;
    const edge = !has(x + ax, z + az) || !has(x - ax, z - az);
    const pillar = edge || f.idx % 3 === 0;

    if (r === 4 || pillar) {
      vox.set(x, y, z, pillar && r !== 4 ? PILLAR : BODY);
      continue;
    }

    // Window band r = 1..3
    vox.set(x, y, z, "glass_pane", paneProps(f.along));

    // Warm light behind some glass
    if (r === 2 && (f.idx + s) % 4 === 0) {
      const ix = x - f.out[0], iz = z - f.out[1];
      if (has(ix, iz) && !isPerim(ix, iz)) vox.set(ix, y, iz, LIGHT);
    }
  }

  // Roof slab, parapet and cap on the perimeter.
  if (gr <= ROOF) vox.set(x, ROOF, z, BAND);
  if (perim) {
    vox.set(x, ROOF + 1, z, BODY);
    vox.set(x, ROOF + 2, z, BAND);
  }
}

// 2. Ground-floor entrance on the south (max z) face: glazed bay, door, canopy.
const maxZ = D - 1;
const cx = Math.floor(W / 2);
for (let x = cx - 3; x <= cx + 3; x++) {
  if (!has(x, maxZ)) continue;
  const gr = ground.get(`${x},${maxZ}`);
  if (x === cx) {
    vox.set(x, gr, maxZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    vox.set(x, gr + 1, maxZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else if (x >= cx - 2 && x <= cx + 2) {
    vox.set(x, gr + 1, maxZ, GLASS);
  }
  if (gr + 2 <= ROOF - 1) vox.set(x, gr + 2, maxZ, GLASS);
  // Canopy projecting over the entrance (two cells deep, within the footprint).
  for (const zz of [maxZ, maxZ - 1]) {
    if (has(x, zz) && gr + 3 <= ROOF - 1) vox.set(x, gr + 3, zz, BAND);
  }
}

// 3. Rooftop plant room with louvred walls and a lightning-rod mast.
const px0 = 13, px1 = 27, pz0 = 12, pz1 = 22;
for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!has(x, z)) continue;
    const edge = x === px0 || x === px1 || z === pz0 || z === pz1;
    if (edge) {
      for (let y = ROOF + 1; y <= ROOF + 3; y++) {
        const louvre = y <= ROOF + 2 && (x + z) % 3 === 0;
        vox.set(x, y, z, louvre ? "iron_bars" : BODY);
      }
    }
    vox.set(x, ROOF + 4, z, BAND);
  }
}
const mx = 20, mz = 17;
if (has(mx, mz)) {
  for (let y = ROOF + 5; y <= ROOF + 7; y++) vox.set(mx, y, mz, "iron_bars");
  vox.set(mx, ROOF + 8, mz, "lightning_rod", { facing: "up" });
}

vox.save(`${DIR}/${ID}.nbt`);
