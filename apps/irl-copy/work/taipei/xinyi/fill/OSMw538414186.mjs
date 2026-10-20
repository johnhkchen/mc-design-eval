import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414186";
const W = 23, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// perimeter = footprint cell with at least one neighbour outside the footprint
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// outward faces of a perimeter cell: direction vector and index along the face
function facesOf(x, z) {
  const out = [];
  if (!has(x - 1, z)) out.push({ dx: -1, dz: 0, idx: z });
  if (!has(x + 1, z)) out.push({ dx: 1, dz: 0, idx: z });
  if (!has(x, z - 1)) out.push({ dx: 0, dz: -1, idx: x });
  if (!has(x, z + 1)) out.push({ dx: 0, dz: 1, idx: x });
  return out;
}

// Entrance: on the front (lowest z) north face, nearest the mean x of that face.
let doorX = null, doorZ = null;
{
  const cand = cells.filter(([x, z]) => !has(x, z - 1));
  if (cand.length) {
    const minZ = Math.min(...cand.map(([, z]) => z));
    const front = cand.filter(([, z]) => z === minZ);
    const meanX = front.reduce((s, [x]) => s + x, 0) / front.length;
    front.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
    [doorX, doorZ] = [front[0][0], front[0][1]];
  }
}

// Penthouse footprint: central rectangle, only where the footprint exists.
const PH = { x0: 8, x1: 14, z0: 6, z1: 11 };
const inPH = (x, z) => x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1 && has(x, z);

// ---- Main massing: 2 storeys (5 blocks each) + parapet, per-cell foundation ----
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isPerim(x, z)) {
    // base course
    put(x, gr, z, "stone_bricks");
    const faces = facesOf(x, z);
    const pillar = faces.length > 1 || faces.some(f => f.idx % 3 === 0);
    const isDoor = x === doorX && z === doorZ;

    // Ground storey (gr+1 .. gr+4): shopfronts
    for (let y = gr + 1; y <= gr + 4; y++) {
      if (isDoor) {
        if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (y === gr + 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (y === gr + 3) put(x, y, z, "smooth_quartz");
        else put(x, y, z, "smooth_quartz");
      } else if (pillar) {
        put(x, y, z, "quartz_pillar");
      } else {
        put(x, y, z, "glass");
      }
    }

    // storey line
    put(x, gr + 5, z, "smooth_quartz");

    // Upper storey (gr+6 .. gr+9): window bands
    for (let y = gr + 6; y <= gr + 9; y++) {
      if (pillar) put(x, y, z, "quartz_pillar");
      else put(x, y, z, "light_blue_stained_glass");
    }

    // cornice and parapet
    put(x, gr + 10, z, "smooth_quartz");
    put(x, gr + 11, z, "smooth_quartz");
  } else {
    // interior: floor and roof slabs only, air between
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_quartz");
    put(x, gr + 10, z, "smooth_quartz");
  }
}

// ---- Warm lights behind the glass (interior cells one block in from windows) ----
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  for (const f of facesOf(x, z)) {
    if (f.idx % 3 === 0) continue;
    const ix = x - f.dx, iz = z - f.dz;
    if (!has(ix, iz) || isPerim(ix, iz)) continue;
    // upper storey lights
    if (f.idx % 3 === 1) put(ix, gr + 7, iz, "glowstone");
    if (f.idx % 6 === 4) put(ix, gr + 8, iz, "shroomlight");
    // ground storey light
    if (f.idx % 6 === 2) put(ix, gr + 2, iz, "glowstone");
  }
}

// ---- Roof plant penthouse on the central rectangle ----
for (const [x, z, gr] of cells) {
  if (!inPH(x, z)) continue;
  const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  if (edge) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  }
  put(x, gr + 13, z, "light_gray_concrete");
}
// small vent slots on the penthouse north face
for (let x = PH.x0 + 1; x < PH.x1; x += 2) {
  for (const [cx, cz, gr] of cells) {
    if (cx === x && cz === PH.z0) put(x, gr + 11, cz, "iron_bars");
  }
}
// antenna on the penthouse
{
  const ax = Math.floor((PH.x0 + PH.x1) / 2), az = Math.floor((PH.z0 + PH.z1) / 2);
  if (inPH(ax, az)) {
    const gr = groundOf(ax, az);
    put(ax, gr + 14, az, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
