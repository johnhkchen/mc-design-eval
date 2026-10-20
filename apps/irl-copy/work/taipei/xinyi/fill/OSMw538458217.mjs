import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458217";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 17 x 23 x 16 volume. Roof top sits at y = 11 (exclusive), so blocks run y 0..10.
const W = 17, H = 23, D = 16;
const ROOF = 11;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

// Outward directions
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter(k => !has(x + DIRS[k][0], z + DIRS[k][1]));
const alongOf = (x, z, face) => (face === "north" || face === "south") ? x - minX : z - minZ;
const spanOf = face => (face === "north" || face === "south") ? maxX - minX : maxZ - minZ;

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Glass pane props: connect along the wall the pane sits in
const paneProps = face => (face === "north" || face === "south")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const lights = [];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the building base (cell's ground, clamped below the roof)
  const base = Math.min(gr, H - 3);
  for (let y = 0; y < base; y++) put(x, y, z, "stone");

  const exp = exposed(x, z);
  const edge = exp.length > 0;
  const corner = exp.length >= 2;
  const face = exp[0];
  const a = face ? alongOf(x, z, face) : 0;
  const L = face ? spanOf(face) : 0;
  const mid = Math.floor(L / 2);
  const pil = corner || a % 3 === 0;           // vertical pilasters every 3 blocks
  const front = !corner && face === "south" && a === mid;

  for (let y = base; y < H; y++) {
    const rel = y - base;

    if (!edge) {
      // Interior: air, except floor slabs, roof deck, and a rooftop plant box
      if (y === base) put(x, y, z, "light_gray_concrete");
      else if (y === base + 5 && y < H - 2) put(x, y, z, "light_gray_concrete");
      else if (y === H - 2) put(x, y, z, "light_gray_concrete");
      else if (y === H - 1 && x >= 5 && x <= 9 && z >= 5 && z <= 9) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Facade / shell
    if (y >= H - 1) {
      put(x, y, z, "white_concrete");                       // parapet
    } else if (y === H - 2) {
      put(x, y, z, "smooth_stone");                         // cornice
    } else if (rel === 0) {
      put(x, y, z, "stone_bricks");                         // base course
    } else if (rel <= 3) {
      // Ground floor shopfronts
      if (pil) put(x, y, z, "white_concrete");
      else if (front && rel === 1) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (front && rel === 2) put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "glass");
    } else if (rel === 4) {
      put(x, y, z, "smooth_stone");                         // fascia
    } else if (rel === 5) {
      put(x, y, z, "white_concrete");                       // storey line / sill band
    } else if (rel <= 8) {
      // Upper storey windows
      if (pil || corner) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", paneProps(face));
        if (rel === 7 && a % 6 === 4) {
          const ix = x - DIRS[face][0], iz = z - DIRS[face][1];
          lights.push([ix, y, iz]);                          // warm light behind the glass
        }
      }
    } else {
      put(x, y, z, "white_concrete");                       // wall above storeys up to cornice
    }
  }
}

// Warm lights placed after the shell so they sit in the air gap behind the glass
for (const [ix, y, iz] of lights) {
  if (has(ix, iz)) put(ix, y, iz, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
