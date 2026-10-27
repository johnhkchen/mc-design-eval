// Way 162091740 (Mt Eden / Eden Terrace slope): a two-storey 1920s-30s commercial block, the cream plastered brick
// of its era, with timber shopfronts and sash piers, a cut-stone string course and cornice, a parapet and a flat
// roof. The main body is the lidar's 10-block tier; its 8-block end is a lower wing. Solid core, one air gap behind
// the glazing, lamps behind some sash windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162091740.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_162091740.nbt`;

const key = (x, z) => `${x},${z}`;
const gk = (x, y, z) => `${x},${y},${z}`;
const OFF = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const isNS = (d) => d === "north" || d === "south";
const along = (c, d) => (isNS(d) ? c.x : c.z);      // position of a cell along the wall that faces d

// the lidar roof heights as two clean tiers: 9s join the 10 main body, 8s stay a lower wing
const list = cells.map(([x, z, G, R]) => ({ x, z, G, R: R >= 9 ? 10 : 8 }));
const fp = new Set(list.map((c) => key(c.x, c.z)));
const byKey = new Map(list.map((c) => [key(c.x, c.z), c]));
for (const c of list) c.faces = Object.keys(OFF).filter((d) => !fp.has(key(c.x + OFF[d][0], c.z + OFF[d][1])));
const corner = (c) => c.faces.some(isNS) && c.faces.some((d) => !isNS(d));
const inward = (c, d) => byKey.get(key(c.x + OFF[OPP[d]][0], c.z + OFF[OPP[d]][1]));

// entrances: the middle of the two longest runs of exposed street wall (consecutive cells on one face line)
const runs = [];
for (const d of Object.keys(OFF)) {
  const lines = new Map();
  for (const c of list) if (c.faces.includes(d)) {
    const L = isNS(d) ? c.z : c.x;
    if (!lines.has(L)) lines.set(L, []);
    lines.get(L).push(c);
  }
  for (const cs of lines.values()) {
    cs.sort((p, q) => along(p, d) - along(q, d));
    let run = [];
    for (const c of cs) {
      if (run.length && along(c, d) !== along(run.at(-1), d) + 1) { runs.push({ d, run }); run = []; }
      run.push(c);
    }
    if (run.length) runs.push({ d, run });
  }
}
const doors = new Map();   // "x,z" -> the face the door opens onto
for (const { d, run } of runs.sort((a, b) => b.run.length - a.run.length).slice(0, 2)) {
  const c = run[Math.floor(run.length / 2)];
  doors.set(key(c.x, c.z), d);
}

const g = new Voxels([31, 23, 14]);
const panes = [];

// 1. the street walls, cell by cell from the ground up: base course, shopfront, fascia, string course, sash
//    band, cornice, parapet. Glass goes in the wall cell; the cell inside it stays air (the gap).
for (const c of list) {
  if (!c.faces.length) continue;
  const door = doors.get(key(c.x, c.z)), face = door ?? c.faces[0], cor = corner(c);
  for (let y = c.G; y <= c.R - 1; y++) {
    let b = "smooth_sandstone", s = null;
    const glassRow = (y >= c.G + 1 && y <= c.R - 7) || y === c.R - 4 || y === c.R - 3;
    if (y === c.G) b = "stone_bricks";
    else if (y === c.R - 1) { b = "smooth_sandstone_slab"; s = { type: "bottom", waterlogged: "false" }; }
    else if (door && (y === c.G + 1 || y === c.G + 2)) {
      b = "dark_oak_door";
      s = { facing: door, half: y === c.G + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    }
    else if (y === c.R - 2 || y === c.R - 5) b = "cut_sandstone";           // cornice, string course
    else if (y === c.R - 6) b = "dark_oak_planks";                         // shop fascia
    else if (cor) b = "cut_sandstone";                                     // quoins at the stepped corners
    else if (glassRow) {
      if (along(c, face) % 3 === 0) b = "dark_oak_planks";                 // timber sash piers
      else { b = "glass_pane"; panes.push({ c, y, d: face }); }
    }
    g.set(c.x, y, c.z, b, s);
  }
}

// 2. the air gap behind each pane and door: the interior cell inside it stays open (no interiors, just a gap)
const gap = new Set();
for (const { c, y, d } of panes) {
  const i = inward(c, d);
  if (i && !i.faces.length) gap.add(gk(i.x, y, i.z));
}
for (const [k, d] of doors) {
  const c = byKey.get(k), i = inward(c, d);
  if (i && !i.faces.length) { gap.add(gk(i.x, c.G + 1, i.z)); gap.add(gk(i.x, c.G + 2, i.z)); }
}

// 3. the solid core of the interior: a floor slab per storey (the solid rows) and the roof deck on top
for (const c of list) {
  if (c.faces.length) continue;
  for (let y = c.G; y < c.R - 2; y++) if (!gap.has(gk(c.x, y, c.z))) g.set(c.x, y, c.z, "stone");
  g.set(c.x, c.R - 2, c.z, "gray_concrete");
}

// 4. the foundation: solid from y 0 up to each cell's ground, so nothing floats on the slope
for (const c of list) for (let y = 0; y < c.G; y++) g.set(c.x, y, c.z, "stone_bricks");

// 5. warm light behind some sash windows
for (const p of panes) {
  if (p.y !== p.c.R - 4 || (along(p.c, p.d) + p.c.z) % 4 !== 0) continue;
  const i = inward(p.c, p.d);
  if (i && !i.faces.length) g.set(i.x, p.y, i.z, "glowstone");
}

// 6. roof plant: a 2 x 2 lift overrun on the main body's roof, nearest the middle of the block
const mx = list.reduce((s, c) => s + c.x, 0) / list.length, mz = list.reduce((s, c) => s + c.z, 0) / list.length;
const interiorTop = new Set(list.filter((c) => !c.faces.length && c.R === 10).map((c) => key(c.x, c.z)));
let plant = null;
for (const k of interiorTop) {
  const [x, z] = k.split(",").map(Number);
  if (![[1, 0], [0, 1], [1, 1]].every(([dx, dz]) => interiorTop.has(key(x + dx, z + dz)))) continue;
  const dist = (x - mx) ** 2 + (z - mz) ** 2;
  if (!plant || dist < plant.dist) plant = { x, z, dist };
}
if (plant) {
  for (const dx of [0, 1]) for (const dz of [0, 1]) for (const y of [9, 10]) g.set(plant.x + dx, y, plant.z + dz, "stone_bricks");
}

// 7. panes connect along their wall to whatever stands beside them in that wall
for (const p of panes) {
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const dir of isNS(p.d) ? ["east", "west"] : ["north", "south"]) {
    const [dx, dz] = OFF[dir];
    if (g.get(p.c.x + dx, p.y, p.c.z + dz)) st[dir] = "true";
  }
  g.set(p.c.x, p.y, p.c.z, "glass_pane", st);
}

const info = g.save(OUT);
console.log(JSON.stringify({ footprint: list.length, doors: [...doors], panes: panes.length, gap: gap.size, plant, ...info }));
