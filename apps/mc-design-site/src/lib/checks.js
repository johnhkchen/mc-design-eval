// The deterministic checks behind the fix system, shared by scripts/check.mjs (every catalog building) and
// scripts/fixer.mjs (a fix's candidates, before and after).
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fitReport } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/fit-check.mjs";
import { walkReport } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/rooms.mjs";
import { lightMaps } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/light.mjs";
import { approachReport } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/approach.mjs";

export const REPO = resolve(import.meta.dirname, "../../../..");
// the kit's rooms, moved into module i's frame: rooms inside plot i's x range, shifted by (w*i, 0, 5)
export const roomsFor = (e) => {
  const f = resolve(REPO, e.source.run, "rooms.json"); if (e.source.plot == null || !existsSync(f)) return [];
  const w = e.footprint[0], x0 = w * e.source.plot;
  return (JSON.parse(readFileSync(f, "utf8")).rooms ?? []).filter((r) => r.box && Math.min(r.box[0], r.box[3]) >= x0 && Math.max(r.box[0], r.box[3]) < x0 + w)
    .map((r) => ({ ...r, box: [r.box[0] - x0, r.box[1], r.box[2] - 5, r.box[3] - x0, r.box[4], r.box[5] - 5] }));
};

export function checkBuilding(g, rooms) {
  const issues = [], add = (kind, at, what) => issues.push({ kind, at, what });
  const w = walkReport(g, { rooms });
  for (const r of w.rooms ?? []) if (r.verdict !== "ok") add("room unreachable", r.unreached?.[0] ?? null, `${r.name}: ${r.verdict} (${r.reached} of ${r.standable} floor cells reached)`);
  for (const i of fitReport(g, { rooms, reached: w.reached }).issues) add(i.kind, i.at, i.what);
  for (const r of lightMaps(g, rooms).rooms) if (r.dark) add("dark room", r.box.slice(0, 3), `${r.name}: ${r.dark} dark floor cells (mobs spawn)`);
  // the front door: the lower half of the door nearest the street; walked from the street edge in front of it
  const doors = g.solids().filter((c) => /_door$/.test(c.block) && c.state?.half !== "upper").sort((a, b) => a.pos[2] - b.pos[2]);
  if (!doors.length) add("no front door", null, "no door at all");
  else if (doors[0].pos[2] > g.size[2] / 2) add("no front door", doors[0].pos, `the nearest door to the street is at the back (${doors[0].pos.join(",")})`);
  else {
    // from the street edge (z 0): the standable cell nearest the door's x (a kit's plot fence runs along z 0 with a gate)
    const d = doors[0].pos, air = (x, y, z) => /air$|short_grass|fern|flower|torch|carpet/.test(g.get(x, y, z)?.block ?? "air");
    let from = null;
    for (let dx = 0; dx < g.size[0] && !from; dx++) for (const x of [d[0] - dx, d[0] + dx]) { if (x < 0 || x >= g.size[0] || from) continue;
      // feet in air or a gate, on ground (never on top of a fence or wall: they stand 1.5 high)
      const gate = (y) => /fence_gate$/.test(g.get(x, y, 0)?.block ?? ""), floor = (y) => !air(x, y, 0) && !/fence|wall$|_wall|gate/.test(g.get(x, y, 0)?.block ?? "");
      for (let y = 1; y < g.size[1] - 1; y++) if (floor(y - 1) && (air(x, y, 0) || gate(y)) && air(x, y + 1, 0)) { from = [x, y, 0]; break; } }
    if (!from) add("way in", null, "no open cell on the street edge to walk in from");
    else for (const f of approachReport(g, { from, to: d }).faults) add("way in", f.at, f.what);
  }
  return issues;
}


/** kind -> count */
export const tally = (issues) => issues.reduce((a, i) => ((a[i.kind] = (a[i.kind] || 0) + 1), a), {});
