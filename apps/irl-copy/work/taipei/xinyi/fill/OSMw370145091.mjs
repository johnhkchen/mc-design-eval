import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370145091";
const W = 24, H = 23, D = 19;

// Footprint: [x, z, ground] per cell. Record: ~11 blocks lowest-ground to roof,
// so a two-storey 1980s-style commercial block: stone base, glazed storefront,
// upper storey of glass bays between quartz piers, cornice, parapet, roof plant.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const fp = new Map();
for (const [x, z, g] of cells) fp.set(`${x},${z}`, Math.round(g));

const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const dirName = (dx, dz) => DIRS.find(([a, b]) => a === dx && b === dz)?.[2] ?? "south";

// Plan layer: everything is decided first, then written in one pass.
const plan = new Map();
const k3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  plan.set(k3(x, y, z), { id, props });
};
const at = (x, y, z) => plan.get(k3(x, y, z));

// Pass 1: foundations, floors, walls, storefront and upper glazing.
for (const [key, g] of fp) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  const edge = out.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  // Floor slabs per storey, base course, cornice and roof slab.
  put(x, g, z, edge ? "stone_bricks" : "smooth_stone");              // base course / ground floor
  put(x, g + 5, z, edge ? "white_concrete" : "smooth_stone");        // storey line / 2F floor
  put(x, g + 10, z, edge ? "white_concrete" : "gray_concrete");      // cornice / roof slab

  if (edge) {
    put(x, g + 11, z, "smooth_quartz"); // parapet
    for (const base of [g + 1, g + 6]) {
      const isGround = base === g + 1;
      for (let i = 0; i < 3; i++) {
        const y = base + i;
        const pier = (x + z) % 3 === 0;
        if (pier) put(x, y, z, "smooth_quartz");
        else put(x, y, z, "light_blue_stained_glass_pane"); // props computed in pass 3
      }
      // Header (ground, the one dark accent) and lintel (upper) above the glazing.
      put(x, base + 3, z, isGround ? "light_gray_concrete" : "smooth_quartz");
    }
  }
}

// Entrance: a dark oak door on the south-facing (or nearest) edge, near the middle,
// flanked by quartz piers so it reads as a doorway in the storefront.
const edgeCells = [...fp.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => outward(x, z).length > 0);
let doorCands = edgeCells.filter(([x, z]) => outward(x, z).some(([dx, dz]) => dz === 1));
if (!doorCands.length) doorCands = edgeCells;
const meanX = doorCands.reduce((s, [x]) => s + x, 0) / doorCands.length;
doorCands.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
if (doorCands.length) {
  const [dx0, dz0] = doorCands[0];
  const gd = fp.get(`${dx0},${dz0}`);
  const [odx, odz] = outward(dx0, dz0)[0];
  const facing = dirName(odx, odz);
  put(dx0, gd + 1, dz0, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx0, gd + 2, dz0, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Door surround: quartz piers and a lintel course on the storefront either side of the door.
  const along = odz !== 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
  for (const [ax, az] of along) {
    const nx = dx0 + ax, nz = dz0 + az;
    if (!inFp(nx, nz)) continue;
    const gn = fp.get(`${nx},${nz}`);
    for (let y = gn + 1; y <= gn + 2; y++) put(nx, y, nz, "smooth_quartz");
  }
  put(dx0, gd + 3, dz0, "smooth_quartz");
}

// Warm lights: glowstone two cells inside selected glazed bays, standing on the floor slab.
for (const [key, g] of fp) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  if (!out.length) continue;
  const [nx, nz] = out[0];
  const ix = x - 2 * nx, iz = z - 2 * nz;
  if (!inFp(ix, iz)) continue;
  if (outward(ix, iz).length) continue; // must be interior
  const gi = fp.get(`${ix},${iz}`);
  const isPier = (x + z) % 3 === 0;
  if (isPier) continue;
  if ((x + z) % 6 === 1) put(ix, gi + 6, iz, "glowstone");   // upper storey
  else if ((x + z) % 6 === 4) put(ix, gi + 1, iz, "glowstone"); // ground storey
}

// Roof plant: a small mechanical block near the middle of the roof.
const cx = 12, cz = 9;
for (const [key, g] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z).length) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 2) put(x, g + 11, z, "light_gray_concrete");
  if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) put(x, g + 12, z, "light_gray_concrete");
}

// Pass 3: glass pane connections to in-plane neighbours.
for (const [k, entry] of plan) {
  if (entry.id !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const props = { waterlogged: "false" };
  for (const [dx, dz, name] of DIRS) {
    const n = at(x + dx, y, z + dz);
    props[name] = n && n.id !== "air" ? "true" : "false";
  }
  entry.props = props;
}

// Write.
const g = new Voxels([W, H, D]);
for (const [k, { id, props }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}
g.save(`${DIR}/${ID}.nbt`);
