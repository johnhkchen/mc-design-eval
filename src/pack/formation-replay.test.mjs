// Replay pins for committed style-formation runs (T-130-01, story S-130, epic E-32) — the
// executable E-31 Rule 5 proof: for every draft committed under packs/drafts/, the stage
// prompts re-render to the ledgered sha256, the committed raw replies re-parse to the
// committed expecteds, and the stage expecteds re-derive the committed draft.json /
// README.md / comparison.json byte-identically. One batched bridge spawn serves every
// committed draft (the fixtures.test.mjs pattern). Skips cleanly while no drafts exist.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { bamlBatch } from "../baml/bridge.mjs";
import { loadStylePack } from "./style-pack.mjs";
import { deriveDraftFromStages, comparePacks, draftReadme, ownedNamesFromRegistryDigest } from "./formation.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const DRAFTS = "packs/drafts";
const STAGES = ["vernacular", "palette", "proportions", "decompose"];
const FN_OF = {
  vernacular: "AuthorMaterialStory",
  palette: "DerivePalette",
  proportions: "DeriveProportions",
  decompose: "DecomposeBrushBacklog",
};
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";

const slugs = existsSync(join(ROOT, DRAFTS))
  ? readdirSync(join(ROOT, DRAFTS), { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(ROOT, DRAFTS, e.name, "draft.json")))
      .map((e) => e.name)
      .sort()
  : [];

let R = null; // batch results: per slug, 4 renders then 4 parses

before(async () => {
  if (slugs.length === 0) return;
  const ops = slugs.flatMap((slug) => [
    ...STAGES.map((s) => ({ fn: FN_OF[s], mode: "render", args: readJson(`${DRAFTS}/${slug}/stages/${s}/inputs.json`) })),
    ...STAGES.map((s) => ({ fn: FN_OF[s], mode: "parse", text: read(`${DRAFTS}/${slug}/stages/${s}/reply.txt`) })),
  ]);
  R = await bamlBatch(ops);
});

test(`formation replay: committed drafts re-derive byte-identically (${slugs.length ? slugs.join(", ") : "none committed yet — skip"})`, (t) => {
  if (slugs.length === 0) return t.skip("no committed drafts under packs/drafts/");
  slugs.forEach((slug, k) => {
    const base = k * STAGES.length * 2;
    const expected = {};
    STAGES.forEach((s, i) => {
      const dir = `${DRAFTS}/${slug}/stages/${s}`;
      const render = R[base + i];
      const parse = R[base + STAGES.length + i];
      assert.ok(render.ok, `${slug}/${s}: render — ${render.error}`);
      assert.equal(sha256(render.prompt), readJson(`${dir}/ledger.json`).promptSha256, `${slug}/${s}: prompt sha drifted`);
      assert.ok(parse.ok, `${slug}/${s}: parse — ${parse.error}`);
      assert.equal(jsonOf(parse.parsed), read(`${dir}/expected.json`), `${slug}/${s}: re-parse differs from the committed expected`);
      expected[s] = readJson(`${dir}/expected.json`);
    });
    const { draft, deduped, nearTone } = deriveDraftFromStages({
      story: expected.vernacular,
      palette: expected.palette,
      proportions: expected.proportions,
      backlog: expected.decompose,
      styleSlug: slug,
      // the registry AS RECORDED at formation time — the live table grows (E-32)
      ownedNames: ownedNamesFromRegistryDigest(readJson(`${DRAFTS}/${slug}/stages/decompose/inputs.json`).registry_state),
    });
    assert.equal(jsonOf(draft), read(`${DRAFTS}/${slug}/draft.json`), `${slug}: draft.json drifted`);
    const comparePath = readJson(`${DRAFTS}/${slug}/ledger.json`).compare ?? null;
    const comparison = comparePath ? comparePacks(draft, loadStylePack(join(ROOT, comparePath))) : null;
    if (comparison) {
      assert.equal(jsonOf(comparison), read(`${DRAFTS}/${slug}/comparison.json`), `${slug}: comparison.json drifted`);
    }
    assert.equal(
      draftReadme({ pack: draft, nearTone, needs: deduped, comparison }),
      read(`${DRAFTS}/${slug}/README.md`),
      `${slug}: README.md drifted`,
    );
  });
});
