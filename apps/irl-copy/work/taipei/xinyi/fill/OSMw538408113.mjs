import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408113";
const W = 17, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8")); // [x, z, ground]
const g = new Voxels([W, H, D]);

// ---- footprint helpers -------------------------------------------------
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = {
  north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0],
};
const outward = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([name, d]) => ({ name, d }));
const isExt = (x, z) => outward(x, z).length > 0;

const minZ = Math.min(...cells.map(c => c[1]));
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;

// front = north face at minZ; door in middle of that run
const frontXs = cells
  .filter(([x, z]) => z === minZ && isExt(x, z))
  .map(c => c[0])
  .sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

// ---- safe setter ---------------------------------------------------------
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const paneProps = (name) => {
  const ns = name === "north" || name === "south";
  return {
    north: ns ? "false" : "true",
    south: ns ? "false" : "true",
    east: ns ? "true" : "false",
    west: ns ? "true" : "false",
    waterlogged: "false",
  };
};

const inBox = (x, z) => Math.abs(x - cx) <= 2.5 && Math.abs(z - cz) <= 3.5;

// ---- build ---------------------------------------------------------------
for (const [x, z, gr] of cells) {
  // foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const out = outward(x, z);
  const ext = out.length > 0;

  if (!ext) {
    // interior: floor slab per storey, roof deck, air otherwise
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "gray_concrete");
    if (inBox(x, z)) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = out.length >= 2;
  const face = out[0];
  const horizontal = face.name === "north" || face.name === "south";
  const coord = horizontal ? x : z;
  const pil = corner || coord % 3 === 0;
  const front = z === minZ && out.some(o => o.name === "north");
  const isDoor = front && x === doorX;

  // plinth course
  put(x, gr, z, "polished_andesite");

  // storey 1 (shopfront)
  for (const yy of [gr + 1, gr + 2, gr + 3]) {
    if (isDoor && yy === gr + 1) {
      put(x, yy, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    } else if (isDoor && yy === gr + 2) {
      put(x, yy, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (isDoor && yy === gr + 3) {
      put(x, yy, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else if (pil) {
      put(x, yy, z, "smooth_quartz");
    } else {
      put(x, yy, z, "glass_pane", paneProps(face.name));
    }
  }
  // storey 1 header / spandrel
  put(x, gr + 4, z, front ? "dark_oak_slab" : "smooth_quartz",
    front ? { type: "bottom", waterlogged: "false" } : undefined);
  // storey line
  put(x, gr + 5, z, "light_gray_concrete");

  // storey 2 windows
  for (const yy of [gr + 6, gr + 7, gr + 8]) {
    if (pil) put(x, yy, z, "smooth_quartz");
    else put(x, yy, z, "glass_pane", paneProps(face.name));
  }
  put(x, gr + 9, z, "smooth_quartz");

  // cornice and parapet
  put(x, gr + 10, z, "stone_bricks");
  put(x, gr + 11, z, "smooth_quartz");

  // warm lights behind some windows (interior air gap)
  if (!pil && !front) {
    const ix = x - face.d[0];
    const iz = z - face.d[1];
    if (has(ix, iz) && !isExt(ix, iz) && ((x * 5 + z * 3) % 4 === 0)) {
      const igr = ground.get(`${ix},${iz}`);
      put(ix, igr + 2, iz, "glowstone");
      put(ix, igr + 7, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
