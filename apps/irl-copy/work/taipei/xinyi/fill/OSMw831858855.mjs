import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831858855";
const W = 32, H = 23, D = 19;
const ROOF_Y = 11;      // top of parapet
const CORNICE_Y = 10;   // cornice course / roof deck level

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

// Outward directions: north is -z, south +z, east +x, west -x.
const FACES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 },
  { name: "west", dx: -1, dz: 0 },
];

// Perimeter cells: any cell with a 4-neighbour outside the footprint.
const perim = new Map();   // "x,z" -> { x, z, gr, face, idx, dx, dz }
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const gr = gAt(x, z);
  let f = null;
  for (const F of FACES) {
    if (!inFp(x + F.dx, z + F.dz)) { f = F; break; }
  }
  if (!f) continue;
  const idx = (f.name === "north" || f.name === "south") ? x : z;
  perim.set(`${x},${z}`, { x, z, gr, face: f.name, idx, dx: f.dx, dz: f.dz });
}

// Front (street) face: the facade with the most perimeter cells.
const faceCount = {};
for (const p of perim.values()) faceCount[p.face] = (faceCount[p.face] || 0) + 1;
const front = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "south";

// Entrance centred on the front face.
const frontIdx = [...perim.values()].filter(p => p.face === front).map(p => p.idx).sort((a, b) => a - b);
const entIdx = frontIdx.length ? frontIdx[Math.floor(frontIdx.length / 2)] : -999;
const isTrio = p => p.face === front && Math.abs(p.idx - entIdx) <= 1;
const isDoor = p => p.face === front && p.idx === entIdx;

// Pane connection props: panes join along the facade, not through it.
const pane = face => (face === "north" || face === "south")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1) Foundations: solid from y 0 up to each cell's ground.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2) Facade on each perimeter cell, bottom to parapet.
for (const p of perim.values()) {
  const { x, z, gr, face, idx } = p;
  const pier = idx % 3 === 0;

  // Entrance door: lower at ground, upper above.
  if (isDoor(p) && gr <= 2) {
    g.set(x, gr, z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  for (let y = gr; y <= ROOF_Y; y++) {
    const doorHere = isDoor(p) && gr <= 2 && (y === gr || y === gr + 1);
    if (doorHere) continue;

    if (y === gr) {
      g.set(x, y, z, "stone_bricks");                       // base course
    } else if (y <= 3) {
      if (pier) g.set(x, y, z, "smooth_quartz");
      else g.set(x, y, z, "glass_pane", pane(face));        // shopfront glass
    } else if (y === 4) {
      g.set(x, y, z, isTrio(p) ? "black_concrete" : "gray_concrete"); // transom / entrance awning
    } else if (y === 5) {
      g.set(x, y, z, "smooth_quartz");                      // storey line
    } else if (y <= 8) {
      if (pier) g.set(x, y, z, "smooth_quartz");
      else if (y === 7) g.set(x, y, z, "light_blue_stained_glass_pane", pane(face));
      else g.set(x, y, z, "gray_concrete");                 // sill / head frames
    } else if (y === 9) {
      g.set(x, y, z, "white_concrete");                     // spandrel
    } else if (y === CORNICE_Y) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // cornice
    } else {
      g.set(x, y, z, "smooth_quartz");                      // parapet
    }
  }
}

// 3) Interior: floor slabs per storey, roof deck, warm lights behind glass. Air elsewhere.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (perim.has(key)) continue;

  if (gr <= 4) g.set(x, gr, z, "smooth_stone");        // ground floor
  if (gr <= 5) g.set(x, 5, z, "smooth_stone");         // second floor slab
  if (gr <= CORNICE_Y) g.set(x, CORNICE_Y, z, "light_gray_concrete"); // roof deck

  // Roof plant boxes on a regular grid.
  if (gr <= CORNICE_Y && x % 9 === 4 && z % 6 === 3) {
    g.set(x, 11, z, "gray_concrete");
    g.set(x, 12, z, "light_gray_concrete");
  }
}

// Warm light: glowstone inside behind selected windows.
for (const p of perim.values()) {
  if (isDoor(p) || isTrio(p)) continue;
  const inX = p.x - p.dx, inZ = p.z - p.dz;
  if (!inFp(inX, inZ) || perim.has(`${inX},${inZ}`)) continue;
  const inGr = gAt(inX, inZ);
  if (p.idx % 3 === 0) continue; // pier

  // Ground-floor shopfront light.
  if (p.gr < 2 && p.idx % 3 === 2 && inGr <= 2) {
    g.set(inX, 2, inZ, "glowstone");
  }
  // Upper-storey light behind some windows.
  if (p.idx % 6 === 1 && inGr <= 6 && p.gr <= 7) {
    g.set(inX, 7, inZ, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
