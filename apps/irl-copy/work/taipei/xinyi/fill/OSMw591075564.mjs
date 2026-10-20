import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075564";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 20, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const inside = (x, z) => ground.has(key(x, z));
const faces = (x, z) => ({
  N: !inside(x, z - 1), // north face: z-1 is outside
  S: !inside(x, z + 1), // south face: z+1 is outside
  W: !inside(x - 1, z),
  E: !inside(x + 1, z),
});
const isEdge = (x, z) => {
  const f = faces(x, z);
  return f.N || f.S || f.W || f.E;
};

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: foundation, floor slab, walls, cornice, parapet, roof deck.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const f = faces(x, z);
  const t = (f.N || f.S) ? x : z; // tangential index along the facade

  for (let y = gr; y <= 9; y++) {
    if (!edge) {
      // Interior: air gap, floor slab at storey line, roof deck at top.
      if (y === 4) put(x, y, z, "smooth_stone");
      else if (y === 8) put(x, y, z, "light_gray_concrete");
      continue;
    }

    let id = null;
    let props = null;
    if (y === gr) {
      id = "stone_bricks"; // base course
    } else if (y <= 3) {
      // Ground floor shopfront: piers and glass.
      id = (t % 4 === 0) ? "white_concrete" : "glass";
    } else if (y === 4) {
      id = "smooth_stone"; // storey string course
    } else if (y === 5 || y === 6) {
      // Upper windows in frames.
      id = (t % 3 === 0) ? "white_concrete" : "light_blue_stained_glass";
    } else if (y === 7) {
      id = "white_concrete"; // lintel band
    } else if (y === 8) {
      id = "stone_brick_slab"; // cornice
      props = { type: "bottom", waterlogged: "false" };
    } else if (y === 9) {
      id = "white_concrete"; // parapet
    }
    if (id) put(x, y, z, id, props);
  }
}

// Pass 2: warm light behind upper windows (air gap, not in wall cells).
const outward = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const inwardOf = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (!isEdge(x, z)) continue;
  const f = faces(x, z);
  const face = ["N", "S", "W", "E"].find((k) => f[k]);
  const t = (face === "N" || face === "S") ? x : z;
  if (t % 3 === 0 || t % 6 !== 1) continue;
  const [dx, dz] = inwardOf[face];
  const ix = x + dx, iz = z + dz;
  if (inside(ix, iz) && !isEdge(ix, iz)) {
    const gr = ground.get(key(ix, iz));
    if (5 >= gr) put(ix, 5, iz, "glowstone");
  }
}

// Pass 3: entrance on the south face, nearest the middle.
const southCells = cells.filter(([x, z]) => faces(x, z).S);
if (southCells.length) {
  southCells.sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
  const [ex, ez, egr] = southCells[0];
  if (egr + 2 <= 3) {
    put(ex, egr + 1, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(ex, egr + 2, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(ex, 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 4: rooftop water tank on the deck, centred.
const cx = Math.floor(W / 2) - 1, cz = Math.floor(D / 2) - 1;
const tankOk = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => {
  const x = cx + dx, z = cz + dz;
  return inside(x, z) && !isEdge(x, z);
});
if (tankOk) {
  for (const y of [9, 10]) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      put(cx + dx, y, cz + dz, "oxidized_copper");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
