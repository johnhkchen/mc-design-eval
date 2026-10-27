// Auckland, Maungawhau view: a five-storey mid-century office block (1960s-70s concrete frame, cream piers,
// dark teal glass bands, a stone plinth and a parapet). The lidar roof is rounded to whole storeys, so the
// roof tiers become lower wings and setbacks; the foundation runs from y 0 up to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241888.cells.json`, "utf8"));
const STOREY = 4;
const MAIN_ROOF = 21;
const vox = new Voxels([38, 34, 40]);

const OUT = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const OUT_FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// one column per footprint cell: its ground, and its roof tier (lidar roof rounded to whole storeys, 4n+1 so
// the cornice course sits on a storey line), at least one storey above its ground
const tier = new Map();
for (const [x, z, , roof] of cells) tier.set(`${x},${z}`, Math.min(5, Math.max(1, Math.round((roof - 1) / STOREY))));
// lidar noise makes ragged tier edges: one majority pass over each cell and its footprint neighbours
const smooth = new Map();
for (const [key, n] of tier) {
  const [x, z] = key.split(",").map(Number), votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const m = tier.get(`${x + dx},${z + dz}`); if (m !== undefined) votes.set(m, (votes.get(m) || 0) + 1);
  }
  const best = [...votes].sort((a, b) => b[1] - a[1] || (a[0] === n ? -1 : b[0] === n ? 1 : 0))[0][0];
  smooth.set(key, best);
}
const col = new Map();
for (const [x, z, ground] of cells) {
  const rt = Math.max(STOREY * smooth.get(`${x},${z}`) + 1, ground + STOREY + 1);
  col.set(`${x},${z}`, { x, z, g: ground, rt });
}
const at = (x, z) => col.get(`${x},${z}`);

for (const c of col.values()) {
  // global storey lines above this cell's ground, each leaving at least 3 rows for its ground storey
  c.lines = [];
  for (let y = STOREY; y < c.rt - 1; y += STOREY) if (y >= c.g + 3) c.lines.push(y);
  // exposed sides: open air beyond the footprint, or a neighbour whose roof is lower (the wall above it)
  c.exp = OUT.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.rt < c.rt; });
  c.shell = c.exp.length > 0;
}

// the facade run: a face normal along x runs along z (panes join north-south), and the reverse
function faceOf(c) {
  const nx = c.exp.some(([dx]) => dx), nz = c.exp.some(([, dz]) => dz);
  if (nx && nz) return null;                                   // corner: always a pier
  const out = c.exp[0];
  return nx ? { out, idx: c.z, run: ["north", "south"] } : { out, idx: c.x, run: ["east", "west"] };
}
const paneState = (run) => Object.fromEntries(["north", "east", "south", "west"].map((d) => [d, run.includes(d) ? "true" : "false"]));

// the entrance: a perimeter cell on the lowest ground (the street side), nearest the middle of its face
const perimeter = [...col.values()].filter((c) => c.shell && c.exp.some(([dx, dz]) => !at(c.x + dx, c.z + dz)));
const minG = Math.min(...perimeter.map((c) => c.g));
let door = null, doorDist = Infinity;
for (const c of perimeter) {
  const f = faceOf(c); if (!f || c.g !== minG) continue;
  const mid = f.run[0] === "north" ? 19.5 : 18.5;
  const d = Math.abs(f.idx - mid);
  if (d < doorDist) { door = c; doorDist = d; }
}

for (const c of col.values()) {
  for (let y = 0; y < c.g; y++) vox.set(c.x, y, c.z, "stone_bricks");        // foundation to the ground
  if (!c.shell) {                                                            // no interiors: floor slabs and a roof slab
    for (const y of c.lines) vox.set(c.x, y, c.z, "light_gray_concrete");
    vox.set(c.x, c.rt - 1, c.z, "gray_concrete");
    continue;
  }
  const f = faceOf(c);
  const bases = [c.g, ...c.lines], ends = [...c.lines, c.rt - 1];
  bases.forEach((b, k) => {
    const e = ends[k];
    for (let y = b; y < e; y++) {
      let block = "light_gray_concrete", state, glass = false;
      if (y === b && b === c.g) block = "stone_bricks";                     // base course
      else if (y === b || y === e - 1) block = "light_gray_concrete";       // spandrel and transom
      else if (!f || f.idx % 4 === 0) block = "smooth_quartz";              // pier
      else {
        glass = true;
        block = b === c.g ? "glass_pane" : "cyan_stained_glass_pane";
        state = paneState(f.run);
      }
      if (door && c === door && (y === c.g + 1 || y === c.g + 2)) {
        block = "oak_door";
        state = { facing: OUT_FACING[`${f.out}`], half: y === c.g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      }
      vox.set(c.x, y, c.z, block, state);
    }
  });
  vox.set(c.x, c.rt - 1, c.z, "stone_bricks");                             // cornice
  vox.set(c.x, c.rt, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // parapet cap
}

// warm light: glowstone standing on a storey's floor just behind some upper-storey windows
let lights = 0;
for (const c of col.values()) {
  if (!c.shell) continue;
  const f = faceOf(c); if (!f) continue;
  for (const b of c.lines) {
    const y = b + 1;
    if (y >= c.rt - 1 || (f.idx % 4 === 0) || (c === door)) continue;
    if ((c.x * 7 + c.z * 13 + b) % 5 !== 0) continue;
    const ix = c.x - f.out[0], iz = c.z - f.out[1], inner = at(ix, iz);
    if (!inner || inner.shell || inner.rt <= y) continue;
    if (!vox.val(ix, b, iz) || vox.val(ix, y, iz)) continue;
    vox.set(ix, y, iz, "glowstone"); lights++;
  }
}

// roof: a plant room on the main tier (solid, so no empty course under it), and small AC units on the lower wings
for (const c of col.values()) {
  if (c.shell) continue;
  const inPlant = c.rt === MAIN_ROOF && c.x >= 14 && c.x <= 23 && c.z >= 15 && c.z <= 24;
  if (inPlant) {
    const ring = c.x === 14 || c.x === 23 || c.z === 15 || c.z === 24;
    for (let y = MAIN_ROOF; y <= MAIN_ROOF + 2; y++) {
      const window = ring && y === MAIN_ROOF + 1 && (c.x + c.z) % 2 === 0;
      vox.set(c.x, y, c.z, window ? "cyan_stained_glass" : "smooth_quartz");
    }
    vox.set(c.x, MAIN_ROOF + 3, c.z, "gray_concrete");
  } else if (c.rt < MAIN_ROOF && (c.x * 3 + c.z * 5) % 11 === 0) {
    vox.set(c.x, c.rt, c.z, "iron_block");
  } else if (c.rt === MAIN_ROOF && (c.x * 3 + c.z * 5) % 23 === 0) {
    vox.set(c.x, MAIN_ROOF, c.z, "iron_block");
  }
}

const stats = vox.save(`${DIR}/way_332241888.nbt`);
console.log(JSON.stringify({ cells: col.size, shell: [...col.values()].filter((c) => c.shell).length, door: door && [door.x, door.z], lights, ...stats }));
