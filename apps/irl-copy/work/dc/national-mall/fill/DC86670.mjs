import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86670";
const W = 16, H = 32, D = 28;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Cell map: ground (g) and quantised roof (r), both relative to y0.
const info = new Map();
const key = (x, z) => `${x},${z}`;
for (const row of cells) {
  const [x, z, gr, roof] = row;
  const g = Math.min(H - 12, Math.max(0, Math.round(gr)));
  // Smooth lidar noise into 4-block storey tiers.
  const rq = Math.round(Math.round(roof) / 4) * 4;
  const r = Math.min(H - 3, Math.max(g + 8, rq));
  info.set(key(x, z), { x, z, g, r });
}
const at = (x, z) => info.get(key(x, z));

// A face is exposed if there is no neighbour, or the neighbour's roof is lower (setback edge).
const exposed = (c, dx, dz) => {
  const n = at(c.x + dx, c.z + dz);
  return !n || n.r < c.r;
};

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// ---- Massing, articulation, lights ----
for (const c of info.values()) {
  const { x, z, g: gr, r } = c;

  // Foundation and ground slab.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
  set(x, gr, z, "smooth_stone");

  const N = exposed(c, 0, -1), S = exposed(c, 0, 1);
  const Wf = exposed(c, -1, 0), E = exposed(c, 1, 0);
  const edge = N || S || Wf || E;

  let face = null;
  if (N) face = { dx: 0, dz: -1, t: x, len: W };
  else if (S) face = { dx: 0, dz: 1, t: x, len: W };
  else if (Wf) face = { dx: -1, dz: 0, t: z, len: D };
  else if (E) face = { dx: 1, dz: 0, t: z, len: D };

  // Storeys and walls up to the roof slab at r-1.
  for (let y = gr + 1; y <= r - 2; y++) {
    const rel = y - gr;

    // Floor plates at every storey line.
    if (rel % 4 === 0) { set(x, y, z, "smooth_stone"); continue; }

    if (!edge) {
      // Interior columns on a 4-block grid carry the floor plates.
      if (x % 4 === 2 && z % 4 === 2) set(x, y, z, "smooth_quartz");
      continue;
    }

    const corner = face.t === 0 || face.t === face.len - 1;
    const pier = corner || face.t % 3 === 0;

    // Spandrel band under each window row.
    if (rel % 4 === 3) {
      set(x, y, z, rel < 4 ? "stone_bricks" : "white_concrete");
      continue;
    }

    // Piers / mullions; ground storey gets a stone base course.
    if (pier) {
      set(x, y, z, rel < 4 ? "stone_bricks" : "smooth_quartz");
      continue;
    }

    // Window glass.
    set(x, y, z, "light_blue_stained_glass");

    // Warm light behind some windows, standing on the floor plate.
    if (rel % 4 === 1 && face.t % 6 === 2) {
      const ix = x - face.dx, iz = z - face.dz;
      const ic = at(ix, iz);
      if (ic && ic.g === gr && !(ix % 4 === 2 && iz % 4 === 2)) {
        set(ix, y, iz, "glowstone");
      }
    }
  }

  // Roof slab, parapet on the perimeter, small roof plant.
  set(x, r - 1, z, "smooth_stone");
  if (edge) {
    set(x, r, z, "stone_brick_wall");
  } else if (x >= 4 && x <= 6 && z >= 9 && z <= 10) {
    set(x, r, z, "light_gray_concrete");
    set(x, r + 1, z, "light_gray_concrete");
  }
}

// ---- Entrance on the street (z = 0) face: double doors, stone surround ----
for (const x of [7, 8]) {
  const c = at(x, 0);
  if (!c) continue;
  const gr = c.g;
  const hinge = x === 7 ? "left" : "right";
  set(x, gr + 1, 0, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  set(x, gr + 2, 0, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  set(x, gr + 3, 0, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
