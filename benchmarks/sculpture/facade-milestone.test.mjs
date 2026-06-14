// facade-milestone (T-149-01, E-35 terminal): the texture milestone quotes committed gate verdicts —
// BOTH arithmetics on every row, baselines never re-banked, byte-reproducible, no model/GL.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { composeMilestone, FACADE_MILESTONE_SCHEMA } from "./facade-milestone.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..", "..");
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

test("FM1 — composes a milestone record over the committed gate pairs", async () => {
  const rec = await composeMilestone();
  assert.equal(rec.schema, FACADE_MILESTONE_SCHEMA);
  assert.ok(rec.subjects.length >= 2, "at least cottage + barn quoted");
  const subjects = rec.subjects.map((s) => s.subject);
  assert.ok(subjects.includes("cottage"), "cottage present (the mandatory subject)");
  assert.ok(subjects.includes("barn"), "barn present");
});

test("FM2 — every row carries BOTH arithmetics (kit-aware prior + relief-aware)", async () => {
  const rec = await composeMilestone();
  for (const s of rec.subjects) {
    const a = s.post.arithmetics;
    assert.ok("kitAware" in a && "budget" in a, "prior arithmetic present");
    assert.ok("reliefAware" in a, "relief-aware arithmetic present");
    assert.equal(typeof a.reliefAware.armed, "boolean", "relief armed flag is explicit");
  }
});

test("FM3 — baseline quote fidelity: the quoted gate sha equals the committed gate bytes", async () => {
  const rec = await composeMilestone();
  for (const s of rec.subjects) {
    const pin = s.post.gatePin;
    const bytes = readFileSync(resolve(ROOT, pin.path), "utf8");
    assert.equal(pin.sha256, sha256(bytes), `${pin.path} sha matches committed bytes`);
  }
});

test("FM4 — pre-operator honesty: relief unarmed on flat-build records (no fabricated pass)", async () => {
  const rec = await composeMilestone();
  // Until the operator runs the live relieved chain + judge, no committed gate record carries the
  // relief lens — the milestone must report that honestly, not invent a relief-aware pass.
  for (const s of rec.subjects) {
    if (!s.post.arithmetics.reliefAware.armed) {
      assert.ok(s.post.arithmetics.reliefAware.note.includes("unarmed"), "unarmed rows are named, not faked");
    }
  }
});

test("FM5 — self-grep clean: no subject key baked into the runner source", async () => {
  const rec = await composeMilestone();
  assert.equal(rec.generalization.clean, true, "subject identity stays in data (E-25 Rule 3)");
});

test("FM6 — deterministic: two composes are byte-identical (no model/GL)", async () => {
  const a = JSON.stringify(await composeMilestone());
  const b = JSON.stringify(await composeMilestone());
  assert.equal(a, b, "re-derivation is stable");
});

test("FM7 — no live dependency: the runner imports neither the model shim nor the renderer", () => {
  const src = readFileSync(resolve(here, "facade-milestone.mjs"), "utf8");
  assert.ok(!/sdk-binding|prismarine|renderViews|playwright|headless/.test(src), "repro path is model-free and GL-free");
});
