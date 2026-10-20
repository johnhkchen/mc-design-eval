import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833543";
const W = 19, H = 23, D = 23;
const ROOF_TOP = 10;      // last solid course; roof surface at y = 11
const STOREY_LINE = 5;    // ground storey / upper storey division
const CORNICE = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);

const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const maxZ = Math.max(...cells.map(c => c[1]));

const DIRS = {
  N: { dx: 0, dz: -1, name: "north" },
  S: { dx: 0, dz: 1, name: "south" },
  W: { dx: -1, dz: 0, name: "west" },
  E: { dx: 1, dz: 0, name: "east" },
};

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const facesOf = (x, z) =>
  Object.keys(DIRS).filter(k => !G.has(key(x + DIRS[k].dx, z + DIRS[k].dz)));
const isExt = (x, z) => facesOf(x, z).length > 0;
const isCorner = (x, z) => {
  const f = facesOf(x, z);
  return (f.includes("N") || f.includes("S")) && (f.includes("W") || f.includes("E"));
};
const uOf = (f, x, z) => (f === "N" || f === "S" ? x - minX : z - minZ);

// Entrance: the face carrying the most exterior cells
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (const [x, z] of cells) for (const f of facesOf(x, z)) faceCount[f]++;
const entranceFace = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];

// Door cell: middle of the lowest-ground non-corner cells on that face
let doorKey = null;
{
  const cand = cells
    .filter(([x, z]) => facesOf(x, z).includes(entranceFace) && !isCorner(x, z))
    .map(([x, z, gr]) => ({ x, z, gr, u: uOf(entranceFace, x, z) }));
  if (cand.length) {
    const minG = Math.min(...cand.map(c => c.gr));
    const low = cand.filter(c => c.gr === minG).sort((a, b) => a.u - b.u);
    const pick = low[Math.floor(low.length / 2)];
    if (pick && pick.gr + 2 <= 4) doorKey = key(pick.x, pick.z);
  }
}

// 1. Foundations and building volume
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

for (const [x, z, gr] of cells) {
  const faces = facesOf(x, z);
  const ext = faces.length > 0;

  if (!ext) {
    // Interior: air gaps, floor slab per storey, roof slab on top
    if (gr >= STOREY_LINE) {
      for (let y = gr; y <= ROOF_TOP; y++) put(x, y, z, "light_gray_concrete");
    } else {
      put(x, STOREY_LINE, z, "smooth_quartz");
      put(x, ROOF_TOP, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = isCorner(x, z);
  const f = faces[0];
  const u = uOf(f, x, z);
  const isWin = u % 3 === 1;
  const isDoor = key(x, z) === doorKey && f === entranceFace;

  for (let y = gr; y <= ROOF_TOP; y++) {
    if (isDoor && (y === gr + 1 || y === gr + 2)) continue;
    let id;
    if (y === gr) id = "stone_bricks";                  // base course
    else if (y === CORNICE) id = "smooth_quartz";       // cornice / parapet
    else if (y === STOREY_LINE) id = "smooth_quartz";   // storey line
    else if (corner) id = "white_concrete";
    else if (y < STOREY_LINE) {                         // ground storey shopfront
      if (y === 4) id = "smooth_quartz";                // lintel
      else id = isWin ? "light_blue_stained_glass" : "white_concrete";
    } else {                                            // upper storey
      if (y === 9) id = "smooth_quartz";                // header
      else id = isWin ? "light_blue_stained_glass" : "white_concrete";
    }
    put(x, y, z, id);
  }

  // Warm lights behind some windows (interior cell inward of the glass)
  if (!corner && !isDoor) {
    const inx = x - DIRS[f].dx, inz = z - DIRS[f].dz;
    const inward = G.has(key(inx, inz)) && !isExt(inx, inz);
    if (inward && isWin) {
      if (u % 6 === 1) put(inx, 7, inz, "glowstone");
      if (u % 6 === 4 && gr <= 1) put(inx, 2, inz, "glowstone");
    }
  }
}

// 2. Entrance door with canopy line above
if (doorKey) {
  const [dx0, dz0] = doorKey.split(",").map(Number);
  const gr = G.get(doorKey);
  const facing = DIRS[entranceFace].name;
  put(dx0, gr + 1, dz0, "spruce_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx0, gr + 2, dz0, "spruce_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  if (gr + 3 <= 3) put(dx0, gr + 3, dz0, "white_concrete");
  else put(dx0, gr + 3, dz0, "smooth_quartz");
}

// 3. Roof equipment: penthouse on the roof slab, centred on the footprint
{
  const cx = Math.floor((minX + maxX) / 2);
  const cz = Math.floor((minZ + maxZ) / 2);
  let ok = true;
  for (let x = cx - 2; x <= cx + 2 && ok; x++)
    for (let z = cz - 2; z <= cz + 2 && ok; z++)
      if (!G.has(key(x, z)) || isExt(x, z) || G.get(key(x, z)) > ROOF_TOP) ok = false;

  if (ok) {
    for (let x = cx - 2; x <= cx + 2; x++) {
      for (let z = cz - 2; z <= cz + 2; z++) {
        const edge = x === cx - 2 || x === cx + 2 || z === cz - 2 || z === cz + 2;
        for (let y = 11; y <= 13; y++) {
          if (edge) put(x, y, z, "white_concrete");
          else if (y === 13 && x === cx && z === cz) continue;
        }
        put(x, 14, z, "light_gray_concrete");
      }
    }
    // glass on each face of the penthouse, centre column
    for (let y = 11; y <= 12; y++) {
      put(cx, y, cz - 2, "light_blue_stained_glass");
      put(cx, y, cz + 2, "light_blue_stained_glass");
      put(cx - 2, y, cz, "light_blue_stained_glass");
      put(cx + 2, y, cz, "light_blue_stained_glass");
    }
    put(cx, 15, cz, "lightning_rod");
  }

  // Small plant units on the roof, clear of the penthouse
  for (const [x, z] of [[minX + 2, minZ + 2], [maxX - 2, maxZ - 2]]) {
    if (G.has(key(x, z)) && !isExt(x, z) && G.get(key(x, z)) <= ROOF_TOP) {
      put(x, 11, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
