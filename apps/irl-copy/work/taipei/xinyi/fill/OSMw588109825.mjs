import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw588109825: no record. Read as a c.1990s Xinyi commercial office block:
// seven storeys of about 5 blocks, white and light-grey concrete piers and spandrels,
// blue-tinted glass, a granite base, a shopfront ground storey with a glass entrance,
// a cornice and parapet, and a setback roof plant core with a lightning rod.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109825";
const W = 26, H = 47, D = 67;

const ROOF = 35;          // roof slab layer, 35 blocks above lowest ground
const CORNICE = 34;       // projecting band just under the roof
const PARAPET_LO = 36;    // parapet course
const PARAPET_HI = 37;    // parapet cap
const CORE = { x0: 7, x1: 18, z0: 20, z1: 46, y0: 36, y1: 40 }; // roof plant core
const ANTENNA = { x: 12, z: 33 };

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- footprint and ground ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => Math.round(c[2])));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, Math.round(gr) - minG);

const has = (x, z) => ground.has(`${x},${z}`);
const keys = [...ground.keys()].map((k) => k.split(",").map(Number));

const faces = (x, z) => {
  const zFace = !has(x, z - 1) || !has(x, z + 1); // exterior to north or south
  const xFace = !has(x - 1, z) || !has(x + 1, z); // exterior to east or west
  return { zFace, xFace, edge: zFace || xFace, corner: zFace && xFace };
};

const inCore = (x, z) => x >= CORE.x0 && x <= CORE.x1 && z >= CORE.z0 && z <= CORE.z1;
const onCoreEdge = (x, z) =>
  inCore(x, z) && (x === CORE.x0 || x === CORE.x1 || z === CORE.z0 || z === CORE.z1);

// Front = minimum-z row. Entrance sits at its median x.
const zmin = Math.min(...keys.map(([, z]) => z));
const frontXs = keys.filter(([, z]) => z === zmin).map(([x]) => x).sort((a, b) => a - b);
const xmid = frontXs[Math.floor(frontXs.length / 2)];

const paneAlongX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneAlongZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const lanternProps = { hanging: "false", waterlogged: "false" };

// ---- main envelope, per footprint cell ----
for (const [x, z] of keys) {
  const gr = ground.get(`${x},${z}`);
  const { zFace, xFace, edge, corner } = faces(x, z);
  const idx = zFace ? x : z; // position along the face that is exposed
  const isEntrance = z === zmin && Math.abs(x - xmid) <= 1;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (!edge) {
      // Interior: only a floor slab per storey, air elsewhere.
      if (y === gr || y % 5 === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Facade cell.
    const k = Math.floor(y / 5);
    const r = y % 5;

    if (y === gr) {
      put(x, y, z, "polished_granite");
    } else if (y === CORNICE) {
      put(x, y, z, "smooth_quartz");
    } else if (r === 0) {
      put(x, y, z, "smooth_quartz"); // storey line
    } else if (k === 0) {
      // Ground storey: shopfront.
      if (r === 4) {
        put(x, y, z, "gray_concrete");
      } else if (corner || idx % 3 === 0) {
        put(x, y, z, "stone_bricks");
      } else if (isEntrance && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "glass"); // entrance doors
      } else if (
        z === zmin && (x === xmid - 2 || x === xmid + 2) && y === gr + 1
      ) {
        put(x, y, z, "lantern", lanternProps); // entrance lanterns
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", zFace ? paneAlongX : paneAlongZ);
      }
    } else {
      // Upper storeys: piers, spandrels, windows.
      if (r === 1 || r === 4) {
        put(x, y, z, "light_gray_concrete");
      } else if (corner || idx % 3 === 0) {
        put(x, y, z, "white_concrete");
      } else if (r === 2 && (x * 7 + z * 3 + k * 5) % 11 === 0) {
        put(x, y, z, "glowstone"); // warm light in a window
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", zFace ? paneAlongX : paneAlongZ);
      }
    }
  }

  // Parapet on the exposed edge.
  if (edge) {
    put(x, PARAPET_LO, z, "white_concrete");
    put(x, PARAPET_HI, z, "smooth_quartz");
  }

  // Roof plant: small rooftop units on a sparse grid, clear of the core and the parapet.
  if (!edge && !inCore(x, z) && x >= 3 && x <= 22 && z >= 3 && z <= 63 &&
      (x * 5 + z * 7) % 37 === 0) {
    put(x, ROOF + 1, z, "gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}

// ---- setback roof plant core ----
for (let z = CORE.z0; z <= CORE.z1; z++) {
  for (let x = CORE.x0; x <= CORE.x1; x++) {
    if (!has(x, z)) continue;
    const boundary = onCoreEdge(x, z);

    if (boundary) {
      const corner = (x === CORE.x0 || x === CORE.x1) && (z === CORE.z0 || z === CORE.z1);
      const alongZ = x === CORE.x0 || x === CORE.x1; // this wall runs along z
      const idx = alongZ ? z : x;
      for (let y = CORE.y0; y <= CORE.y1; y++) {
        if (y === CORE.y0) put(x, y, z, "white_concrete");
        else if (y === CORE.y1) put(x, y, z, "light_gray_concrete");
        else if (corner || idx % 3 === 0) put(x, y, z, "white_concrete");
        else if (y === 38 && idx % 5 === 2) put(x, y, z, "sea_lantern");
        else put(x, y, z, "light_blue_stained_glass_pane", alongZ ? paneAlongZ : paneAlongX);
      }
    } else {
      put(x, CORE.y0, z, "smooth_stone");          // plant room floor
      put(x, CORE.y1, z, "light_gray_concrete");   // cap
    }
  }
}

// Lightning rod on the core cap.
if (has(ANTENNA.x, ANTENNA.z)) {
  put(ANTENNA.x, CORE.y1 + 1, ANTENNA.z, "lightning_rod", {
    facing: "up",
    powered: "false",
    waterlogged: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
