import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw588114039";

const W = 68, H = 81, D = 53;
const ROOF = 69;      // roof slab top surface sits at y 69 (lidar roof ~69 above lowest ground)
const PARAPET = 70;   // parapet course on the roof edge
const CROWN_IN = 8;   // crown inset from the perimeter, in blocks

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(60, Math.round(gr))));
}
const key = (x, z) => `${x},${z}`;
const inside = (x, z) => ground.has(key(x, z));

// Distance from the outside edge (perimeter = 1), so facades, parapet and crown inset can be read off.
const dist = new Map();
const queue = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (NB.some(([dx, dz]) => !inside(x + dx, z + dz))) {
    dist.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz, nk = key(nx, nz);
    if (inside(nx, nz) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const distOf = (x, z) => dist.get(key(x, z)) ?? 1;
const isPerim = (x, z) => distOf(x, z) === 1;

// Entrance: north face (outside at z-1), centred on the front.
const DOOR_XS = [33, 34];
const LINTEL_XS = [32, 33, 34, 35];
const isFrontEntrance = (x, z) => isPerim(x, z) && !inside(x, z - 1) && x >= 32 && x <= 35;

const vox = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props === undefined) vox.set(x, y, z, block);
  else vox.set(x, y, z, block, props);
};

const lights = [];

for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gl = ground.get(key(x, z));
  const d = distOf(x, z);
  const perim = d === 1;
  const corner = perim && NB.filter(([dx, dz]) => !inside(x + dx, z + dz)).length >= 2;
  const mullion = corner || (x + z) % 4 === 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gl; y++) put(x, y, z, "stone_bricks");

  // Storeys, 5 blocks each, counted from this cell's ground up to the roof slab.
  for (let y = gl; y < ROOF; y++) {
    const s = y - gl;
    const r = s % 5;
    const k = Math.floor(s / 5);

    if (r === 0) {
      if (perim) put(x, y, z, k === 0 ? "polished_granite" : "white_concrete");
      else put(x, y, z, "smooth_quartz");           // floor slab per storey
    } else if (r <= 3) {
      if (!perim) continue;                          // air gap behind the glass
      if (k === 0 && isFrontEntrance(x, z)) {
        if (DOOR_XS.includes(x)) {
          if (r === 1) { put(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
          if (r === 2) { put(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        }
        if (r === 3 && LINTEL_XS.includes(x)) { put(x, y, z, "polished_granite"); continue; }
      }
      if (mullion) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "light_blue_stained_glass");
        if (r === 2 && k > 0 && ((x * 5 + z * 3 + k * 7) % 13 === 0)) {
          for (const [dx, dz] of NB) {
            const nx = x + dx, nz = z + dz;
            if (inside(nx, nz) && distOf(nx, nz) >= 2) {
              lights.push([nx, y, nz]);
              break;
            }
          }
        }
      }
    } else {
      // r === 4: top spandrel of the storey (the next storey's floor slab sits above it)
      if (perim) put(x, y, z, "white_concrete");
    }
  }

  // Roof slab over every footprint cell.
  put(x, ROOF, z, "light_gray_concrete");

  // Parapet along the roof edge.
  if (perim) put(x, PARAPET, z, "white_concrete");

  // Roof plant: small boxes on the roof slab, away from the edge.
  if (d === 3 && x % 12 === 6 && z % 8 === 4) {
    put(x, PARAPET, z, "light_gray_concrete");
    put(x, PARAPET + 1, z, "light_gray_concrete");
  }

  // Crown: a hollow glazed cap set back from the edge, standing on the roof slab.
  if (d >= CROWN_IN) {
    put(x, PARAPET, z, "smooth_quartz");           // crown floor on roof slab
    if (d === CROWN_IN) {
      for (let y = 71; y <= 73; y++) {
        if (y === 73) put(x, y, z, "white_concrete");
        else if ((x + z) % 4 === 0) put(x, y, z, "smooth_quartz");
        else put(x, y, z, "light_blue_stained_glass");
      }
    }
    put(x, 74, z, "light_gray_concrete");           // crown cap
  }
}

// Warm lights in the air gap behind some glazed bays (placed last so no column overwrites them).
for (const [x, y, z] of lights) put(x, y, z, "shroomlight");

// Lit lantern in the crown centre.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
if (distOf(cx, cz) >= CROWN_IN) {
  put(cx, 71, cz, "sea_lantern");
  for (let y = 75; y <= 79; y++) put(cx, y, cz, "iron_bars");
  put(cx, 80, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

vox.save(`${dir}/${id}.nbt`);
