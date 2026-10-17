// The 8 modules as their own files for the server (1.21.1): plot i of v2 (x 12i..12i+11, z 5..18; the lane rows are the
// site's street, so they're left out), y 0 = the yard surface (lay it on the pad's top), front facing north.
import { load, Grid, DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
const FOR_1_21_1 = [[/^minecraft:pale_oak_log$/, "minecraft:stripped_birch_log"], [/^minecraft:pale_oak_/, "minecraft:birch_"], [/^minecraft:iron_chain$/, "minecraft:chain"]];
const older = (b) => { for (const [re, to] of FOR_1_21_1) if (re.test(b)) return b.replace(re, to); return b; };
const NAMES = ["cotton-gin", "schoolhouse", "hill-farmhouse", "smithy", "church", "tobacco-barn", "corn-crib-granary", "owners-house"];
// what leaned on the neighbouring module in the sample row floats on its own: dropped
const dropLoose = (m) => { const solids = [...m.cells.values()].filter((c) => !/air$|water|lava/.test(c.block)), at = new Set(solids.map((c) => c.pos.join(",")));
  const seen = new Set(), q = []; for (const c of solids) if (c.pos[1] === 0) { seen.add(c.pos.join(",")); q.push(c.pos); }
  while (q.length) { const [x, y, z] = q.pop(); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 2) continue; const k = `${x + dx},${y + dy},${z + dz}`; if (at.has(k) && !seen.has(k)) { seen.add(k); q.push([x + dx, y + dy, z + dz]); } } }
  let n = 0; for (const c of solids) if (!seen.has(c.pos.join(","))) { m.unset(...c.pos); n++; } return n; };
const g = load("v2.nbt"); mkdirSync("delivery", { recursive: true });
const rows = ["# Polarton hillside kit: modules", "", "8 modules, each 12 wide (x) x 14 deep (z), front (gate) facing north, for Minecraft 1.21.1. y 0 is the yard surface: lay it on the pad's top surface, turned to face the plot's street (the site's village.nbt has them placed already).", "", "| # | file | site plot | faces | blocks |", "|---|---|---|---|---|"];
const FACE = ["north", "west", "east", "south", "east", "north", "north", "west"];
NAMES.forEach((name, i) => { const m = new Grid([12, g.size[1], 14], { dataVersion: DATA_VERSIONS["1.21.1"] }); let n = 0;
  for (const c of g.cells.values()) { const [x, y, z] = c.pos; if (x < 12 * i || x >= 12 * i + 12 || z < 5 || z > 18) continue; m.set(x - 12 * i, y, z - 5, older(c.block), c.state, c.nbt); n++; }
  const dropped = dropLoose(m); n -= dropped; if (dropped) console.error(`${name}: dropped ${dropped} floating`);
  const f = `polarton-${String(i).padStart(2, "0")}-${name}.nbt`; m.save(`delivery/${f}`); rows.push(`| ${i} | ${f} | ${i + 1} | ${FACE[i]} | ${n} |`); });
writeFileSync("delivery/MODULES.md", rows.join("\n") + "\n"); console.log(rows.join("\n"));
