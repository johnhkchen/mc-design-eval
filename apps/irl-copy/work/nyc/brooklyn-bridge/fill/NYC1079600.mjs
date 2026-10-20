import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1079600";
const W = 10, H = 21, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cm = new Map();
for (const [x, z, gr, rf] of cells) {
  cm.set(key(x, z), { gr: Math.round(gr), rf: Math.round(rf) });
}

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const FACES = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];

// one flat roof level for the whole block (lidar median, lifted above the highest ground + 4)
const grounds = [...cm.values()].map((c) => c.gr);
const roofs = [...cm.values()].map((c) => c.rf).sort((a, b) => a - b);
const maxGr = Math.max(...grounds);
const medRf = roofs[Math.floor(roofs.length / 2)];
const RT = Math.min(17, Math.max(maxGr + 4, medRf));

const info = new Map();
const edgeSet = new Set();
for (const [k, { gr }] of cm) {
  const [x, z] = k.split(",").map(Number);
  const faces = FACES.filter((f) => !cm.has(key(x + f.dx, z + f.dz)));
  info.set(k, { x, z, gr, Rt: RT, faces });
  if (faces.length) edgeSet.add(k);
}

// penthouse setback: a small inset box on the roof, interior cells only
const inPenthouse = (x, z) => x >= 3 && x <= 6 && z >= 4 && z <= 11;

// ---- massing: foundation, storeys, deck, parapet ----
for (const [k, c] of info) {
  const { x, z, gr, Rt, faces } = c;
  const edge = faces.length > 0;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= Rt - 2; y++) {
    const kk = y - gr;
    if (!edge) {
      // interior: floor slab per storey (bottom half-slab), otherwise air gap
      if (kk % 2 === 0) put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    const f = faces[0];
    const pos = f.dx !== 0 ? z : x;
    if (kk === 0) {
      put(x, y, z, "stone_bricks");
    } else if (y === Rt - 2) {
      put(x, y, z, "stone_bricks"); // cornice course
    } else if (kk % 2 === 0) {
      put(x, y, z, "smooth_stone"); // storey line / sill
    } else if (pos % 3 === 0) {
      put(x, y, z, "bricks"); // pier
    } else {
      put(x, y, z, "glass_pane");
    }
  }

  // flat roof deck
  put(x, Rt - 1, z, "gray_concrete");

  if (edge) {
    put(x, Rt, z, "stone_brick_wall");
  } else if (inPenthouse(x, z)) {
    // penthouse setback: two storeys of light brick, with a cap
    put(x, Rt, z, "light_gray_concrete");
    put(x, Rt + 1, z, "light_gray_concrete");
    if (x === 3 || x === 6 || z === 4 || z === 11) {
      put(x, Rt + 1, z, "bricks");
    }
  } else if (x % 4 === 2 && z % 6 === 3) {
    put(x, Rt, z, "iron_block"); // roof plant
  }
}

// ---- warm light behind a few windows (sparse, interior side) ----
for (const [k, c] of info) {
  const { x, z, gr, Rt, faces } = c;
  if (!faces.length) continue;
  const f = faces[0];
  const pos = f.dx !== 0 ? z : x;
  if (pos % 3 !== 1) continue;
  const ix = x - f.dx, iz = z - f.dz;
  const ik = key(ix, iz);
  if (!info.has(ik) || edgeSet.has(ik)) continue;
  for (let kk = 1; kk <= Rt - gr - 3; kk += 2) {
    if ((pos + kk) % 8 !== 1) continue;
    put(ix, gr + kk, iz, "glowstone");
  }
}

// ---- entrance: centred door on the street (north) face ----
{
  const north = [...info.values()].filter((c) => c.faces.some((f) => f.name === "north"));
  if (north.length) {
    north.sort((a, b) => a.x - b.x);
    const c = north[Math.floor(north.length / 2)];
    const y0 = c.gr + 1;
    put(c.x, y0, c.z, "oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(c.x, y0 + 1, c.z, "oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    if (y0 + 2 < H - 1) put(c.x, y0 + 2, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
