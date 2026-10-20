import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540295627";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 26;
const LINE1 = 5;   // storey-1 / storey-2 floor line
const TOP = 10;    // top of storey-2 body; roof slab and cornice band
const PARAPET = 11;

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.max(0, Math.min(gr, 12)));
const at = (x, z) => G.get(`${x},${z}`);
const has = (x, z) => G.has(`${x},${z}`);

// Exterior faces of a footprint cell (missing neighbour => outward face)
function facesOf(x, z) {
  const f = [];
  if (!has(x + 1, z)) f.push("east");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  return f;
}

const OFFSET = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] };
const INWARD = { east: [-1, 0], west: [1, 0], north: [0, 1], south: [0, -1] };

const g = new Voxels([W, H, D]);

const ring = new Map();
for (const [x, z] of G.keys().map(k => k.split(",").map(Number))) {
  const f = facesOf(x, z);
  if (f.length) ring.set(`${x},${z}`, f);
}

// Pass 1: foundations, ground slab, interior floor and roof slabs
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const isRing = ring.has(key);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "gray_concrete");
  g.set(x, gr, z, isRing ? "stone_bricks" : "smooth_stone");

  if (gr < LINE1 && !isRing) g.set(x, LINE1, z, "smooth_stone");
  if (gr <= TOP && !isRing) g.set(x, TOP, z, "light_gray_concrete");
}

// Pass 2: exterior walls, openings, bands, cornice, parapet
for (const [key, faces] of ring) {
  const [x, z] = key.split(",").map(Number);
  const gr = G.get(key);
  if (gr > TOP) continue;

  const corner = faces.length >= 2;
  const primary = faces[0];
  const along = (primary === "east" || primary === "west") ? z : x;
  const pier = corner || along % 3 === 0;

  for (let y = gr + 1; y <= TOP; y++) {
    if (corner || pier) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    let id = "white_concrete";
    let props;
    if (y === LINE1 - 1) id = "smooth_stone";                 // storey-1 lintel
    else if (y < LINE1 - 1) {                                  // shopfront glass
      id = "glass_pane";
    } else if (y === LINE1) id = "smooth_stone";               // floor line
    else if (y >= 6 && y <= 8) id = "glass_pane";              // storey-2 windows
    else if (y === 9) id = "white_concrete";                   // head
    else if (y === TOP) id = "smooth_stone";                   // cornice band

    if (id === "glass_pane") {
      const alongX = primary === "north" || primary === "south";
      props = {
        north: alongX ? "false" : "true",
        south: alongX ? "false" : "true",
        east: alongX ? "true" : "false",
        west: alongX ? "true" : "false",
        waterlogged: "false",
      };
      if (alongX) { props.north = "false"; props.south = "false"; }
      else { props.east = "false"; props.west = "false"; }
    }
    g.set(x, y, z, id, props);
  }

  // Parapet cornice
  g.set(x, PARAPET, z, "smooth_stone");
}

// Pass 3: entrance on the north-facing run (fallback: any face), near footprint centre
{
  let cand = [...ring.entries()].filter(([k, f]) => f.includes("north") && !(f.length >= 2));
  let face = "north";
  if (!cand.length) { cand = [...ring.entries()].filter(([k, f]) => f.length === 1); face = null; }
  if (cand.length) {
    const mx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
    cand.sort((a, b) => {
      const ax = Number(a[0].split(",")[0]), bx = Number(b[0].split(",")[0]);
      return Math.abs(ax - mx) - Math.abs(bx - mx);
    });
    const [key, f] = cand[0];
    const [x, z] = key.split(",").map(Number);
    const gr = G.get(key);
    const dir = face || f[0];
    if (gr + 2 <= TOP) {
      g.set(x, gr + 1, z, "oak_door", { facing: dir, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "oak_door", { facing: dir, half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// Pass 4: rooftop mechanical units on interior roof
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (ring.has(key) || gr > TOP) continue;
  if (x % 5 === 2 && z % 5 === 2) g.set(x, PARAPET, z, "light_gray_concrete");
}

// Pass 5: warm lights behind some storey-2 windows
for (const [key, faces] of ring) {
  const [x, z] = key.split(",").map(Number);
  const gr = G.get(key);
  if (faces.length !== 1 || gr > 7) continue;
  const face = faces[0];
  const along = (face === "east" || face === "west") ? z : x;
  if (along % 3 === 0) continue;
  if ((x + z) % 4 !== 0) continue;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || ring.has(`${ix},${iz}`)) continue;
  g.set(ix, 7, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
