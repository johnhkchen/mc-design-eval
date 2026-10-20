// Part "Inn at the Market" (plot 0): cream stucco hotel round a courtyard, bays, awnings, roof deck.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { B, DIRS, OPPOSITE, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { ringOf, groundAt, plinth, stuccoBay, bayRhythm, julietBalcony, awning, archGate, courtyardWall, doorPair,
  deckAndParapet, pergola, umbrella, azaleaPlanter, pavilion } from "../vocab.mjs";

const site = JSON.parse(readFileSync(fileURLToPath(new URL("../site.json", import.meta.url)), "utf8"));
const P = site.plots.inn ?? site.plots["0"];
const plot = { footprint: P.footprint, ground: P.ground.map((r) => r.map((v) => (v === "." || v == null ? null : Number(v)))) };
const rings = ringOf(plot);
const G = (x, z) => groundAt(plot, x, z);
const inM = (x, z) => rings.has(`${x},${z}`);
const VOID = (x, z) => x >= 24 && x <= 37 && z >= 18 && z <= 33;
const FULL = { north: "N", south: "S", east: "E", west: "W" };
const D4 = Object.entries({ north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] });

export function build(g) {
  const cells = [...rings].map(([k, v]) => [...k.split(",").map(Number), v]);
  // doors: [x, z, face] first wall cell, 2 wide
  const doors = [[54, 22, "east"], [40, 1, "north"], [50, 1, "north"]];
  const along = { north: [1, 0], south: [1, 0], east: [0, 1], west: [0, 1] };
  const isDoor = (x, z, y) => y >= 10 && y <= 11 && doors.some(([dx, dz, f]) => [0, 1].some((k) => x === dx + k * along[f][0] && z === dz + k * along[f][1]));
  const nearVoid = (x, z) => !VOID(x, z) && D4.some(([, [dx, dz]]) => VOID(x + dx, z + dz));
  const wallCell = (x, z, r) => !VOID(x, z) && (r === 1 || nearVoid(x, z));

  // shell: walls G..28, quoin-less body
  for (const [x, z, { ring }] of cells) {
    if (!wallCell(x, z, ring)) continue;
    for (let y = G(x, z); y <= 28; y++) if (!isDoor(x, z, y)) g.set(x, y, z, "smooth_sandstone");
  }
  // courtyard paved floor y9, polished border
  for (let x = 24; x <= 37; x++) for (let z = 18; z <= 33; z++) {
    for (let y = G(x, z); y <= 8; y++) g.set(x, y, z, "stone_bricks");
    const border = x === 24 || x === 37 || z === 18 || z === 33;
    g.set(x, 9, z, border ? "polished_andesite" : "stone_bricks");
  }
  // plinth on ring 0 where G<9
  plinth(g, { ring0: cells.filter(([x, z, v]) => v.ring === 0 && G(x, z) < 9).map(([x, z]) => [x, z, G(x, z)]) },
    { top: 8, block: "smooth_stone", cap: "polished_andesite" });

  // treads of ring 1 (outer wall only)
  const treads = [];
  for (const [dir, [dx, dz]] of D4) {
    const cs = cells.filter(([x, z, v]) => v.ring === 1 && !nearVoid(x, z) && inM(x + dx, z + dz) && rings.get(`${x + dx},${z + dz}`).ring === 0
      && !inM(x + 2 * dx, z + 2 * dz)).map(([x, z]) => [x, z]);
    const key = (c) => (dx ? [c[0], c[1]] : [c[1], c[0]]); // [perp, along]
    cs.sort((a, b) => key(a)[0] - key(b)[0] || key(a)[1] - key(b)[1]);
    let run = [];
    for (const c of cs) {
      const l = run[run.length - 1];
      if (l && key(l)[0] === key(c)[0] && key(c)[1] - key(l)[1] === 1) run.push(c);
      else { if (run.length) treads.push({ cells: run, face: dir }); run = [c]; }
    }
    if (run.length) treads.push({ cells: run, face: dir });
  }
  // bays on 8-long W/N/S treads, juliet balconies on the other 6/8 treads
  for (const t of treads) {
    if (t.cells.length === 8 && t.face !== "east") stuccoBay(g, t);
  }
  for (const t of treads) {
    for (const fl of [9, 14, 19, 24]) bayRhythm(g, t, { floorY: fl, h: 3, sill: "smooth_stone", lintel: "smooth_sandstone", over: true });
    if (t.cells.length >= 6 && !(t.cells.length === 8 && t.face !== "east")) {
      const w = t.cells.length === 8 ? [[1, 3], [5, 7]] : [[2, 4]];
      for (const fl of [14, 19, 24]) for (const [a, b] of w) julietBalcony(g, { face: t.face, cells: t.cells.slice(a, b), floor: fl, h: 3 });
    }
  }
  // ring-0 courses: string course y14, cornice y28 + brackets y27, quoins on corners
  for (const [x, z, { ring, faceDir }] of cells) {
    if (ring !== 0 || VOID(x, z)) continue;
    const [dx, dz] = DIRS[faceDir].filter((_, i) => i !== 1);
    const gr = G(x, z);
    if (!(gr > 14)) g.set(x, 14, z, ...B.slab("smooth_sandstone", "top"));
    g.set(x, 28, z, "cut_sandstone");
    if ((x + z) % 2 === 0) g.set(x, 27, z, ...B.stairs("smooth_sandstone", OPPOSITE[faceDir], "top"));
    const outside = D4.filter(([, [ax, az]]) => !inM(x + ax, z + az)).length;
    const diag = [[1, 1], [1, -1], [-1, 1], [-1, -1]].some(([ax, az]) => !inM(x + ax, z + az));
    const corner = outside >= 2 || (diag && D4.every(([, [ax, az]]) => inM(x + ax, z + az)));
    if (corner) for (let y = Math.max(gr, 10); y <= 27; y++) if ((y + x + z) % 2 === 0) g.set(x, y, z, "cut_sandstone");
  }
  // courtyard walls
  for (const [a, b, c, d, f] of [[24, 37, 17, 17, "south"], [24, 37, 34, 34, "north"], [23, 23, 18, 33, "east"], [38, 38, 18, 33, "west"]]) {
    const cs = [];
    for (let x = a; x <= b; x++) for (let z = c; z <= d; z++) cs.push([x, z]);
    courtyardWall(g, { cells: cs, face: f }, { floors: [9, 14, 19, 24] });
  }
  // awnings
  for (const t of treads) for (const [x, z] of t.cells) {
    const ok = (t.face === "north" && z === 1 && x >= 32 && x <= 59) || (t.face === "east" && x === 54 && z >= 18 && z <= 27);
    if (!ok) continue;
    const [ox, , oz] = DIRS[t.face];
    g.set(x + ox, 13, z + oz, (x + z) % 2 ? "green_wool" : "white_wool");
  }
  // doors
  for (const [x, z, f] of doors) doorPair(g, { x, z, y: 10, face: f, ground: 10 });
  // gate arch on the south tread nearest x24..26
  const gt = treads.filter((t) => t.face === "south").find((t) => t.cells.some(([x]) => x === 25));
  if (gt) archGate(g, { x: 24, z: gt.cells[0][1], w: 3, h: 4, y: G(25, gt.cells[0][1]), face: "S", carve: true });

  // roof deck + parapet
  deckAndParapet(g, plot, { deckY: 29, deck: "spruce_planks", parapet: "smooth_sandstone", parapetH: 1, coping: "smooth_sandstone", rail: true, skip: VOID });
  for (const [x, z, { ring }] of cells) if (ring >= 2 && nearVoid(x, z)) { g.set(x, 30, z, "smooth_sandstone"); g.set(x, 31, z, "iron_bars"); }
  pergola(g, [30, 30, 6, 39, 33, 14]);
  pergola(g, [26, 30, 36, 36, 33, 44]);
  for (const [x, z] of [[27, 7], [27, 12], [33, 17], [38, 17], [23, 40], [39, 38]]) umbrella(g, [x, 30, z]);
  for (let z = 10; z <= 42; z += 4) {
    let xm = 0;
    for (let k = -1; k <= 1; k++) for (let x = 0; x < 61; x++) if (inM(x, z + k)) { xm = Math.max(xm, x); break; }
    const cx = xm + 3;
    if ([-1, 0, 1].every((k) => inM(cx + 2, z + k) && !VOID(cx, z + k))) azaleaPlanter(g, [cx, 30, z]);
  }
  pavilion(g, [40, 29, 8, 51, 34, 19]);
  // lift tower
  for (let x = 44; x <= 47; x++) for (let z = 22; z <= 25; z++) for (let y = 30; y <= 38; y++) {
    const edge = x === 44 || x === 47 || z === 22 || z === 25;
    if (y === 38 || edge) g.set(x, y, z, "smooth_sandstone");
  }
  for (const y of [33, 34]) g.set(45, y, 22, "glass_pane");
  g.set(45, 30, 22, ...B.door("dark_oak", "north", "lower")); g.set(45, 31, 22, ...B.door("dark_oak", "north", "upper"));
}
