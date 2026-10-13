// SPDX-License-Identifier: AGPL-3.0-or-later
// Smoke test for vocab/h3.mjs: every helper once on a small air grid, each placed cell checked against the footprint
// the call was given. Run: node vocab/test-h3.mjs
import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { cornice, awning, sashWindow, setDisplay, hearth, hangLantern, fenceRun, fruitTree, bench } from "./h3.mjs";

const inside = (cells, [lo, hi]) => cells.every(([x, y, z]) => x >= lo[0] && x <= hi[0] && y >= lo[1] && y <= hi[1] && z >= lo[2] && z <= hi[2]);
const g = new Grid([40, 20, 40]);
const seen = [];
function check(name, res, lo, hi) {
  assert.ok(res.placed.length > 0, `${name}: placed nothing (skipped ${JSON.stringify(res.skipped)})`);
  assert.ok(inside(res.placed, [lo, hi]), `${name}: wrote outside its footprint`);
  seen.push(`${name} ${res.placed.length}`);
}

check("cornice", cornice(g, 4, 9, 4, 13), [4, 13, 4], [9, 13, 4]);
check("awning", awning(g, 4, 9, 4, 9, "red", "white"), [4, 9, 3], [9, 9, 4]);
// sash window on the north wall: outer plane z 6, glass z 7; lintel x 13..16 y 17; sill z 5 y 13
check("sashWindow", sashWindow(g, "north", 14, 14, 6, 2, 3), [13, 13, 5], [16, 17, 7]);
check("hearth", hearth(g, 18, 14, 13, "west", { room: [9, 14, 7, 18, 17, 15] }), [18, 14, 13], [18, 16, 14]);
g.set(12, 13, 22, "bricks");                                  // the floor it hangs from
check("hangLantern", hangLantern(g, 12, 12, 22), [12, 12, 22], [12, 12, 22]);
check("fenceRun", fenceRun(g, [[1, 6], [1, 21], [3, 21]], 6), [1, 6, 6], [3, 6, 21]);
check("fruitTree", fruitTree(g, 23, 35, 6), [21, 6, 33], [25, 13, 37]);
check("bench", bench(g, 12, 6, 25, "east"), [12, 6, 25], [12, 6, 25]);

// the walls' own cells: a block already there is refused and kept, never overwritten
g.set(9, 6, 30, "stone");
const refused = fenceRun(g, [[7, 30], [11, 30]], 6);
assert.equal(g.blockAt(9, 6, 30), "minecraft:stone", "fenceRun overwrote an existing block");
assert.ok(refused.skipped.some((s) => s.at.join() === "9,6,30"), "fenceRun did not report the refused cell");
// a lantern with nothing above it is refused
assert.equal(hangLantern(g, 14, 9, 22).placed.length, 0, "hangLantern hung from air");

// setDisplay: rewriting a socket's own value leaves the file byte-identical; a new value lands in display only
const src = new URL("../sockets.json", import.meta.url);
const tmp = join(mkdtempSync(join(tmpdir(), "h3-")), "sockets.json");
copyFileSync(fileURLToPath(src), tmp);
const before = readFileSync(tmp, "utf8");
const a1 = JSON.parse(before).display.A1;
setDisplay("A1", a1, tmp);
assert.equal(readFileSync(tmp, "utf8"), before, "setDisplay changed bytes it should not have");
setDisplay("A2", ["pink_terracotta", "brown_mushroom_block", "red_terracotta"], tmp);
assert.equal(JSON.parse(readFileSync(tmp, "utf8")).display.A2, "pink_terracotta,brown_mushroom_block,red_terracotta");
assert.throws(() => setDisplay("Z9", "stone", tmp), /no socket Z9/);
seen.push("setDisplay ok");

console.log(`h3 helpers ok: ${seen.join("; ")}`);
