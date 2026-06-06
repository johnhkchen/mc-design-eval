import { test } from "node:test";
import assert from "node:assert/strict";
import { loadBlockTable } from "../color/block-table.mjs";
import { faceResemblance, acceptIfCloser } from "./face-resemblance.mjs";

const TABLE = loadBlockTable();

/** A solid w×h RGBA image of one colour (full-foreground; no background pixels). */
function solid(w, h, [r, g, b]) {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { const o = i << 2; data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255; }
  return { width: w, height: h, data };
}

const WHITE_TERRACOTTA = [210, 178, 161]; // table rgb
const DARK_OAK = [60, 47, 26]; // table rgb

test("faceResemblance scores a concept-matching face higher than a mismatched one", () => {
  const concept = solid(16, 16, WHITE_TERRACOTTA); // the cream plaster the concept shows
  const after = solid(16, 16, WHITE_TERRACOTTA); // painted to match → high agreement
  const before = solid(16, 16, DARK_OAK); // pre-paint dark wall → low agreement
  const sAfter = faceResemblance(after, concept, TABLE).score;
  const sBefore = faceResemblance(before, concept, TABLE).score;
  assert.ok(sAfter != null && sBefore != null);
  assert.ok(sAfter > sBefore, `expected after (${sAfter}) > before (${sBefore})`);
});

test("faceResemblance includes set agreement when an artifact is supplied", () => {
  const concept = solid(16, 16, WHITE_TERRACOTTA);
  const build = solid(16, 16, WHITE_TERRACOTTA);
  const artifact = { placements: [{ op: "voxel", pos: [0, 0, 0], block: "minecraft:white_terracotta" }] };
  const r = faceResemblance(build, concept, TABLE, { artifact });
  assert.ok(r.set !== null);
  assert.ok(r.set.score != null);
});

test("acceptIfCloser accepts strict improvement, rejects equal/worse (rollback)", () => {
  assert.equal(acceptIfCloser({ before: 0.3, after: 0.6 }).accepted, true);
  assert.equal(acceptIfCloser({ before: 0.6, after: 0.6 }).accepted, false); // equal → roll back
  assert.equal(acceptIfCloser({ before: 0.6, after: 0.4 }).accepted, false); // worse → roll back
  assert.equal(acceptIfCloser({ before: 0.5, after: 0.55, epsilon: 0.1 }).accepted, false); // under margin
  const r = acceptIfCloser({ before: 0.3, after: 0.6 });
  assert.equal(r.delta, 0.3);
});

test("acceptIfCloser treats a null after-score as no improvement", () => {
  assert.equal(acceptIfCloser({ before: 0.3, after: null }).accepted, false);
  assert.equal(acceptIfCloser({ before: null, after: 0.6 }).accepted, false);
});
