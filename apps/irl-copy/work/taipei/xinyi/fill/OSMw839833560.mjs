import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Decided: a 1980s two-storey Xinyi low-rise, quartz-tile walls,
// stone base, glazed shopfront with a red fascia band, upper-floor window bays with
// piers, a cornice, and a rooftop water tank. Roof top is block y=10 (11 blocks
// above the lowest ground at y=0).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833560";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const ROOF = 9;      // roof deck / top of upper-floor walls
const F2 = 5;        // second-floor slab line
const FASCIA = 4;    // top of ground storey (red band)
const CORNICE = 10;  // parapet / cornice course

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const doorX = Math.floor((minX + maxX) / 2);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior faces: a face exists where the neighbour cell is missing from the footprint.
const OUT = {
  N: { dx: 0, dz: -1, facing: "north" },
  S: { dx: 0, dz: 1, facing: "south" },
  W: { dx: -1, dz: 0, facing: "west" },
  E: { dx: 1, dz: 0, facing: "east" },
};
const faces = (x, z) =>
  Object.keys(OUT).filter((k) => !has(x + OUT[k].dx, z + OUT[k].dz));

const isPier = (idx, len) => idx === 0 || idx === len - 1 || idx % 4 === 0;

for (const [x, z, gr] of cells) {
  const base = gAt(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  const fs = faces(x, z);

  // Interior cell: ground plate, storey slab, roof deck; air between.
  if (fs.length === 0) {
    if (base <= FASCIA) put(x, base, z, "smooth_stone");
    put(x, F2, z, "smooth_stone");
    put(x, ROOF, z, "smooth_stone");
    continue;
  }

  // Perimeter wall column from ground to roof.
  for (let y = base; y <= ROOF; y++) put(x, y, z, "smooth_quartz");
  // Plinth course at the ground line.
  put(x, base, z, "polished_andesite");
  // Cornice on top of the walls.
  put(x, CORNICE, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });

  if (fs.length >= 2) {
    // Corner: full-height pillar.
    for (let y = base + 1; y <= ROOF; y++) put(x, y, z, "quartz_pillar", { axis: "y" });
    continue;
  }

  const f = fs[0];
  const o = OUT[f];
  const along = o.dx !== 0 ? z - minZ : x - minX;
  const len = o.dx !== 0 ? maxZ - minZ + 1 : maxX - minX + 1;

  if (isPier(along, len)) {
    for (let y = base + 1; y <= ROOF; y++) put(x, y, z, "quartz_pillar", { axis: "y" });
    continue;
  }

  // Window bay: pane connections run along the face.
  const paneProps = o.dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  // Ground storey: shopfront glass, then red fascia band.
  for (let y = base + 1; y <= 3; y++) put(x, y, z, "glass_pane", paneProps);
  if (base < FASCIA) put(x, FASCIA, z, "red_concrete");

  // Upper storey: framed glass bay.
  for (let y = 6; y <= 8; y++) put(x, y, z, "light_gray_stained_glass_pane", paneProps);

  // Entrance on the street (north) face.
  if (f === "N" && x === doorX && z === minZ) {
    const dprops = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
    put(x, base + 1, z, "dark_oak_door", dprops("lower"));
    put(x, base + 2, z, "dark_oak_door", dprops("upper"));
  }

  // Warm light behind some upper-floor glass (glowstone in the air gap).
  if ((o.dx === 0) && along % 8 === 2) {
    put(x, 7, z - o.dz, "glowstone");
  }
}

// Rooftop water tank and an air-conditioning unit (interior cells only).
const isInterior = (x, z) => has(x, z) && faces(x, z).length === 0;
for (let x = maxX - 4; x <= maxX - 2; x++) {
  for (let z = minZ + 3; z <= minZ + 4; z++) {
    if (!isInterior(x, z)) continue;
    for (let y = CORNICE; y <= CORNICE + 2; y++) put(x, y, z, "white_concrete");
  }
}
for (let x = minX + 3; x <= minX + 4; x++) {
  const z = minZ + 6;
  if (isInterior(x, z)) put(x, CORNICE, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
