import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87342";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 29, H = 32, D = 20;
const g = new Voxels([W, H, D]);
const S = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Commercial office, 1401 H St NW: 1960s-70s brick-and-stone office block,
// stepped podium with a tower core, punched window bays, stone bands.
const K = (x, z) => x + "," + z;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cm = new Map();
for (const [x, z, gr, rf] of cells) {
  cm.set(K(x, z), { x, z, g: Math.round(gr), r: Math.round(rf) });
}

// distance in cells from the footprint edge (1 = edge ring, 2 = second ring)
const dist = new Map();
let frontier = [];
for (const c of cm.values()) {
  if (DIRS.some(([dx, dz]) => !cm.has(K(c.x + dx, c.z + dz)))) {
    dist.set(K(c.x, c.z), 1);
    frontier.push(c);
  }
}
for (let d = 1; d < 3; d++) {
  const next = [];
  for (const c of frontier) {
    for (const [dx, dz] of DIRS) {
      const n = cm.get(K(c.x + dx, c.z + dz));
      if (n && !dist.has(K(n.x, n.z))) {
        dist.set(K(n.x, n.z), d + 1);
        next.push(n);
      }
    }
  }
  frontier = next;
}
const distOf = (c) => dist.get(K(c.x, c.z)) ?? 99;

// tops: lidar roof quantised to 3-block storeys, with a stepped podium
let Rmax = 0;
for (const c of cm.values()) {
  c.raw = Math.max(c.g + 3, Math.round(c.r / 3) * 3);
  Rmax = Math.max(Rmax, c.raw);
}
const P = Math.max(6, Math.round((Rmax * 0.5) / 3) * 3);
for (const c of cm.values()) {
  c.T = c.raw;
  if (distOf(c) <= 2 && c.raw > P) c.T = Math.max(P, c.g + 3);
  c.T = Math.min(c.T, H - 6);
}
Rmax = Math.max(...[...cm.values()].map((c) => c.T));

const exposed = (c, dx, dz, y) => {
  const n = cm.get(K(c.x + dx, c.z + dz));
  return !n || y >= n.T;
};

const DOORX = Math.floor(W / 2);
const GLASS_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const lights = [];

for (const c of cm.values()) {
  for (let y = 0; y < c.T; y++) {
    if (y < c.g) { S(c.x, y, c.z, "stone_bricks"); continue; }
    const rel = y - c.g;
    const faces = DIRS.filter(([dx, dz]) => exposed(c, dx, dz, y));

    // roof surface / parapet
    if (y === c.T - 1) {
      S(c.x, y, c.z, faces.length ? "smooth_stone" : "light_gray_concrete");
      continue;
    }

    // interior: floor slabs only, air otherwise
    if (faces.length === 0) {
      if (rel % 3 === 0) S(c.x, y, c.z, "smooth_stone");
      continue;
    }

    const [dx, dz] = faces[0];

    // recessed street entrance on the z=0 face: centre door, glazed storefront
    // either side, stone lintel over the door
    if (dz === -1 && dx === 0 && c.z === 0 && Math.abs(c.x - DOORX) <= 1 && rel <= 2) {
      if (c.x === DOORX && rel === 0) {
        S(c.x, y, c.z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (c.x === DOORX && rel === 1) {
        S(c.x, y, c.z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (c.x === DOORX && rel === 2) { S(c.x, y, c.z, "stone_bricks"); continue; }
      if (rel === 0) { S(c.x, y, c.z, "stone_bricks"); continue; }
      S(c.x, y, c.z, "light_blue_stained_glass_pane", GLASS_Z);
      continue;
    }

    // storey bands (floor slab line) and ground course
    if (rel % 3 === 0) {
      S(c.x, y, c.z, y === c.g ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // facade: piers every third bay (stone every other pier, brick between),
    // glass panes between
    const t = dz !== 0 ? c.x : c.z;
    if (t % 3 === 0) {
      S(c.x, y, c.z, (t % 6 === 0) ? "stone_bricks" : "bricks");
    } else {
      S(c.x, y, c.z, "light_blue_stained_glass_pane", dz !== 0 ? GLASS_Z : GLASS_X);
      if (rel === 1 && (c.x * 7 + c.z * 3 + y) % 11 === 0) {
        const ix = c.x - dx, iz = c.z - dz;
        const inner = cm.get(K(ix, iz));
        if (inner && y < inner.T && distOf(inner) >= 2) lights.push([ix, y, iz]);
      }
    }
  }
}

// warm light behind glass
for (const [x, y, z] of lights) S(x, y, z, "shroomlight");

// one clean mechanical penthouse on the tower roof, not scattered blocks
for (const c of cm.values()) {
  if (c.T !== Rmax || distOf(c) < 3) continue;
  if (c.x < 9 || c.x > 19 || c.z < 6 || c.z > 13) continue;
  const edge = c.x === 9 || c.x === 19 || c.z === 6 || c.z === 13;
  S(c.x, c.T, c.z, edge ? "white_concrete" : "light_gray_concrete");
  S(c.x, c.T + 1, c.z, edge ? "smooth_stone" : "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
