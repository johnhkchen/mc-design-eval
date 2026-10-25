// Checks vocab/base.mjs: every palette id has one constant and every constant is a palette id; the site maps; rng(seed).
// Run: node test-base.mjs (prints "ok" or throws).
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import * as base from "./vocab/base.mjs";

const pal = JSON.parse(readFileSync(new URL("./palette.json", import.meta.url), "utf8"));
const ids = [...new Set([...Object.values(pal.roles).flat(), ...pal.objects])];
const idSet = new Set(ids);

// palette constants: exported strings, named UPPER_SNAKE of their id
const constants = Object.entries(base).filter(([, v]) => typeof v === "string");
const byValue = new Map(constants.map(([name, v]) => [v, name]));
for (const [name, v] of constants) assert.ok(idSet.has(v), `${name} = "${v}" is not a palette.json id`);
for (const id of ids) {
  assert.equal(byValue.get(id), id.toUpperCase(), `palette id "${id}" needs the constant ${id.toUpperCase()}`);
}

// site maps: footprint cells carry a ground value; ground values only where the footprint is
const [X, Y, Z] = base.GRID;
assert.deepEqual([X, Y, Z], [130, 154, 121]);
assert.ok(base.MAX_Y < Y, "MAX_Y must be inside the grid");
assert.equal(base.ANGEL_TIP[1], base.MAX_Y, "the archangel's tip is the build's top");
let footprintCells = 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!base.onFootprint(x, z)) continue;
  footprintCells++;
  const g = base.groundTop(x, z);
  assert.ok(Number.isInteger(g) && g > 0, `footprint column (${x},${z}) needs a ground value, got ${g}`);
}
assert.equal(footprintCells, 1120 * 9, "1120 footprint map cells x 9 block columns, all inside the plot");
assert.equal(base.onFootprint(96, 0), true);   // map cell (32, 0) is '#'
assert.equal(base.groundTop(96, 0), 2);        // its ground value
assert.equal(base.onFootprint(105, 0), false); // map cell (35, 0) is '.'
assert.equal(base.groundTop(0, 0), null);
assert.equal(base.onFootprint(-1, 0), false);
assert.equal(base.onFootprint(X, 0), false);

// rng: same seed, same sequence; values in [0, 1)
const a = base.rng(7), b = base.rng(7), c = base.rng(8);
const seqA = Array.from({ length: 5 }, () => a());
assert.deepEqual(seqA, Array.from({ length: 5 }, () => b()));
assert.notDeepEqual(seqA, Array.from({ length: 5 }, () => c()));
assert.ok(seqA.every((v) => v >= 0 && v < 1));

console.log(`ok: ${ids.length} palette ids, ${footprintCells} footprint columns`);
