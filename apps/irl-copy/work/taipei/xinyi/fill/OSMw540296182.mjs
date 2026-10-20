import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540296182";
const W = 17, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior faces of a footprint cell: n = open toward -z, s = +z, w = -x, e = +x
const faceList = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
};

// Inward step from an exterior face
const inward = (face, x, z) => {
  switch (face) {
    case "n": return [x, z + 1];
    case "s": return [x, z - 1];
    case "w": return [x + 1, z];
    case "e": return [x - 1, z];
    default: return [x, z];
  }
};

// Bounding box
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Entrance: middle of the north (-z) street face, avoiding corners
const northCands = cells
  .filter(([x, z]) => {
    const f = faceList(x, z);
    return f.includes("n") && f.length === 1;
  })
  .sort((a, b) => a[0] - b[0]);
const entr = northCands.length ? northCands[Math.floor(northCands.length / 2)] : null;

const lights = [];

// Main pass: foundation, floors, facade, parapet
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = faceList(x, z);
  if (f.length === 0) {
    // Interior cell: floor slabs only, no interior fit-out
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_quartz");
    put(x, gr + 10, z, "smooth_stone");
    continue;
  }

  const corner = f.length > 1;
  const f0 = f[0];
  const [u, start, end] = (f0 === "n" || f0 === "s")
    ? [x, minX, maxX]
    : [z, minZ, maxZ];
  const pillar = corner || u === end || (u - start) % 3 === 0;
  const isEntr = !!entr && entr[0] === x && entr[1] === z;

  // Base course, storey line, roof edge
  put(x, gr, z, "stone_bricks");
  put(x, gr + 5, z, "white_concrete");
  put(x, gr + 10, z, "smooth_stone");

  // Ground storey (shopfront), gr+1..gr+4
  if (isEntr) {
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "white_concrete");
    put(x, gr + 4, z, "white_concrete");
  } else if (pillar) {
    for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "white_concrete");
  } else {
    put(x, gr + 1, z, "smooth_stone");
    put(x, gr + 2, z, "light_blue_stained_glass");
    put(x, gr + 3, z, "light_blue_stained_glass");
    put(x, gr + 4, z, "white_concrete");
  }

  // Upper storey, gr+6..gr+9
  for (let y = gr + 6; y <= gr + 9; y++) {
    if (pillar) put(x, y, z, "white_concrete");
    else if (y === gr + 6 || y === gr + 9) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass");
  }

  // Parapet
  put(x, gr + 11, z, pillar ? "white_concrete" : "smooth_quartz");

  // Warm light behind some upper windows (only where the inward cell shares this ground)
  if (!pillar && !isEntr) {
    const [ix, iz] = inward(f0, x, z);
    if (has(ix, iz) && ground.get(`${ix},${iz}`) === gr && (u - start) % 2 === 0) {
      lights.push([ix, gr + 7, iz]);
    }
  }
  // A few warm lights inside the shopfront
  if (!pillar && !isEntr && (u - start) % 4 === 1) {
    const [ix, iz] = inward(f0, x, z);
    if (has(ix, iz) && ground.get(`${ix},${iz}`) === gr) {
      lights.push([ix, gr + 2, iz]);
    }
  }
}

// Glow behind glass, applied after the main pass so it is not overwritten
for (const [x, y, z] of lights) put(x, y, z, "glowstone");

// Roof plant: small box near the footprint centroid, on cells sharing its ground
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length;
const cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
let centre = cells[0];
let best = Infinity;
for (const c of cells) {
  const d = (c[0] - cx) ** 2 + (c[1] - cz) ** 2;
  if (d < best) { best = d; centre = c; }
}
const gc = centre[2];
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    const x = centre[0] + dx, z = centre[1] + dz;
    if (has(x, z) && ground.get(`${x},${z}`) === gc) {
      put(x, gc + 11, z, "light_gray_concrete");
    }
  }
}
put(centre[0], gc + 12, centre[1], "light_gray_concrete");

g.save(`${DIR}/${ID}.nbt`);
