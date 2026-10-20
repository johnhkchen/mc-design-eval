import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414157.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414157.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 14, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const isEdge = (x, z) => has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Glass pane props that connect along the wall plane
const paneFor = (dir) =>
  dir === "W" || dir === "E"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Outward faces of a footprint cell; u = coordinate running along that face
const facesOf = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push({ dir: "W", u: z, dx: 1, dz: 0 });
  if (!has(x + 1, z)) f.push({ dir: "E", u: z, dx: -1, dz: 0 });
  if (!has(x, z - 1)) f.push({ dir: "N", u: x, dx: 0, dz: 1 });
  if (!has(x, z + 1)) f.push({ dir: "S", u: x, dx: 0, dz: -1 });
  return f;
};

// Pick the front (entrance) face as the one with the most exposed cells
const counts = { W: 0, E: 0, N: 0, S: 0 };
const uOn = { W: [], E: [], N: [], S: [] };
for (const [x, z] of cells) {
  for (const f of facesOf(x, z)) {
    counts[f.dir]++;
    uOn[f.dir].push(f.u);
  }
}
const front = Object.keys(counts).reduce((a, b) => (counts[b] > counts[a] ? b : a), "S");
const fu = uOn[front].slice().sort((a, b) => a - b);
const doorU = fu.length ? fu[Math.floor(fu.length / 2)] : -1;

// Pass 1: foundations, floor slabs, roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");        // ground floor slab
  put(x, gr + 5, z, "smooth_stone");    // upper floor slab
  put(x, gr + 9, z, "smooth_stone");    // roof deck
}

// Pass 2: exterior shell, articulated facades
for (const [x, z, gr] of cells) {
  const faces = facesOf(x, z);
  if (faces.length === 0) continue;
  const corner = faces.length >= 2;
  const f = corner ? null : faces[0];
  const u = faces[0].u;
  const isFront = !!f && f.dir === front;
  const door = isFront && u === doorU;
  const pier = corner || u % 3 === 0;

  for (let k = 0; k <= 10; k++) {
    const y = gr + k;
    let id = null, props = null;

    if (k === 0) {
      id = "polished_granite";                          // base course
    } else if (k === 9) {
      id = "stone_bricks";                              // cornice
    } else if (k === 10) {
      id = "white_concrete";                            // parapet
    } else if (k <= 4) {                                // ground storey
      if (k === 4) id = "white_concrete";               // storey line
      else if (door) {
        if (k === 3) id = "white_concrete";             // door lintel
        else { id = "glass_pane"; props = paneFor(f.dir); }
      } else if (pier) id = "white_concrete";
      else { id = "glass_pane"; props = paneFor(f.dir); }
    } else {                                            // upper storey k 5..8
      if (k === 5) id = pier ? "white_concrete" : "stone_bricks"; // sill
      else if (k === 8) id = "white_concrete";          // lintel
      else if (pier) id = "white_concrete";
      else { id = "glass_pane"; props = paneFor(f.dir); }
    }

    if (id) {
      if (props) put(x, y, z, id, props);
      else put(x, y, z, id);
    }
  }

  // Warm lights just inside some windows (only if the interior cell is open)
  if (f && !corner) {
    const ix = x + f.dx, iz = z + f.dz;
    if (has(ix, iz) && !isEdge(ix, iz)) {
      if (!pier && !door && u % 4 === 1) put(ix, gr + 2, iz, "glowstone");
      if (!pier && u % 5 === 2) put(ix, gr + 6, iz, "glowstone");
    }
  }
}

// Pass 3: roof equipment on interior roof cells
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if ((x * 7 + z * 3) % 11 === 0) put(x, gr + 10, z, "light_gray_concrete");
}

g.save(OUT);
