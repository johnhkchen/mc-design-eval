// SEA1270141940: Pacific Science Center campus support building (1962). Modernist institutional block:
// stone base course, four storeys of white concrete with quartz fins, glazed bays and spandrels, a recessed
// covered entry, a dark deepslate parapet, and a mechanical penthouse with louvres and HVAC boxes on the roof.
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "SEA1270141940";
const BOX = [289, 240, 306, 260];
const W = BOX[2] - BOX[0] + 1, D = BOX[3] - BOX[1] + 1;   // 18 x 21
const HEIGHT = 18, HMAX = 24;
const fp = [[295,240],[296,240],[295,241],[296,241],[297,241],[294,242],[295,242],[296,242],[297,242],[294,243],[295,243],[296,243],[297,243],[298,243],[293,244],[294,244],[295,244],[296,244],[297,244],[298,244],[293,245],[294,245],[295,245],[296,245],[297,245],[298,245],[299,245],[292,246],[293,246],[294,246],[295,246],[296,246],[297,246],[298,246],[299,246],[300,246],[292,247],[293,247],[294,247],[295,247],[296,247],[297,247],[298,247],[299,247],[300,247],[291,248],[292,248],[293,248],[294,248],[295,248],[296,248],[297,248],[298,248],[299,248],[300,248],[301,248],[291,249],[292,249],[293,249],[294,249],[295,249],[296,249],[297,249],[298,249],[299,249],[300,249],[301,249],[302,249],[290,250],[291,250],[292,250],[293,250],[294,250],[295,250],[296,250],[297,250],[298,250],[299,250],[300,250],[301,250],[302,250],[290,251],[291,251],[292,251],[293,251],[294,251],[295,251],[296,251],[297,251],[298,251],[299,251],[300,251],[301,251],[302,251],[303,251],[289,252],[290,252],[291,252],[292,252],[293,252],[294,252],[295,252],[296,252],[297,252],[298,252],[299,252],[300,252],[301,252],[302,252],[303,252],[304,252],[289,253],[290,253],[291,253],[292,253],[293,253],[294,253],[295,253],[296,253],[297,253],[298,253],[299,253],[300,253],[301,253],[302,253],[303,253],[304,253],[290,254],[291,254],[292,254],[293,254],[294,254],[295,254],[296,254],[297,254],[298,254],[299,254],[300,254],[301,254],[302,254],[303,254],[304,254],[305,254],[292,255],[293,255],[294,255],[295,255],[296,255],[297,255],[298,255],[299,255],[300,255],[301,255],[302,255],[303,255],[304,255],[305,255],[306,255],[294,256],[295,256],[296,256],[297,256],[298,256],[299,256],[300,256],[301,256],[302,256],[303,256],[304,256],[305,256],[296,257],[297,257],[298,257],[299,257],[300,257],[301,257],[302,257],[303,257],[304,257],[305,257],[298,258],[299,258],[300,258],[301,258],[302,258],[303,258],[304,258],[300,259],[301,259],[302,259],[303,259],[304,259],[302,260],[303,260]];

const inF = new Set(fp.map(([x, z]) => `${x - BOX[0]},${z - BOX[1]}`));
const F = fp.map(([x, z]) => [x - BOX[0], z - BOX[1]]);
const has = (x, z) => inF.has(`${x},${z}`);
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const ring = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
const outward = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));   // exterior faces of a ring cell

// Distance from the outside (ring = 1), for the penthouse and roof plant placement.
const dist = new Map();
const queue = [];
for (const [x, z] of F) if (ring(x, z)) { dist.set(`${x},${z}`, 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i]; const d = dist.get(`${x},${z}`);
  for (const [dx, dz] of DIRS) { const k = `${x + dx},${z + dz}`; if (has(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); } }
}
const dOf = (x, z) => dist.get(`${x},${z}`) ?? 0;

const g = new Voxels([W, HMAX, D]);

// Foundation and stone base course: solid under the whole footprint, y 0-1.
for (const [x, z] of F) { g.set(x, 0, z, "stone_bricks"); g.set(x, 1, z, "stone_bricks"); }

// Main entrance: the exterior run of three ring cells, same outward face, with the largest run; south preferred.
let door = null;
const cands = F.filter(([x, z]) => ring(x, z)).flatMap(([x, z]) =>
  outward(x, z).map(([dx, dz, name]) => ({ x, z, dx, dz, name })));
for (const c of cands) {
  const wx = c.dz !== 0 ? 1 : 0, wz = c.dx !== 0 ? 1 : 0;  // wall direction along the face
  const n = [-1, 1].filter((s) => cands.some((o) => o.x === c.x + s * wx && o.z === c.z + s * wz && o.name === c.name)).length;
  const score = n * 100 + (c.name === "south" ? 50 : 0) - Math.abs(c.x - 8);
  if (!door || score > door.score) door = { ...c, wx, wz, score };
}
const bay = [-1, 0, 1].map((s) => [door.x + s * door.wx, door.z + s * door.wz]).filter(([x, z]) => s_ok(x, z, door.name));
function s_ok(x, z, name) { return x === door.x && z === door.z || cands.some((o) => o.x === x && o.z === z && o.name === name); }
const bayKey = new Set(bay.map(([x, z]) => `${x},${z}`));
const behind = [door.x - door.dx, door.z - door.dz];
const bayFaceDir = door.name;

// Storeys: floor line at b (y 2, 6, 10, 14), glazing b+1..b+2, spandrel b+3 (except y 2 base).
const STOREYS = [2, 6, 10, 14];
const fin = (x, z) => (x + z) % 4 === 0;
const reveal = (x, z) => (x + z) % 4 === 3;
for (const b of STOREYS) {
  for (const [x, z] of F) {
    const edge = ring(x, z);
    // Floor slab across the whole plate at the floor line.
    g.set(x, b, z, b === 2 && edge ? "stone_bricks" : "smooth_quartz");
    if (!edge) continue;
    if (bayKey.has(`${x},${z}`) && b === 2) continue;   // entry bay handled below
    for (let y = b + 1; y <= b + 3; y++) {
      if (y > 17) break;
      if (fin(x, z)) g.set(x, y, z, "quartz_pillar", { axis: "y" });
      else if (reveal(x, z)) g.set(x, y, z, "white_concrete");
      else if (y === b + 3) g.set(x, y, z, "white_concrete");     // spandrel
      else g.set(x, y, z, "light_blue_stained_glass");               // glazing, blue-grey
    }
  }
}
// Base course cap ring at y=2 that is not a floor line on the entry bay: stone, already set above.
// Fins continue up the full height of the building (quartz pillars), also through the spandrels.
for (const [x, z] of F) if (ring(x, z) && !bayKey.has(`${x},${z}`)) {
  for (let y = 3; y <= 17; y++) if (fin(x, z)) g.set(x, y, z, "quartz_pillar", { axis: "y" });
}

// Covered entry: side columns, a flat canopy over the door, a light blue sign band, and the door.
for (const [x, z] of bay) {
  if (x === door.x && z === door.z) continue;
  g.set(x, 2, z, "stone_bricks");
  g.set(x, 3, z, "quartz_pillar", { axis: "y" });
  g.set(x, 4, z, "smooth_quartz");                          // canopy
  g.set(x, 5, z, "light_blue_concrete");                   // sign band
}
g.set(door.x, 4, door.z, "smooth_quartz");                 // canopy over the door
g.set(door.x, 5, door.z, "light_blue_concrete");
g.set(behind[0], 4, behind[1], "smooth_quartz");           // canopy reaches inside
g.set(behind[0], 2, behind[1], "smooth_quartz");           // interior floor behind the door
const dstate = (half) => ({ facing: bayFaceDir, half, hinge: "left", open: "false", powered: "false" });
g.set(door.x, 2, door.z, "oak_door", dstate("lower"));
g.set(door.x, 3, door.z, "oak_door", dstate("upper"));

// Roof deck and parapet: smooth stone roof, dark deepslate parapet thin ring at y 18-19.
for (const [x, z] of F) {
  if (ring(x, z)) { g.set(x, 18, z, "deepslate_tiles"); g.set(x, 19, z, "deepslate_tiles"); }
  else g.set(x, 18, z, "smooth_stone");
}

// Mechanical penthouse: the deep core of the plate, walls y 19-21 with louvres, cap at y 22.
const P = F.filter(([x, z]) => dOf(x, z) >= 5);
const pCore = new Set(P.map(([x, z]) => `${x},${z}`));
const pRing = (x, z) => [[0,-1],[0,1],[1,0],[-1,0]].some(([dx, dz]) => !pCore.has(`${x + dx},${z + dz}`));
for (const [x, z] of P) {
  for (let y = 19; y <= 21; y++) {
    if (pRing(x, z)) {
      if (y === 20 && (x + z) % 2 === 0) g.set(x, y, z, "iron_bars");   // louvres
      else g.set(x, y, z, "white_concrete");
    }
  }
  g.set(x, 22, z, "smooth_stone");
}

// Roof plant: two HVAC boxes on the roof field, outside the penthouse, one-high light grey with a cap.
const plant = F.filter(([x, z]) => dOf(x, z) >= 2 && dOf(x, z) <= 3 && !pCore.has(`${x},${z}`));
const pickBox = (cells) => {
  for (const [x, z] of cells) {
    const pair = [[x + 1, z], [x, z + 1]].find(([a, b]) => cells.some(([p, q]) => p === a && q === b));
    if (pair) return [[x, z], pair];
  }
  return null;
};
const boxes = [];
let pool = plant.slice();
for (let n = 0; n < 2; n++) {
  const b = pickBox(pool);
  if (!b) break;
  boxes.push(b);
  pool = pool.filter(([x, z]) => !b.some(([p, q]) => p === x && q === z) && !b.some(([p, q]) => Math.abs(p - x) + Math.abs(q - z) <= 1));
}
for (const cells of boxes) for (const [x, z] of cells) {
  g.set(x, 19, z, "light_gray_concrete");
  g.set(x, 20, z, "light_gray_concrete");
  g.set(x, 21, z, "smooth_stone_slab", { type: "bottom" });
}

g.save(`/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/${ID}.nbt`);
console.log(JSON.stringify({ size: g.size, cells: F.length, door, penthouse: P.length, boxes: boxes.length, blocks: g.count(), palette: g.palette.length }));
