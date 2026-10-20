import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772039820";
const W = 18, H = 47, D = 66;
const ROOF = 35;        // roof deck y, about 35 blocks above lowest ground
const STOREY = 5;       // 7 storeys of 5 blocks
const DOOR_X = [8, 9];  // double entrance doors on the north (z = 0) front
const ENTRY_X = [6, 11];

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inFp = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// outward normals of the faces of this cell that touch air (outside the footprint)
const exposed = (x, z) => {
  const f = [];
  if (!inFp(x - 1, z)) f.push([-1, 0]);
  if (!inFp(x + 1, z)) f.push([1, 0]);
  if (!inFp(x, z - 1)) f.push([0, -1]);
  if (!inFp(x, z + 1)) f.push([0, 1]);
  return f;
};
const isRing = (x, z) => exposed(x, z).length > 0;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = exposed(x, z);
  const ring = faces.length > 0;
  const corner = faces.length >= 2;

  for (let y = gr; y < ROOF; y++) {
    const s = Math.floor(y / STOREY);
    const r = y % STOREY;

    // interior: air gap with a floor slab per storey (no interiors modelled)
    if (!ring) {
      if (r === 0 || y === gr) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // base course and storey belts
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }
    if (r === 0) { put(x, y, z, "light_gray_concrete"); continue; }

    // vertical corner piers
    if (corner) { put(x, y, z, "white_concrete"); continue; }

    const [nx, nz] = faces[0];
    const idx = nx !== 0 ? z : x;          // position along the exposed face
    const frontEntry = s === 0 && nz === -1 && x >= ENTRY_X[0] && x <= ENTRY_X[1];

    // spandrel / ground-floor sign band / entrance canopy
    if (r === 4) {
      if (frontEntry) put(x, y, z, "smooth_stone");
      else if (s === 0) put(x, y, z, "black_concrete");
      else put(x, y, z, "white_concrete");
      continue;
    }

    // entrance: double doors with glass transom and vitrine
    if (frontEntry) {
      if (DOOR_X.includes(x) && r <= 2) {
        put(x, y, z, "iron_door", {
          facing: "north",
          half: r === 1 ? "lower" : "upper",
          hinge: x === DOOR_X[0] ? "left" : "right",
          open: "false",
          powered: "false",
        });
      } else {
        put(x, y, z, "glass");
      }
      continue;
    }

    // window bands: glass with white mullions; shopfront on the ground storey
    const mull = idx % 3 === 0;
    let id;
    if (s === 0) id = mull ? "polished_andesite" : "glass";
    else id = mull ? "white_concrete" : "light_blue_stained_glass";
    put(x, y, z, id);

    // warm light in some windows, placed in the air gap just behind the glass
    if (!mull && r === 2 && ((idx + s) % 4 === 1)) {
      const ix = x - nx, iz = z - nz;
      if (inFp(ix, iz) && !isRing(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }

  // roof deck, parapet and cap
  put(x, ROOF, z, "light_gray_concrete");
  if (ring) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "white_concrete");
    put(x, ROOF + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// roof mechanical penthouse on the deck: ring walls, glass band, roof slab
const PH = { x0: 4, x1: 13, z0: 22, z1: 43 };
const PH_TOP = ROOF + 5; // 40
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!inFp(x, z)) continue;
    const xEdge = x === PH.x0 || x === PH.x1;
    const zEdge = z === PH.z0 || z === PH.z1;
    const edge = xEdge || zEdge;
    if (edge) {
      for (let y = ROOF + 1; y < PH_TOP; y++) {
        const rr = y - (ROOF + 1);
        if (rr === 0 || rr === 3 || (xEdge && zEdge)) {
          put(x, y, z, "white_concrete");
        } else {
          const idx = xEdge ? z : x;
          put(x, y, z, idx % 3 === 0 ? "white_concrete" : "light_blue_stained_glass");
        }
      }
    }
    put(x, PH_TOP, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
