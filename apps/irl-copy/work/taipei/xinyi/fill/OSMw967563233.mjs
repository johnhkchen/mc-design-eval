import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw967563233";
const W = 48, H = 23, D = 14;

// Footprint cells: [x, z, ground]
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of raw) {
  const [x, z, gy] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  ground.set(`${x},${z}`, Number.isFinite(gy) ? gy | 0 : 0);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Outward normals of each face. North/south faces run along x, east/west along z.
const FACES = {
  north: { dx: 0, dz: -1, ns: true },
  south: { dx: 0, dz: 1, ns: true },
  west: { dx: -1, dz: 0, ns: false },
  east: { dx: 1, dz: 0, ns: false },
};
const faceOf = (x, z) => Object.keys(FACES).filter((n) => {
  const f = FACES[n];
  return !has(x + f.dx, z + f.dz);
});

// Glass pane connections so runs of panes join along the wall.
const pane = (ns) => ns
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Storey 1 is a shopfront (rows 0-4), storey 2 is a tiled office band with
// punched windows (rows 6-9), rows 5 and 10 are the floor line and cornice.
function wallBlock(face, u, r) {
  const ns = FACES[face].ns;
  if (r === 0) return ["polished_andesite"];
  if (r <= 3) {
    if (u % 4 === 0) return ["smooth_stone"];
    return ["glass_pane", pane(ns)];
  }
  if (r === 4) return ["black_concrete"];
  if (r === 5) return ["light_gray_concrete"];
  if (r === 9) return ["light_gray_concrete"];
  if (u % 3 === 0) return ["white_concrete"];
  return ["glass_pane", pane(ns)];
}

// Pick the main entrance: the single-face south edge cell nearest 60% along the front.
let doorCell = null;
{
  let best = Infinity;
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    const fs = faceOf(x, z);
    if (fs.length !== 1 || fs[0] !== "south") continue;
    const score = Math.abs(x - 0.6 * W);
    if (score < best) { best = score; doorCell = { x, z }; }
  }
}

for (const [key, b] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const faces = faceOf(x, z);

  if (faces.length === 0) {
    // Interior cell: storey floor slab and roof deck, no walls.
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 10, z, "gray_concrete");
    if (x % 10 === 5 && (z === 4 || z === 9)) {
      put(x, b + 11, z, "light_gray_concrete"); // roof plant box
    }
    continue;
  }

  if (faces.length > 1) {
    // Corner column.
    for (let r = 0; r <= 9; r++) {
      put(x, b + r, z, r < 5 ? "polished_andesite" : "white_concrete");
    }
    put(x, b + 10, z, "light_gray_concrete");
    continue;
  }

  const face = faces[0];
  const def = FACES[face];
  const u = def.ns ? x : z;
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;

  for (let r = 0; r <= 9; r++) {
    const y = b + r;

    if (isDoor && (r === 1 || r === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: face,
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoor && r === 3) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    const [id, p] = wallBlock(face, u, r);
    put(x, y, z, id, p);

    // Warm lights just inside the glass.
    const ix = x - def.dx, iz = z - def.dz;
    if (has(ix, iz) && faceOf(ix, iz).length === 0) {
      if (r === 1 && u % 4 === 2) {
        const ib = gnd(ix, iz);
        put(ix, ib, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
      if (r === 6 && u % 6 === 1) {
        const ib = gnd(ix, iz);
        put(ix, ib + 6, iz, "glowstone");
      }
    }
  }

  // Parapet cornice on the edge.
  put(x, b + 10, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
