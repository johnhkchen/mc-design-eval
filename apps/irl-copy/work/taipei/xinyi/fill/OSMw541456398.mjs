import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456398";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

// Outward directions (z grows south, x grows east)
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

function faces(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!inside(x + dx, z + dz)) out.push(name);
  }
  return out;
}

// Safe setter: bounds check, optional props
function setb(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Glass pane props so panes join along the facade they sit on
function pane(face) {
  const ns = face === "west" || face === "east"; // runs north-south
  return {
    north: ns ? "true" : "false",
    south: ns ? "true" : "false",
    east: ns ? "false" : "true",
    west: ns ? "false" : "true",
    waterlogged: "false",
  };
}

// Classify perimeter cells by facade and index along that facade
const facade = {}; // face -> [{x,z,gr,i}]
const perimeter = [];
for (const [x, z, gr] of cells) {
  const fs = faces(x, z);
  if (fs.length === 0) continue;
  const f = fs[0];
  const i = (f === "north" || f === "south") ? x : z;
  const rec = { x, z, gr, i, f, fs };
  perimeter.push(rec);
  (facade[f] ||= []).push(rec);
}

// Main entrance: middle of the south face (or the largest facade if none)
let doorCell = null;
let doorFace = "south";
if (!facade.south || facade.south.length === 0) {
  doorFace = Object.keys(facade).sort((a, b) => facade[b].length - facade[a].length)[0];
}
if (facade[doorFace]) {
  const list = [...facade[doorFace]].sort((a, b) => a.i - b.i);
  doorCell = list[Math.floor(list.length / 2)];
}

// Roof mast on the central interior cell
let mastCell = null;
{
  const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  let best = null;
  for (const [x, z, gr] of cells) {
    if (faces(x, z).length) continue;
    const d = Math.hypot(x - cx, z - cz);
    if (!best || d < best.d) best = { x, z, gr, d };
  }
  if (best) mastCell = best;
}

// Build foundations, interiors (floor slabs only), and perimeter facades
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) setb(x, y, z, "stone_bricks");

  const fs = faces(x, z);

  if (fs.length === 0) {
    // Interior: floor slabs per storey, air between
    for (const y of [gr, gr + 5, gr + 10]) setb(x, y, z, "gray_concrete");
    // Roof plant: small AC block units on a grid
    if (x % 6 === 3 && z % 6 === 3) {
      setb(x, gr + 11, z, "iron_block");
      setb(x, gr + 12, z, "light_gray_concrete");
    }
    if (mastCell && x === mastCell.x && z === mastCell.z) {
      for (let y = gr + 11; y <= gr + 14; y++) setb(x, y, z, "iron_bars");
      setb(x, gr + 15, z, "lightning_rod");
    }
    continue;
  }

  // Perimeter cell
  const f = fs[0];
  const [dx, dz] = DIRS[f];
  const along = (f === "north" || f === "south") ? x : z;
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;

  // Base course
  setb(x, gr, z, "stone_bricks");

  // Ground floor shopfront: glass with white pillars, door at centre
  if (isDoor) {
    setb(x, gr + 1, z, "dark_oak_door", {
      facing: doorFace, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    setb(x, gr + 2, z, "dark_oak_door", {
      facing: doorFace, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    setb(x, gr + 3, z, "smooth_stone"); // lintel over door
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (along % 3 === 0) setb(x, y, z, "white_concrete");
      else setb(x, y, z, "glass_pane", pane(f));
    }
  }

  // Ground-floor fascia band and storey line
  setb(x, gr + 4, z, "stone_bricks");
  setb(x, gr + 5, z, "smooth_stone");

  // Upper floor window grid with warm lights behind some glass
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (along % 3 === 0) {
      setb(x, y, z, "white_concrete");
    } else {
      setb(x, y, z, "glass_pane", pane(f));
    }
  }
  if (along % 6 === 4) {
    const nx = x - dx, nz = z - dz; // inward neighbour behind the glass
    if (inside(nx, nz) && gAt(nx, nz) === gr && faces(nx, nz).length === 0) {
      setb(nx, gr + 7, nz, "glowstone");
    }
  }

  // Spandrel, cornice, parapet
  setb(x, gr + 9, z, "white_concrete");
  setb(x, gr + 10, z, "smooth_stone");
  setb(x, gr + 11, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
