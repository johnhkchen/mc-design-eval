import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300024";
const W = 19, H = 23, D = 13;

// Record: no tags. Read as a 1960s-70s Taipei commercial block: two storeys over a
// shopfront ground floor, cream terracotta walls, grey concrete mullions, red sign band,
// quartz cornice and parapet, flat roof with plant boxes. Roof sits ~11 blocks above lowest ground.

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) =>
  Array.isArray(c)
    ? { x: c[0], z: c[1], g: Math.round(c[2]) }
    : { x: c.x, z: c.z, g: Math.round(c.ground ?? c.g ?? c.y ?? 0) }
);

const G = new Map();
for (const c of cells) G.set(`${c.x},${c.z}`, c.g);
const has = (x, z) => G.has(`${x},${z}`);
const gOf = (x, z) => G.get(`${x},${z}`);

const o = Math.min(...cells.map((c) => c.g)); // lowest ground = base of the building
const DIRS = [
  { dx: 0, dz: -1, f: "north" },
  { dx: 0, dz: 1, f: "south" },
  { dx: -1, dz: 0, f: "west" },
  { dx: 1, dz: 0, f: "east" },
];
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const exterior = (c) => DIRS.filter((d) => !has(c.x + d.dx, c.z + d.dz));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const pane = (d) =>
  d.f === "north" || d.f === "south"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pick the entrance: a single-exposed north-facing wall cell nearest the middle of that run.
const northCells = cells.filter((c) => {
  const e = exterior(c);
  return e.length === 1 && e[0].f === "north";
});
let entrance = null;
if (northCells.length) {
  const mid = northCells.reduce((s, c) => s + c.x, 0) / northCells.length;
  entrance = northCells.reduce((best, c) =>
    Math.abs(c.x - mid) < Math.abs(best.x - mid) ? c : best
  );
}
const entranceKey = entrance ? `${entrance.x},${entrance.z}` : null;

// Main pass
for (const c of cells) {
  const { x, z } = c;
  const gr = c.g;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exterior(c);
  if (ex.length === 0) {
    // Interior cell: floor slabs and roof deck only, air between
    if (o + 5 >= gr) put(x, o + 5, z, "light_gray_concrete");
    if (o + 10 >= gr) put(x, o + 10, z, "light_gray_concrete");
    if (o + 10 >= gr && x % 5 === 2 && z % 4 === 1) {
      put(x, o + 11, z, "gray_concrete");
      put(x, o + 12, z, "gray_concrete");
    }
    continue;
  }

  const corner = ex.length >= 2;
  const d = ex[0];
  const along = d.f === "north" || d.f === "south" ? x : z;

  for (let y = gr; y <= o + 10; y++) {
    let id, p;
    if (y === gr) {
      id = "polished_andesite"; // base course
    } else if (corner) {
      id = "white_terracotta"; // solid corner pillar
    } else if (y <= o + 3) {
      // shopfront: glass with dark mullions
      if (along % 3 === 0) id = "gray_concrete";
      else { id = "glass_pane"; p = pane(d); }
    } else if (y === o + 4) {
      id = "red_terracotta"; // sign band
    } else if (y === o + 5) {
      id = "light_gray_concrete"; // storey line
    } else if (y <= o + 8) {
      // upper windows
      if (along % 3 === 0) id = "gray_concrete";
      else { id = "glass_pane"; p = pane(d); }
    } else if (y === o + 9) {
      id = "white_terracotta"; // spandrel
    } else {
      id = "smooth_quartz"; // cornice
    }
    put(x, y, z, id, p);
  }

  // Parapet cap and roof deck (interior deck is placed above)
  put(x, o + 11, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  if (o + 10 >= gr) put(x, o + 10, z, "smooth_quartz");
}

// Entrance: iron doors on the north wall, lintel above
if (entrance) {
  const f = "north";
  const ex = exterior(entrance);
  const fd = ex.length ? ex[0].f : f;
  const gr = entrance.g;
  put(entrance.x, gr, entrance.z, "iron_door", {
    facing: fd, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(entrance.x, gr + 1, entrance.z, "iron_door", {
    facing: fd, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(entrance.x, gr + 2, entrance.z, "gray_concrete");
}

// Warm lights behind glass on window columns
for (const c of cells) {
  if (entranceKey === `${c.x},${c.z}`) continue;
  const ex = exterior(c);
  if (ex.length !== 1) continue;
  const d = ex[0];
  const along = d.f === "north" || d.f === "south" ? c.x : c.z;
  const ix = c.x - d.dx, iz = c.z - d.dz;
  if (!has(ix, iz)) continue;
  if (exterior({ x: ix, z: iz }).length) continue; // inward cell must be interior
  const ig = gOf(ix, iz);

  if (along % 6 === 1 && o + 7 >= ig && o + 7 <= o + 8) {
    put(ix, o + 7, iz, "glowstone");
  }
  if (along % 6 === 4 && c.g + 2 >= ig && c.g + 2 <= o + 3) {
    put(ix, c.g + 2, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
