import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738293";
const W = 31, H = 47, D = 18;
const ROOF = 35;            // roof about 35 blocks above lowest ground (7 storeys x 5)
const PARAPET_TOP = 37;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// outward directions: name -> [dx, dz]
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outwardFaces = (x, z) =>
  Object.entries(DIRS).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([n]) => n);

const perimeter = new Map(); // "x,z" -> first outward face name
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const faces = outwardFaces(x, z);
  if (faces.length) perimeter.set(`${x},${z}`, faces);
}
const isPerim = (x, z) => perimeter.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// 1. Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Interior: floor slabs at each storey line and at the ground, air elsewhere
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  for (let y = gr; y <= ROOF; y++) {
    if (y === gr || y % 5 === 0) put(x, y, z, "light_gray_concrete");
  }
}

// 3. Perimeter facade: envelope, storey lines, piers, glass, shopfront, cornice, parapet
for (const [key, faces] of perimeter) {
  const [x, z] = key.split(",").map(Number);
  const gr = gnd(x, z);
  const face = faces[0];
  const idx = face === "north" || face === "south" ? x : z;
  for (let y = gr; y <= ROOF; y++) {
    let id;
    if (y === ROOF) id = "stone_brick_slab";
    else if (y === gr) id = "polished_granite";
    else if (y % 5 === 0) id = "smooth_quartz";
    else if (y - gr <= 3) id = idx % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";
    else if (y % 5 === 4) id = "white_concrete";
    else id = idx % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";
    if (y === ROOF) put(x, y, z, id, { type: "bottom", waterlogged: "false" });
    else put(x, y, z, id);
  }
  // parapet on the roof edge
  for (let y = ROOF + 1; y <= PARAPET_TOP; y++) put(x, y, z, "white_concrete");
}

// 4. Entrance on the north face, nearest the middle of that face
{
  const north = [...perimeter.entries()]
    .map(([k, f]) => k.split(",").map(Number).concat([f[0]]))
    .filter(([, , f]) => perimeter.get(`${0},0`) !== undefined && f === "north");
  if (north.length) {
    const meanX = north.reduce((s, [x]) => s + x, 0) / north.length;
    north.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
    const [dx, dz] = north[0];
    const gr = gnd(dx, dz);
    const doorProps = (half) => ({
      facing: "north", half, hinge: "left", open: "false", powered: "false",
    });
    put(dx, gr, dz, "dark_oak_door", doorProps("lower"));
    put(dx, gr + 1, dz, "dark_oak_door", doorProps("upper"));
    // stone surround above the door
    put(dx, gr + 2, dz, "stone_bricks");
    put(dx, gr + 3, dz, "stone_bricks");
  }
}

// 5. Warm light behind some windows (glowstone in the interior air gap)
for (const [key, faces] of perimeter) {
  const [x, z] = key.split(",").map(Number);
  const gr = gnd(x, z);
  const face = faces[0];
  const idx = face === "north" || face === "south" ? x : z;
  const [odx, odz] = DIRS[face];
  const ix = x - odx, iz = z - odz;
  for (let y = gr + 1; y < ROOF; y++) {
    if (y % 5 === 2 && idx % 6 === 2 && idx % 3 !== 0) {
      if (has(ix, iz) && !isPerim(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }
}

// 6. Roof penthouse on the interior, roughly centred
{
  const interior = [...ground.keys()].map((k) => k.split(",").map(Number))
    .filter(([x, z]) => !isPerim(x, z));
  const cx = Math.round(interior.reduce((s, [x]) => s + x, 0) / interior.length);
  const cz = Math.round(interior.reduce((s, [, z]) => s + z, 0) / interior.length);
  const x0 = cx - 4, x1 = cx + 4, z0 = cz - 3, z1 = cz + 3;
  const ok = (x, z) => has(x, z) && !isPerim(x, z);
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!ok(x, z)) continue;
      const edge = x === x0 || x === x1 || z === z0 || z === z1;
      for (let y = ROOF + 1; y <= 39; y++) {
        if (y === 40) break;
        if (edge) {
          const win = (y === 37 || y === 38) && (x + z) % 2 === 0;
          put(x, y, z, win ? "light_blue_stained_glass" : "white_concrete");
        }
      }
      put(x, 40, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // lightning rod on the penthouse
  for (let y = 41; y <= 44; y++) {
    put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
