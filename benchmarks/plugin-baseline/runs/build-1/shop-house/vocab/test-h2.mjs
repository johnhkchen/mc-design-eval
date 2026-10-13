// Calls each batch-2 helper once on a fresh grid and checks that it placed blocks inside the footprint it was given.
// Run: node vocab/test-h2.mjs   (exit 1 on any failure)
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

let failed = 0;
const ok = (name, cond, detail = "") => { console.log(`${cond ? "ok  " : "FAIL"} ${name}${detail ? "  " + detail : ""}`); if (!cond) failed++; };
// only the cells the helper changed (pre-seeded wall and grass are the caller's, not the helper's writes)
const snap = (g) => new Map([...g.cells].map(([k, c]) => [k, c.block + JSON.stringify(c.state ?? {})]));
const inBox = (g, [x0, y0, z0], [x1, y1, z1], before = new Map()) => [...g.cells].every(([k, { pos: [x, y, z], block, state }]) => before.get(k) === block + JSON.stringify(state ?? {}) || (x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1));
const grid = () => new Grid([32, 40, 32]);

// quoinPair: brick wall first, quoins replace it only with over
{
  const g = grid();
  for (let y = 12; y <= 16; y++) g.set(4, y, 5, "bricks");
  const b = snap(g);
  const r = h2.quoinPair(g, 4, 5, 14, { over: true });
  ok("quoinPair places two quoins over brick", r.placed === 2 && g.blockAt(4, 15, 5) === "minecraft:smooth_quartz", `placed ${r.placed}`);
  ok("quoinPair stays in footprint", inBox(g, [4, 14, 5], [4, 15, 5], b));
  const r2 = h2.quoinPair(g, 4, 5, 12);                    // default: air only
  ok("quoinPair refuses brick without over", r2.refused.length === 2 && r2.placed === 0);
}

// fascia: board x10..18 y9..12 at z5, letters at z4
{
  const g = grid();
  const r = h2.fascia(g, 10, 18, 9, 12, 5, "BUTCHER");
  ok("fascia board fills 9x4", g.blockAt(14, 10, 5) === "minecraft:red_nether_bricks" && r.placed >= 36, `placed ${r.placed}`);
  const letters = [...g.cells.values()].filter((c) => c.pos[2] === 4);
  ok("fascia letters on z4, none skipped", letters.length > 0 && r.letterSkips === 0, `letters ${letters.length}`);
  ok("fascia stays in x10..18 y9..12 z4..5", inBox(g, [10, 9, 4], [18, 12, 5]));
}

// hood: slab row x5..8 at y9 z4, stairs at the ends y8, lanterns hang under the slab
{
  const g = grid();
  const r = h2.hood(g, 5, 8, 9, 4, "north");
  ok("hood stairs face into the wall (south), upside down", g.get(5, 8, 4)?.state?.facing === "south" && g.get(5, 8, 4)?.state?.half === "top");
  ok("hood lanterns hang from the slab above", [6, 7].every((x) => g.blockAt(x, 8, 4) === "minecraft:lantern" && g.blockAt(x, 9, 4) === "minecraft:dark_oak_slab"));
  ok("hood stays in x5..8 y8..9 z4", inBox(g, [5, 8, 4], [8, 9, 4]) && r.refused.length === 0, `placed ${r.placed}`);
}

// doorPair: two leaves x6..7, both halves, y6..7, z5
{
  const g = grid();
  const r = h2.doorPair(g, 6, 6, 5, "north");
  const lo = g.get(6, 6, 5)?.state, hi = g.get(7, 7, 5)?.state;
  ok("doorPair writes both halves of both leaves", r.placed === 4 && g.get(6, 7, 5)?.state?.half === "upper" && g.get(7, 6, 5)?.state?.half === "lower");
  ok("doorPair hinges on the outer edges", lo?.hinge === "left" && hi?.hinge === "right", `hinges ${lo?.hinge}/${hi?.hinge}`);
  ok("doorPair stays in x6..7 y6..7 z5", inBox(g, [6, 6, 5], [7, 7, 5]));
}

// chimneyStack: E stack x20..21 z13..14, base 5, band 29, hay 30, cap 31
{
  const g = grid();
  const r = h2.chimneyStack(g, 20, 13, 5, 29, 30, 31, { over: true });
  ok("chimneyStack hay under a lit campfire at the cap", g.blockAt(21, 30, 14) === "minecraft:hay_block" && g.blockAt(21, 31, 14) === "minecraft:campfire" && g.get(21, 31, 14)?.state?.lit === "true");
  ok("chimneyStack stays in x19..22 y5..31 z12..15", inBox(g, [19, 5, 12], [22, 31, 15]) && r.refused.length === 0, `placed ${r.placed}`);
  ok("chimneyStack flue stays clear", g.blockAt(20, 31, 13) === "minecraft:air" && g.blockAt(21, 31, 13) === "minecraft:air");
}

// ladderHatch: ladder x16 z21 y19..22 facing north, hatch x16 y23 z20
{
  const g = grid();
  const r = h2.ladderHatch(g, 16, 21, 19, 22, "north");
  ok("ladderHatch ladder + hatch in place", g.get(16, 20, 21)?.state?.facing === "north" && g.blockAt(16, 23, 20) === "minecraft:dark_oak_trapdoor" && g.get(16, 23, 20)?.state?.open === "true");
  ok("ladderHatch stays in x16 y19..23 z20..21", inBox(g, [16, 19, 20], [16, 23, 21]) && r.refused.length === 0, `placed ${r.placed}`);
}

// pathRun: 3-wide path x12..17 along z27 on grass, over only
{
  const g = grid();
  for (let x = 10; x <= 19; x++) for (let z = 24; z <= 30; z++) g.set(x, 5, z, "grass_block");
  const b = snap(g);
  const r = h2.pathRun(g, [[12, 27], [17, 27]], 3, 5, { over: true });
  ok("pathRun lays dirt_path over grass", g.blockAt(14, 5, 27) === "minecraft:dirt_path" && g.blockAt(14, 5, 26) === "minecraft:dirt_path" && g.blockAt(14, 5, 28) === "minecraft:dirt_path");
  ok("pathRun stays in x12..17 y5 z26..28", inBox(g, [12, 5, 26], [17, 5, 28], b) && r.refused.length === 0, `placed ${r.placed}`);
  const g2 = grid();
  for (let x = 12; x <= 17; x++) g2.set(x, 5, 27, "grass_block");
  const r2 = h2.pathRun(g2, [[12, 27], [17, 27]], 1, 5);
  ok("pathRun without over refuses grass", r2.refused.length === 6 && r2.placed === 0);
}

// lampPost: spruce fence x25 z21 y6..8, lantern y9
{
  const g = grid();
  const r = h2.lampPost(g, 25, 21, 6);
  ok("lampPost post then lantern on top", g.blockAt(25, 8, 21) === "minecraft:spruce_fence" && g.get(25, 9, 21)?.state?.hanging === "false" && r.placed === 4);
  ok("lampPost stays in x25 y6..9 z21", inBox(g, [25, 6, 21], [25, 9, 21]));
}

// waterButt: water cauldron at level 3, one cell
{
  const g = grid();
  const r = h2.waterButt(g, 12, 29, 6);
  ok("waterButt is a level-3 cauldron in one cell", r.placed === 1 && g.get(12, 6, 29)?.block === "minecraft:water_cauldron" && g.get(12, 6, 29)?.state?.level === "3" && inBox(g, [12, 6, 29], [12, 6, 29]));
}

console.log(failed ? `${failed} failed` : "all helper footprints ok");
process.exitCode = failed ? 1 : 0;
