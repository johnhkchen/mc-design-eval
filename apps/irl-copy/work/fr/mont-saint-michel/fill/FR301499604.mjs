import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499604";
const W = 13, H = 24, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const list = cells.map(([x, z, gr, roof]) => ({ x, z, g: Math.round(gr), R: Math.round(roof) }));
const info = new Map(list.map(c => [key(c.x, c.z), c]));
const has = (x, z) => info.has(key(x, z));
const faces = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  return f;
};
const S = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Pass 1: massing, foundations, floors, walls, windows
for (const c of list) {
  const { x, z } = c;
  const gr = c.g;
  const pt = Math.min(H - 1, Math.max(gr + 11, c.R - 1));
  const f = faces(x, z);
  const perim = f.length > 0;

  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  if (!perim) {
    S(x, gr, z, "smooth_stone");
    S(x, gr + 5, z, "smooth_stone");
    S(x, gr + 10, z, "smooth_stone");
    continue;
  }

  const corner = f.length >= 2;

  // stone base course, stone walls, banded storey lines and cornice
  S(x, gr, z, "smooth_stone");
  for (let y = gr + 1; y <= pt - 1; y++) {
    let id = corner ? "polished_andesite" : "stone_bricks";
    if (y === gr + 5 || y === gr + 10) id = "polished_andesite";
    S(x, y, z, id);
  }
  // parapet cap
  S(x, pt, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  if (!corner) {
    const face = f[0];
    const along = (face === "W" || face === "E") ? z : x;
    if (along % 2 === 1) {
      const pane = (face === "W" || face === "E")
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
      const storeys = [
        { sill: gr + 1, p1: gr + 2, p2: gr + 3, head: gr + 4, light: gr + 2 },
        { sill: gr + 6, p1: gr + 7, p2: gr + 8, head: gr + 9, light: gr + 7 },
      ];
      const [dx, dz] = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] }[face];
      const ix = x + dx, iz = z + dz;
      const inwardOk = has(ix, iz) && faces(ix, iz).length === 0;
      for (const s of storeys) {
        S(x, s.sill, z, "light_gray_concrete");
        S(x, s.p1, z, "glass_pane", pane);
        S(x, s.p2, z, "glass_pane", pane);
        S(x, s.head, z, "polished_andesite");
        if (inwardOk && along % 4 === 1) S(ix, s.light, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

// Pass 2: entrances on the north and south faces, nearest the middle
const doorOn = (face, facing) => {
  const cand = list
    .filter(c => { const f = faces(c.x, c.z); return f.includes(face) && f.length === 1; })
    .sort((a, b) => Math.abs(a.x - 6) - Math.abs(b.x - 6));
  if (!cand.length) return;
  const d = cand[0];
  const gr = d.g;
  S(d.x, gr + 1, d.z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
  S(d.x, gr + 2, d.z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
  // recessed-entry lintel: stone slab head over the door
  S(d.x, gr + 3, d.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  // step in front of the door, inside the footprint
  const step = { N: [0, 1], S: [0, -1] }[face];
  if (has(d.x + step[0], d.z + step[1])) {
    const sc = info.get(key(d.x + step[0], d.z + step[1]));
    S(d.x + step[0], sc.g, d.z + step[1], "stone_brick_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
  }
};
doorOn("N", "north");
doorOn("S", "south");

g.save(`${DIR}/${ID}.nbt`);
