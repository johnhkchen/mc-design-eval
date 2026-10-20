import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw327712847";
const W = 73, H = 23, D = 61;

// Materials: a two-storey 1990s Taipei office HQ. Pale quartz-clad walls with
// granite piers for vertical rhythm, polished stone bands and cornice, blue-tinted
// glazing, and a glazed lobby under a granite canopy at the entrance.
const FOUND = "stone_bricks";
const WALL = "smooth_quartz";
const PIER = "polished_granite";
const BAND = "polished_andesite";
const BASE = "polished_granite";
const GLASS = "light_blue_stained_glass_pane";
const DOOR = "iron_door";
const ROOF = 11;     // roof deck (top surface sits about 11 blocks above lowest ground)
const PARAPET = 12;  // parapet course on the perimeter

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const k = x + "," + z;
  ground.set(k, Math.max(ground.get(k) ?? -1, gr | 0));
}
const has = (x, z) => ground.has(x + "," + z);
const G = (x, z) => ground.get(x + "," + z);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward normal of a footprint cell, or null if interior.
const NORMALS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
function perim(x, z) {
  for (const [dx, dz, name] of NORMALS) {
    if (!has(x + dx, z + dz)) return { dx, dz, name };
  }
  return null;
}

// Glass panes connect along the wall they sit in.
const paneProps = (name) =>
  name === "north" || name === "south"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Window rows: two storeys of 3 glass rows each, rows 2-4 and 7-9.
const WINDOW_ROWS = new Set([2, 3, 4, 7, 8, 9]);

// Entrance face: prefer the north (min z) face, then fall back to the others.
let doorCell = null;
{
  const cellList = ground.keys().map((k) => k.split(",").map(Number));
  for (const f of ["north", "south", "west", "east"]) {
    const cands = [];
    for (const [x, z] of cellList) {
      const p = perim(x, z);
      if (p && p.name === f) cands.push({ x, z, along: f === "north" || f === "south" ? x : z });
    }
    if (cands.length) {
      cands.sort((a, b) => a.along - b.along);
      doorCell = { ...cands[Math.floor(cands.length / 2)], name: f };
      break;
    }
  }
}

// Along-wall offset vector for a face.
const alongVec = (name) => (name === "north" || name === "south" ? [1, 0] : [0, 1]);

// 1. Foundations, floor slabs, roof deck, and shell walls.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  // Solid foundation from y=0 up to this cell's ground.
  for (let y = 0; y <= gr && y < H; y++) set(x, y, z, FOUND);

  const p = perim(x, z);

  // Interior floor slabs at the storey lines.
  for (const y of [5, 10]) if (y > gr) set(x, y, z, BAND);
  // Roof deck.
  if (ROOF > gr) set(x, ROOF, z, BAND);

  if (!p) continue;

  const along = p.name === "north" || p.name === "south" ? x : z;

  for (let y = gr + 1; y <= PARAPET && y < H; y++) {
    let id = null, props = null;
    if (y === gr + 1) id = BASE;                 // granite plinth course
    else if (y === ROOF) id = BAND;              // cornice
    else if (y === PARAPET) id = WALL;           // parapet
    else if (y === 5 || y === 10) id = BAND;     // storey lines
    else if (y === 6) id = WALL;                 // spandrel
    else if (WINDOW_ROWS.has(y)) {
      if (along % 4 === 0) id = PIER;            // vertical granite piers
      else { id = GLASS; props = paneProps(p.name); }
    } else id = WALL;
    if (id) set(x, y, z, id, props);
  }
}

// 2. Entrance: glazed lobby bay, iron doors, granite surround and canopy.
if (doorCell) {
  const { x, z, name } = doorCell;
  const gr = G(x, z);
  const [ax, az] = alongVec(name);
  const alongPos = name === "north" || name === "south" ? x : z;

  // Glazed lobby: the door cell and its two neighbours on the same face,
  // glass from the plinth up to the lintel (rows gr+2..gr+3).
  for (const s of [-2, -1, 0, 1, 2]) {
    const px = x + ax * s;
    const pz = z + az * s;
    if (!has(px, pz)) continue;
    const pp = perim(px, pz);
    if (!pp || pp.name !== name) continue;
    const pg = G(px, pz);
    for (let y = gr + 2; y <= gr + 3 && y < H; y++) {
      if (y <= pg) continue;
      if (s === 0) continue; // door column handled below
      set(px, y, pz, GLASS, paneProps(name));
    }
    // Granite canopy course over the entrance.
    if (Math.abs(s) <= 2 && gr + 4 > pg) set(px, gr + 4, pz, BASE);
  }

  // Door in the centre.
  const lower = { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" };
  const upper = { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" };
  set(x, gr + 1, z, DOOR, lower);
  set(x, gr + 2, z, DOOR, upper);
  // Transom and lintel over the door.
  set(x, gr + 3, z, WALL);
  set(x, gr + 4, z, BASE);

  // Granite pillars either side of the lobby.
  for (const s of [-3, 3]) {
    const px = x + ax * s;
    const pz = z + az * s;
    if (!has(px, pz)) continue;
    const pg = G(px, pz);
    for (let y = pg + 1; y <= gr + 4 && y < H; y++) set(px, y, pz, BASE);
  }
  void alongPos;
}

// 3. Warm lights: lanterns hanging from the storey slabs, behind selected windows.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const p = perim(x, z);
  if (!p) continue;
  const along = p.name === "north" || p.name === "south" ? x : z;
  if (along % 8 !== 2) continue;
  if (doorCell && p.name === doorCell.name) {
    const da = p.name === "north" || p.name === "south" ? doorCell.x : doorCell.z;
    if (Math.abs(along - da) <= 3) continue;
  }
  const ix = x - p.dx, iz = z - p.dz;
  if (!has(ix, iz) || perim(ix, iz)) continue;
  const ig = G(ix, iz);
  if (4 > ig) set(ix, 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
  if (9 > ig) set(ix, 9, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// 4. Roof equipment: a central plant room, scattered AC units, and a telecom mast.
let cx = 0, cz = 0, n = 0;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  cx += x; cz += z; n++;
}
cx /= n; cz /= n;

for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (perim(x, z)) continue;
  const gr = G(x, z);
  if (Math.abs(x - cx) < W * 0.15 && Math.abs(z - cz) < D * 0.15) {
    for (let y = PARAPET; y <= PARAPET + 1; y++) if (y > gr) set(x, y, z, "light_gray_concrete");
  } else if (x % 9 === 4 && z % 9 === 4) {
    if (PARAPET > gr) set(x, PARAPET, z, "smooth_stone");
  }
}

// Telecom mast on the interior cell nearest the centroid.
{
  let best = null, bd = Infinity;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (perim(x, z)) continue;
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d < bd) { bd = d; best = [x, z]; }
  }
  if (best) {
    const [mx, mz] = best;
    const gr = G(mx, mz);
    for (let y = PARAPET; y <= 19; y++) if (y > gr) set(mx, y, mz, "iron_bars", { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" });
    set(mx, 20, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
