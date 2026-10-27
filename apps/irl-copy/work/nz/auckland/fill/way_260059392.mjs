// A 1980s-style office block on the Mt Eden / CBD ridge: basalt plinth and base course (Auckland's volcanic stone),
// a light-concrete frame with blue-tinted glazing, a stepped massing (7-storey core, 6-storey main body, 5-storey
// wings) and a recessed entrance. Storey lines sit on 6 + 4k, so every floor, setback and roof stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_260059392.cells.json`, "utf8"));
const g = new Voxels([47, 46, 34]);

// The footprint: each cell's ground (its third number) and the lidar roof above y 0 (its fourth).
const FP = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof }]));
const at = (x, z) => FP.get(`${x},${z}`);
const NB = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];
const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };

// Massing. The lidar roof is averaged over a 5 x 5 window, then snapped to three flat tiers.
const GROUND_LINE = 6;                                     // first floor: the highest ground under the footprint
const TOP = { core: 34, main: 30, wing: 26 };              // wings end in a 2-block parapet (lidar ~28)
for (const c of FP.values()) {
  let sum = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const o = at(c.x + dx, c.z + dz); if (o) { sum += o.roof; n++; } }
  const mean = sum / n;
  c.tier = mean >= 32 ? "core" : mean >= 29.5 ? "main" : "wing";
  c.top = TOP[c.tier];
  c.faces = NB.filter((d) => !at(c.x + d.dx, c.z + d.dz));  // exterior faces: the side of the footprint's outline
}

const MAT = {
  core: { pier: "white_concrete", glass: "cyan_stained_glass_pane" },
  main: { pier: "light_gray_concrete", glass: "light_blue_stained_glass_pane" },
  wing: { pier: "light_gray_concrete", glass: "light_blue_stained_glass_pane" },
};

// Solid volume from y 0 to each tier's top: stone foundation under the ground, a basalt plinth where the downhill
// side shows above it, light-concrete interior, and a gray roof membrane.
for (const c of FP.values()) {
  const ext = c.faces.length > 0;
  for (let y = 0; y < c.top; y++) {
    let b = "light_gray_concrete";
    if (y < c.ground) b = "stone";
    else if (ext && y < GROUND_LINE) b = "polished_basalt";
    else if (!ext && y === c.top - 1) b = "gray_concrete";
    g.set(c.x, y, c.z, b);
  }
  if (ext) {                                               // parapet on wings, a cornice course on the others
    if (c.tier === "wing") { g.set(c.x, 26, c.z, "smooth_stone"); g.set(c.x, 27, c.z, "smooth_stone"); }
    else g.set(c.x, c.top, c.z, "smooth_stone");
  }
}

// The entrance: the middle cell of the longest single-face run, facing the street on that side.
function pickEntrance() {
  let best = null;
  for (const d of NB) {
    const run = [...FP.values()].filter((c) => c.faces.length === 1 && c.faces[0] === d);
    if (!best || run.length > best.run.length) best = { d, run };
  }
  const u = (c) => (best.d.dx !== 0 ? c.z : c.x);
  best.run.sort((a, b) => u(a) - u(b));
  const c = best.run[Math.floor(best.run.length / 2)];
  return { c, d: best.d };
}
const ENTRY = pickEntrance();

// Facades: each exterior cell's storeys, four rows per storey: a floor line, two glazed rows, a spandrel.
// Piers every third cell along the face (corners always a pier). Each window has an air gap behind it.
const panes = [];
const glassAt = (x, y, z) => FP.has(`${x},${z}`) && g.get(x, y, z)?.block.includes("glass_pane");
for (const c of FP.values()) {
  if (!c.faces.length) continue;
  const m = MAT[c.tier];
  const corner = c.faces.length > 1;
  const d = c.faces[0];
  const u = d.dx !== 0 ? c.z : c.x;
  const pier = corner || u % 3 === 0;
  for (let F = GROUND_LINE, k = 0; F + 4 <= c.top; F += 4, k++) {
    for (let r = 0; r < 4; r++) {
      const y = F + r;
      if (r === 0) { g.set(c.x, y, c.z, k === 0 ? "polished_basalt" : "smooth_stone"); continue; }
      if (r === 3) { g.set(c.x, y, c.z, k === 0 ? "smooth_stone" : m.pier); continue; }
      if (pier) { g.set(c.x, y, c.z, k === 0 ? "polished_basalt" : m.pier); continue; }
      g.set(c.x, y, c.z, m.glass);
      const ix = c.x - d.dx, iz = c.z - d.dz;
      if (!FP.has(`${ix},${iz}`)) continue;
      g.set(ix, y, iz, "air");                                // the air gap behind the glass
      if (r === 1 && (c.x * 7 + c.z * 13 + y * 5) % 5 === 0) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      panes.push({ x: c.x, y, z: c.z, block: m.glass });
    }
  }
}

// The entrance: a door in the ground-floor shopfront, stone jambs and a lintel, a lobby light behind.
{
  const { c, d } = ENTRY;
  const side = d.dx !== 0 ? { dx: 0, dz: 1 } : { dx: 1, dz: 0 };
  const facing = OPPOSITE[d.name];
  g.set(c.x, 6, c.z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, 7, c.z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, 8, c.z, "smooth_stone");
  for (const s of [1, -1]) {
    const jx = c.x + s * side.dx, jz = c.z + s * side.dz;
    if (!FP.has(`${jx},${jz}`)) continue;
    for (const y of [7, 8]) g.set(jx, y, jz, "polished_basalt");
  }
  const ix = c.x - d.dx, iz = c.z - d.dz;
  if (FP.has(`${ix},${iz}`)) {
    g.set(ix, 6, iz, "air"); g.set(ix, 7, iz, "air");
    g.set(ix, 8, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof plant: 2 x 2 air-conditioning boxes on the main roof, and the core's lift overrun with a lightning rod.
for (const c of FP.values()) {
  if (c.faces.length || c.tier !== "main") continue;
  if (c.x % 7 !== 3 || c.z % 5 !== 2) continue;
  const patch = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => at(c.x + dx, c.z + dz));
  if (!patch.every((p) => p && !p.faces?.length && p.tier === "main")) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (const y of [30, 31]) g.set(c.x + dx, y, c.z + dz, "light_gray_concrete");
}
{
  const core = [...FP.values()].filter((c) => c.tier === "core" && !c.faces.length);
  const cx = core.reduce((s, c) => s + c.x, 0) / core.length, cz = core.reduce((s, c) => s + c.z, 0) / core.length;
  const hub = core.reduce((best, c) => ((Math.hypot(c.x - cx, c.z - cz) < Math.hypot(best.x - cx, best.z - cz)) ? c : best));
  for (const c of core) if (Math.abs(c.x - hub.x) <= 1 && Math.abs(c.z - hub.z) <= 1) for (const y of [34, 35]) g.set(c.x, y, c.z, "light_gray_concrete");
  g.set(hub.x, 36, hub.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Glass panes connect to the neighbours they touch (panes, piers, slabs), as in the world.
for (const p of panes) {
  if (!glassAt(p.x, p.y, p.z)) continue;                       // a door or lintel replaced it
  const st = {};
  for (const d of NB) {
    const nb = g.get(p.x + d.dx, p.y, p.z + d.dz);
    st[d.name] = nb && !/lantern|door/.test(nb.block) ? "true" : "false";
  }
  g.set(p.x, p.y, p.z, p.block, st);
}

const out = g.save(`${DIR}/way_260059392.nbt`);
const tiers = { core: 0, main: 0, wing: 0 };
for (const c of FP.values()) tiers[c.tier]++;
console.log(`cells ${FP.size}, tiers ${JSON.stringify(tiers)}, entrance ${ENTRY.d.name} at (${ENTRY.c.x},${ENTRY.c.z}), blocks ${out.blocks}, palette ${out.palette}`);
