// Way 433840771: a 1930s reinforced-concrete commercial block, four storeys over a basalt podium, cream plaster
// piers and string courses, glazed shopfronts on the ground floor, a flat roof with a parapet and a stair-lift
// overrun. Built on the footprint cells only; the storey lines are global (the podium takes the slope), so the
// bands run level round the building. The shell is one block thick with an air gap behind the glass and a floor
// slab per storey, so there are no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const ID = "way_433840771";
const [X, Y, Z] = [54, 32, 44];
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint and lidar roof. The roof reads 4-18 on a few edge cells (lidar misses on the parapet line); a 3x3
// median over footprint neighbours clears them to the flat 19 the rest of the roof settles to.
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => fp.has(`${x},${z}`);
const medianRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) v.push(fp.get(`${x + dx},${z + dz}`).roof);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const TOP = 19;                               // roof surface above y 0 (the lidar's flat tier)
const ROOF = 18, CORNICE = 17, BASE = 2;      // ROOF is the roof slab; the parapet sits in it
const BAND = [6, 10, 14];                     // storey lines (string courses, interior floor slabs)
const STOREY = [[3, 5], [7, 9], [11, 13], [15, 16]];   // window rows: shopfront, 2nd, 3rd, 4th storeys
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };   // inward step from each outward face
const FACING = { N: "south", S: "north", W: "east", E: "west" };  // a door faces into the building

const plan = new Map();
const put = (x, y, z, block, state = null, axis = null) => plan.set(`${x},${y},${z}`, { x, y, z, block, state, axis });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

const faces = (x, z) => ({ N: !inFp(x, z - 1), S: !inFp(x, z + 1), W: !inFp(x - 1, z), E: !inFp(x + 1, z) });
const outward = (f) => Object.keys(f).filter((k) => f[k]);
const glassRun = (r) => r % 4 === 1 || r % 4 === 2;     // 2 glass, 2 pier, on a 4-cell rhythm
const list = cells.map(([x, z, ground]) => ({ x, z, ground, f: faces(x, z) }));
const edge = list.filter((c) => outward(c.f).length > 0);
const single = edge.filter((c) => outward(c.f).length === 1);

// Podium and floors: rows 0-1 basalt, row 2 the ground-floor slab, interior slabs at the storey lines, roof slab.
for (const { x, z } of list) {
  put(x, 0, z, "stone_bricks"); put(x, 1, z, "stone_bricks"); put(x, BASE, z, "smooth_stone");
  for (const y of BAND) put(x, y, z, "smooth_stone");
  put(x, ROOF, z, "gray_concrete");
}

// Entrances: two on the ground-floor edge that stands at the ground datum (ground 3), south first.
const doorCands = single.filter((c) => c.ground >= 3 && glassRun(c.f.S || c.f.N ? c.x : c.z)).sort((a, b) => (b.f.S ? 1 : 0) - (a.f.S ? 1 : 0));
const doors = [];
for (const c of doorCands) if (doors.every((d) => Math.abs(d.x - c.x) + Math.abs(d.z - c.z) >= 6)) doors.push(c);
const doorSet = new Set(doors.map((d) => `${d.x},${d.z}`));

// The shell: one block thick, glass or pier on every storey, bands, cornice and parapet.
for (const c of edge) {
  const { x, z, f } = c, outs = outward(f), corner = outs.length > 1;
  const ax = f.N || f.S ? "x" : "z", r = ax === "x" ? x : z;
  const glass = !corner && glassRun(r);
  for (const y of BAND) put(x, y, z, "smooth_quartz");
  put(x, CORNICE, z, "smooth_quartz");
  put(x, ROOF, z, "smooth_stone");
  STOREY.forEach(([lo, hi], k) => {
    for (let y = lo; y <= hi; y++) {
      if (k === 0 && doorSet.has(`${x},${z}`)) {
        if (y <= 4) put(x, y, z, "iron_door", { facing: FACING[outs[0]], half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "smooth_quartz");                 // the lintel over the door
      } else if (glass) put(x, y, z, "glass_pane", null, ax);
      else if (k === 0) put(x, y, z, "stone_bricks");        // shopfront pier
      else put(x, y, z, "quartz_pillar", { axis: "y" });     // cream pier
    }
  });
}

// Warm light: lanterns standing on the storey floor behind some upper windows (the air gap stays).
for (const c of single) {
  const [dx, dz] = IN[outward(c.f)[0]];
  const ix = c.x + dx, iz = c.z + dz, r = c.f.N || c.f.S ? c.x : c.z;
  if (!glassRun(r) || !inFp(ix, iz)) continue;
  STOREY.slice(1).forEach(([lo], i) => {
    if (((c.x * 5 + c.z * 3 + (i + 1) * 7) % 4) !== 0 || at(ix, lo, iz)) return;
    put(ix, lo, iz, "lantern", { hanging: "false", waterlogged: "false" });
  });
}

// Stair-lift overrun: a 10 x 8 room on the roof core, glazed on a 3-cell rhythm, with a roof slab at row 21.
const coreCell = (x, z) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => inFp(x + dx, z + dz)));
const [RW, RD] = [10, 8];
const cx = list.reduce((s, c) => s + c.x, 0) / list.length, cz = list.reduce((s, c) => s + c.z, 0) / list.length;
let best = null;
for (let x0 = 0; x0 + RW <= X; x0++) for (let z0 = 0; z0 + RD <= Z; z0++) {
  let ok = true;
  for (let x = x0; x < x0 + RW && ok; x++) for (let z = z0; z < z0 + RD && ok; z++) ok = coreCell(x, z);
  if (!ok) continue;
  const d = Math.hypot(x0 + RW / 2 - cx, z0 + RD / 2 - cz);
  if (!best || d < best.d) best = { x0, z0, d };
}
const { x0, z0 } = best, x1 = x0 + RW - 1, z1 = z0 + RD - 1;
for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
  put(x, 21, z, "smooth_stone");
  const onNS = z === z0 || z === z1, onEW = x === x0 || x === x1;
  if (!onNS && !onEW) continue;
  for (const y of [TOP, TOP + 1]) {
    if (onNS && !onEW && (x - x0) % 3 === 1) put(x, y, z, "glass_pane", null, "x");
    else if (onEW && !onNS && (z - z0) % 3 === 1) put(x, y, z, "glass_pane", null, "z");
    else put(x, y, z, "quartz_block");
  }
}

// Two roof plant units on the core, clear of the overrun.
const plant = [];
for (let px = 0; px + 3 <= X && plant.length < 2; px++) for (let pz = 0; pz + 2 <= Z && plant.length < 2; pz++) {
  const cells3 = [];
  for (let x = px; x < px + 3; x++) for (let z = pz; z < pz + 2; z++) cells3.push([x, z]);
  const clear = cells3.every(([x, z]) => coreCell(x, z) && !(x >= x0 - 1 && x <= x1 + 1 && z >= z0 - 1 && z <= z1 + 1))
    && plant.every((p) => Math.abs(p[0] - px) > 4 || Math.abs(p[1] - pz) > 3);
  if (clear) { plant.push([px, pz]); for (const [x, z] of cells3) put(x, TOP, z, "iron_block"); }
}

// Panes connect to the wall run on either side (east-west on x-running walls, north-south on z-running ones).
for (const p of plan.values()) {
  if (p.block !== "glass_pane") continue;
  const sides = p.axis === "x" ? [["east", 1, 0], ["west", -1, 0]] : [["north", 0, -1], ["south", 0, 1]];
  p.state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const [d, dx, dz] of sides) p.state[d] = at(p.x + dx, p.y, p.z + dz) ? "true" : "false";
}

const g = new Voxels([X, Y, Z]);
for (const p of plan.values()) g.set(p.x, p.y, p.z, p.block, p.state ?? undefined);
const out = g.save(`${DIR}/${ID}.nbt`);

const roofOff = list.filter((c) => medianRoof(c.x, c.z) !== TOP).length;
const count = (b) => [...plan.values()].filter((p) => p.block === b).length;
console.log(JSON.stringify({
  footprint: list.length, roofNotTop: roofOff, doors: doors.map((d) => [d.x, d.z]), overrun: [x0, z0],
  plant, glass: count("glass_pane"), lanterns: count("lantern"), blocks: out.blocks, palette: out.palette,
}));
