// Calls every H1 helper once on a small grid; each must place blocks only inside the footprint it was given,
// and must refuse (not overwrite) a cell an earlier part already filled.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h1.mjs";

let fails = 0;
const key = (c) => c.pos.join(",");
const snap = (g) => new Map([...g.cells.values()].map((c) => [key(c), `${c.block} ${JSON.stringify(c.state ?? {})}`]));

// Run one helper on a fresh grid; every new or changed cell must sit inside box [x0,y0,z0,x1,y1,z1].
function check(name, box, run) {
  const g = new Grid([40, 40, 40]);
  const before = snap(g);
  const res = run(g);
  const after = snap(g);
  const inside = ([x, y, z]) => x >= box[0] && x <= box[3] && y >= box[1] && y <= box[4] && z >= box[2] && z <= box[5];
  const changed = [...after].filter(([k, v]) => before.get(k) !== v).map(([k]) => k.split(",").map(Number));
  const outside = changed.filter((p) => !inside(p));
  const ok = outside.length === 0 && res.refused.length === 0 && changed.length === res.placed && changed.length > 0;
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${res.placed}, refused ${res.refused.length}, outside ${outside.length}`);
}

check("limestone_mass", [2, 0, 2, 10, 6, 8], (g) => h.limestone_mass(g, [2, 0, 2, 10, 6, 8]));
check("frieze_band", [12, 7, 2, 20, 7, 2], (g) => h.frieze_band(g, [12, 7, 2, 20, 7, 2]));
check("frieze_band string course", [12, 9, 2, 20, 9, 2], (g) => h.frieze_band(g, [12, 9, 2, 20, 9, 2], { stringCourse: "west" }));
check("marquee_run", [0, 5, 4, 2, 11, 20], (g) => h.marquee_run(g, { axis: "z", from: 4, to: 20, at: 1, front: "west" }));
check("marquee_word", [0, 8, 4, 0, 8, 20], (g) => h.marquee_word(g, "RADIO CITY", { center: [0, 8, 12], face: "west" }));
check("tall_window", [7, 12, 10, 9, 22, 10], (g) => h.tall_window(g, { pos: [8, 10], face: "south", y0: 12, y1: 22 }));
check("stage_door", [19, 2, 28, 24, 7, 32], (g) => h.stage_door(g, { x0: 20, x1: 23, z: 30, y0: 2, y1: 4, face: "south", canopy: { x0: 19, x1: 24, z0: 28, z1: 32, y: 6 } }));
check("vent_box", [4, 20, 4, 5, 21, 5], (g) => h.vent_box(g, { x: 4, y: 20, z: 4 }));
check("floodlight", [2, 31, 35, 18, 31, 35], (g) => h.floodlight(g, { deckY: 30, axis: "x", at: 35, from: 2, to: 18 }));

// Refusal: an earlier part's stone must survive, and be reported.
{
  const g = new Grid([40, 40, 40]);
  g.set(5, 0, 5, "minecraft:stone");
  const res = h.limestone_mass(g, [2, 0, 2, 10, 6, 8]);
  const kept = g.blockAt(5, 0, 5) === "minecraft:stone" && res.refused.some(([x, y, z]) => x === 5 && y === 0 && z === 5);
  if (!kept) fails++;
  console.log(`${kept ? "ok  " : "FAIL"} refuses an occupied cell (kept stone, listed in refused)`);
}

console.log(fails ? `${fails} failing check(s)` : "all H1 checks passed");
process.exit(fails ? 1 : 0);
