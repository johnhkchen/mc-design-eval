import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989990";
const W = 22, H = 38, D = 17;

// Record: 1990s-2000s Xinyi-style mid-rise office. Granite base, white concrete frame,
// blue-tinted glass curtain wall, five storeys of ~5 blocks, roof at y 25, parapet 26.
const ROOF = 25;
const FLOORS = [5, 10, 15, 20];
const PEN_X = [5, 15], PEN_Z = [4, 12];

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) => [c[0], c[1], Math.round(c[2])]);
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);
const has = (x, z) => ground.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pane connection state: panes on an x-facing wall connect north/south, z-facing connect east/west.
const pane = (xFacing) => xFacing
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pass 1: foundations, ground deck, walls.
for (const [x, z, G] of cells) {
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
  put(x, G, z, "light_gray_concrete"); // ground-floor deck
  const out = outward(x, z);
  if (out.length === 0) continue;

  const corner = out.length === 2;
  const [dx, dz] = out.length === 1 ? out[0] : [0, 0];
  const along = dx !== 0 ? z : x;
  const isMullion = corner || along % 3 === 0;

  for (let y = G; y <= ROOF - 1; y++) {
    let id, props;
    if (y === G) {
      id = "polished_granite"; // base course
    } else if (y < 5) {
      if (y === 4) id = "smooth_quartz"; // ground lintel
      else if (isMullion) id = "white_concrete";
      else id = "glass"; // shopfront
    } else if (y % 5 === 0) {
      id = "white_concrete"; // floor band
    } else if (y % 5 === 4) {
      id = "smooth_quartz"; // spandrel
    } else if (isMullion) {
      id = "white_concrete";
    } else {
      id = "light_blue_stained_glass_pane";
      props = pane(dx !== 0);
    }
    put(x, y, z, id, props);

    // Warm light behind some glass (inner cell must be open floor space).
    const lit = (x * 7 + y * 3 + z * 5) % 5 === 0;
    if ((id === "light_blue_stained_glass_pane" || id === "glass") && lit && dx + dz !== 0) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && outward(ix, iz).length === 0) put(ix, y, iz, "glowstone");
    }
  }
}

// Pass 2: entrance on the z-minimum (street) face, centred on the frontage.
const front = cells.filter(([x, z]) => {
  const o = outward(x, z);
  return o.length === 1 && o[0][1] === -1;
});
if (front.length) {
  const xs = front.map((c) => c[0]);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  let best = front[0];
  for (const c of front) if (Math.abs(c[0] - mid) < Math.abs(best[0] - mid)) best = c;
  const [ex, , eG] = best;
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(ex, eG + 1, best[1], "oak_door", doorProps("lower"));
  put(ex, eG + 2, best[1], "oak_door", doorProps("upper"));
  put(ex, eG + 3, best[1], "smooth_quartz");
}

// Pass 3: floor slabs on interior cells, roof and parapet.
for (const [x, z, G] of cells) {
  const out = outward(x, z);
  if (out.length === 0) {
    for (const L of FLOORS) if (L > G) put(x, L, z, "light_gray_concrete");
    put(x, ROOF, z, "gray_concrete");
  } else {
    put(x, ROOF, z, "smooth_quartz"); // cornice
    put(x, ROOF + 1, z, "white_concrete"); // parapet
  }
}

// Pass 4: roof penthouse, centred, with a cap and a lightning-rod mast.
const inPen = new Set();
for (const [x, z] of cells) {
  if (x >= PEN_X[0] && x <= PEN_X[1] && z >= PEN_Z[0] && z <= PEN_Z[1]) inPen.add(key(x, z));
}
const penHas = (x, z) => inPen.has(key(x, z));
for (const k of inPen) {
  const [x, z] = k.split(",").map(Number);
  const pOut = DIRS.filter(([dx, dz]) => !penHas(x + dx, z + dz));
  const pCorner = pOut.length === 2;
  const [dx, dz] = pOut.length === 1 ? pOut[0] : [0, 0];
  const along = dx !== 0 ? z : x;
  for (let y = ROOF + 1; y <= 29; y++) {
    if (pOut.length === 0) continue; // air gap inside
    let id = "white_concrete", props;
    if (y !== ROOF + 1 && y !== 29 && !pCorner && along % 3 !== 0) {
      id = "light_blue_stained_glass_pane";
      props = pane(dx !== 0);
    }
    put(x, y, z, id, props);
  }
  put(x, 30, z, "smooth_quartz"); // penthouse cap
}
if (inPen.has(key(10, 8))) {
  for (let y = 31; y <= 33; y++) {
    put(10, y, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
