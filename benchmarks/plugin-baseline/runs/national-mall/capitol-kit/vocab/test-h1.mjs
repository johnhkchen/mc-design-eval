// Calls each h1 helper once on a small empty grid. Every block a call writes must lie in the footprint it was given,
// and nothing may be refused. The blocks the helpers stand on or hang from are laid first, directly.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { podium, portico, archOpening, bronzeDoor, disc, peristyle, ribs, lanternRow } from "./h1.mjs";

const g = new Grid([60, 30, 60], { dataVersion: 3955 });

g.fill([32, 14, 32], [47, 14, 47], "smooth_quartz");   // base top: peristyle lanterns stand on it
g.fill([52, 11, 2], [52, 11, 10], "smooth_quartz");    // entablature: hanging lanterns
g.fill([54, 5, 2], [54, 5, 6], "smooth_quartz");       // floor: standing lanterns
g.fill([34, 26, 34], [45, 27, 45], "smooth_quartz");   // shell courses d12
g.fill([35, 28, 35], [44, 28, 44], "smooth_quartz");   // shell course d10

const snap = () => new Map([...g.cells.values()].map((c) => [c.pos.join(), JSON.stringify(c)]));
const inBox = ([x, y, z], b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && z >= b.z0 && z <= b.z1;
let failed = 0;

function run(name, box, calls) {
  const before = snap();
  const results = calls.map((call) => call());
  const placed = results.reduce((n, r) => n + r.placed, 0);
  const refused = results.flatMap((r) => r.refused);
  const stray = [...g.cells.values()].filter((c) => before.get(c.pos.join()) !== JSON.stringify(c) && !inBox(c.pos, box));
  const ok = placed > 0 && refused.length === 0 && stray.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${placed}, refused ${refused.length}, outside footprint ${stray.length}`);
  for (const r of [...refused.slice(0, 3), ...stray.slice(0, 3).map((c) => c.pos)]) console.log("     ", JSON.stringify(r));
}

run("podium", { x0: 0, x1: 5, y0: 2, y1: 4, z0: 0, z1: 5 }, [() => podium(g, { x0: 0, x1: 5, z0: 0, z1: 5 }, { ground: 2, top: 4 })]);
run("portico", { x0: 9, x1: 10, y0: 5, y1: 11, z0: 0, z1: 4 }, [() => portico(g, { columns: [{ x: 10, zs: [0, 2, 4] }], floorX: [9], span: { z0: 0, z1: 4 } })]);
run("archOpening", { x0: 12, x1: 14, y0: 6, y1: 8, z0: 8, z1: 8 }, [() => archOpening(g, { x: 12, z: 8, y0: 6, y1: 7, face: "west" })]);
run("bronzeDoor", { x0: 16, x1: 16, y0: 5, y1: 7, z0: 0, z1: 1 }, [() => bronzeDoor(g, { x: 16, z: 0, face: "west", w: 2, y0: 5 })]);
run("disc", { x0: 22, x1: 25, y0: 5, y1: 5, z0: 6, z1: 9 }, [() => disc(g, { cx: 24, cz: 8, d: 4, y: 5, block: "smooth_quartz" })]);
run("peristyle", { x0: 32, x1: 47, y0: 15, y1: 20, z0: 32, z1: 47 }, [() => peristyle(g, { cx: 40, cz: 40 })]);
run("ribs", { x0: 34, x1: 45, y0: 26, y1: 28, z0: 34, z1: 45 }, [() => ribs(g, { cx: 40, cz: 40, courses: [{ y: 26, d: 12 }, { y: 27, d: 12 }, { y: 28, d: 10 }], over: ["smooth_quartz", "smooth_quartz_stairs"] })]);
run("lanternRow", { x0: 52, x1: 54, y0: 6, y1: 10, z0: 2, z1: 10 }, [
  () => lanternRow(g, { line: { x0: 52, x1: 52, z0: 2, z1: 10 }, y: 10, every: 2, hanging: true }),
  () => lanternRow(g, { line: { x0: 54, x1: 54, z0: 2, z1: 6 }, y: 6, every: 2, hanging: false }),
]);

process.exitCode = failed ? 1 : 0;
