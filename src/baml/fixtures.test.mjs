// Pinned BAML fixtures (T-129-01, story S-129, epic E-32) — the executable proof that the four
// design functions stay what their committed records say they are. One bridge spawn serves the
// whole file (batch protocol). Two pin families per function:
//   render — the rendered prompt's bytes/sha against the committed authority (recognition: the
//            live records' promptSha256; critique: the captured golden; vernacular/decompose:
//            the prompt.txt captured at mint);
//   parse  — b.parse over COMMITTED raw replies deep-equals the committed/expected parse, and a
//            malformed specimen rejects (the typed schema matches reality, both ways).

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { bamlBatch } from "./bridge.mjs";
import { loadStylePack } from "../pack/style-pack.mjs";
import { recognitionRenderArgs } from "../recognition/prompt.mjs";
import { DEPARTMENTS } from "../pack/departments.mjs";
import { itemStyleClass } from "../workshop/bakeoff-score.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

/** Strip null/undefined leaves so optional-absent (committed JSON) == optional-null (b.parse). */
function dropNulls(v) {
  if (Array.isArray(v)) return v.map(dropNulls);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, x] of Object.entries(v)) if (x !== null && x !== undefined) out[k] = dropNulls(x);
    return out;
  }
  return v;
}

// A 1×1 transparent PNG — render pins are about TEXT bytes; image content is irrelevant.
const PX = { base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", mediaType: "image/png" };

const REC = "benchmarks/sculpture/recognition";
const pack = loadStylePack(join(ROOT, "packs/rustic.json"));
const recOps = (key) => ({
  fn: "RecognizeBuildingProgram",
  mode: "render",
  args: recognitionRenderArgs({ pack, sketch: readJson(`benchmarks/sculpture/form-sketch/${key}.json`) }),
  images: { concept: PX, sketch_sheet: PX },
});

const cottageReplies = readJson(`${REC}/cottage.replies.json`);
const barnReplies = readJson(`${REC}/barn.replies.json`);

const CRIT = "src/baml/fixtures/critique";
const DIAG = "src/baml/fixtures/diagnose";
const ROUTE = "src/baml/fixtures/route";

let R; // batch results, by index

before(async () => {
  R = await bamlBatch([
    /* 0 */ recOps("cottage"),
    /* 1 */ recOps("barn"),
    /* 2 */ { fn: "RecognizeBuildingProgram", mode: "parse", text: cottageReplies.rawTexts.at(-1) },
    /* 3 */ { fn: "RecognizeBuildingProgram", mode: "parse", text: barnReplies.rawTexts.at(-1) },
    /* 4 */ { fn: "RecognizeBuildingProgram", mode: "parse", text: "I would rather describe the building in prose." },
    /* 5 */ { fn: "CritiqueWorkshopRound", mode: "render", args: readJson(`${CRIT}/inputs.json`),
              images: { concept: PX, renders: [PX, PX, PX, PX] } },
    /* 6 */ { fn: "CritiqueWorkshopRound", mode: "parse", text: read(`${CRIT}/reply-revise.txt`) },
    /* 7 */ { fn: "CritiqueWorkshopRound", mode: "parse", text: read(`${CRIT}/reply-done.txt`) },
    /* 8 */ { fn: "CritiqueWorkshopRound", mode: "parse", text: "The roof looks flat; I would revise it." },
    /*  9 */ { fn: "AuthorMaterialStory", mode: "render", args: readJson("src/baml/fixtures/vernacular/inputs.json") },
    /* 10 */ { fn: "AuthorMaterialStory", mode: "parse", text: read("src/baml/fixtures/vernacular/reply.txt") },
    /* 11 */ { fn: "AuthorMaterialStory", mode: "parse", text: "It is a cold place; they build with what they have." },
    /* 12 */ { fn: "DecomposeBrushBacklog", mode: "render", args: readJson("src/baml/fixtures/decompose/inputs.json") },
    /* 13 */ { fn: "DecomposeBrushBacklog", mode: "parse", text: read("src/baml/fixtures/decompose/reply.txt") },
    /* 14 */ { fn: "DecomposeBrushBacklog", mode: "parse", text: "You need a roof brush and a wall brush." },
    /* 15 */ { fn: "DiagnoseBuild", mode: "render", args: readJson(`${DIAG}/inputs.json`),
               images: { concept: PX, renders: [PX, PX, PX, PX] } },
    /* 16 */ { fn: "DiagnoseBuild", mode: "parse", text: read(`${DIAG}/reply.txt`) },
    /* 17 */ { fn: "DiagnoseBuild", mode: "parse", text: "The roof looks pale and the walls are bare." },
    /* 18 */ { fn: "RouteCritique", mode: "render", args: readJson(`${ROUTE}/inputs.json`) },
    /* 19 */ { fn: "RouteCritique", mode: "parse", text: read(`${ROUTE}/reply.txt`) },
    /* 20 */ { fn: "RouteCritique", mode: "parse", text: read(`${ROUTE}/reply-bad-idiom.txt`) },
  ]);
});

test("FX-R1 recognition render is byte-identical to the committed live records (cottage, barn)", () => {
  assert.ok(R[0].ok && R[1].ok, R[0].error ?? R[1].error);
  assert.equal(sha256(R[0].prompt), cottageReplies.promptSha256, "cottage prompt sha drifted");
  assert.equal(sha256(R[1].prompt), barnReplies.promptSha256, "barn prompt sha drifted");
  assert.equal(R[0].images.length, 2, "concept + sketch sheet, in template order");
});

test("FX-R2 b.parse over the committed ACCEPTED raw replies equals the committed programs", () => {
  for (const [i, key] of [[2, "cottage"], [3, "barn"]]) {
    assert.ok(R[i].ok, `${key}: ${R[i].error}`);
    assert.deepEqual(dropNulls(R[i].parsed), dropNulls(readJson(`${REC}/${key}.program.json`)),
      `${key}: typed parse must match the committed program`);
  }
});

test("FX-R3 a malformed reply rejects (prose is not a program)", () => {
  assert.equal(R[4].ok, false);
});

test("FX-C1 critique render is byte-identical to the captured golden (the retired .mjs builder's output)", () => {
  assert.ok(R[5].ok, R[5].error);
  assert.equal(R[5].prompt, read(`${CRIT}/prompt.golden.txt`), "critique prompt drifted from the golden");
  assert.equal(R[5].images.length, 5, "concept + 4 azimuth renders, in template order");
});

test("FX-C2 b.parse over the canonical replies equals the pinned expectations (revise + done)", () => {
  for (const [i, name] of [[6, "revise"], [7, "done"]]) {
    assert.ok(R[i].ok, `${name}: ${R[i].error}`);
    assert.deepEqual(dropNulls(R[i].parsed), readJson(`${CRIT}/expected-${name}.json`), name);
  }
});

test("FX-C3 a malformed critique reply rejects (prose is not a reply)", () => {
  assert.equal(R[8].ok, false);
});

test("FX-V1 vernacular renders stably from the minted inputs and parses the minted reply", () => {
  assert.ok(R[9].ok, R[9].error);
  assert.equal(R[9].prompt, read("src/baml/fixtures/vernacular/prompt.txt"), "vernacular prompt drifted from mint");
  assert.equal(sha256(R[9].prompt), readJson("src/baml/fixtures/vernacular/ledger.json").promptSha256);
  assert.ok(R[10].ok, R[10].error);
  assert.deepEqual(dropNulls(R[10].parsed), readJson("src/baml/fixtures/vernacular/expected.json"));
  assert.equal(R[11].ok, false, "prose is not a material story");
});

test("FX-DB1 DiagnoseBuild (Layer A) renders byte-identical to the committed golden (barn grounding)", () => {
  assert.ok(R[15].ok, R[15].error);
  assert.equal(R[15].prompt, read(`${DIAG}/prompt.golden.txt`), "diagnose prompt drifted from the golden");
  assert.equal(R[15].images.length, 5, "concept + 4 azimuth renders, in template order");
  // the prompt is GROUNDED, not vacuous: the recognized program + the style vocabulary + the enum
  assert.match(R[15].prompt, /THE RECOGNIZED PROGRAM/);
  assert.match(R[15].prompt, /"idiom": "roof\.gable"/);
  assert.match(R[15].prompt, /CHIMNEY, OPENING, ROOF, ROOM, WALL/); // departments single-sourced
  // the per-PACK naming vocabulary (T-186-01 / E-47): the rustic materials/idioms the judge uses to
  // NAME departures — NOT the standard. The CONCEPT IMAGE is the standard the build is graded against.
  assert.match(R[15].prompt, /NAMING VOCABULARY/);
  assert.match(R[15].prompt, /THE STANDARD IS THE CONCEPT IMAGE/);
  assert.match(R[15].prompt, /ROOF: materials roof\.field → spruce_planks/);
  assert.match(R[15].prompt, /WALLS:.*timber-frame/);
});

test("FX-DB2 b.parse over the canonical reply equals the minted Critique; fields are non-vacuous", () => {
  assert.ok(R[16].ok, R[16].error);
  assert.deepEqual(dropNulls(R[16].parsed), readJson(`${DIAG}/expected.json`), "diagnose parse drifted");
  const items = R[16].parsed.items;
  assert.ok(items.length >= 3, "the captured golden spans ≥3 departments");
  for (const it of items) {
    assert.ok(DEPARTMENTS.includes(it.department), `department ${it.department} must be in the enum`);
    // the falsifiable-claim guard: structure must NOT be filled with vacuous text
    assert.ok(it.expected.trim() && it.present.trim() && it.missing.trim(),
      "expected/present/missing must be non-empty (non-vacuous diagnosis)");
    // T-170-01: Layer A now emits the typed `kind` discriminator on EVERY item.
    assert.ok(["add", "replace", "remove"].includes(it.kind),
      `kind ${it.kind} must be one of add/replace/remove (the typed discriminator is emitted)`);
  }
  // T-170-01 — the BO11 separation, proven on a real parsed item: the WALL item has the RIGHT base
  // material (cobblestone) with a MISSING DETAIL (the dressed quoins/plinth) — the F1 shape that the
  // STRUCTURAL rule (present+missing both non-empty) mis-classed "wrong-style" and capped. The judge
  // tags it `add`, NOT `replace`, and the scoring core (which already reads `kind`) reads it "absent"
  // — so it no longer caps the score. This is the whole point of the typed tag, asserted end-to-end.
  const wall = items.find((i) => i.department === "WALL");
  assert.ok(wall, "the canonical diagnosis carries a WALL item");
  assert.equal(wall.kind, "add", "the right-base-material/missing-detail WALL item is tagged add (not replace)");
  assert.equal(itemStyleClass(wall), "absent", "kind=add ⇒ itemStyleClass absent ⇒ the over-cap is lifted");
  // and a present-but-WRONG-material item (ROOF: spruce where dark_oak is called for) stays `replace`,
  // so the two classes SEPARATE within one critique (not collapsed to a single tag).
  const roof = items.find((i) => i.department === "ROOF");
  assert.equal(roof.kind, "replace", "the wrong-material ROOF item is tagged replace");
  assert.equal(itemStyleClass(roof), "wrong-style", "kind=replace ⇒ itemStyleClass wrong-style (capping)");
  // SAP behaviour for DiagnoseBuild (characterized in T-163-01's critique-contract.test.mjs): BARE
  // PROSE (no JSON object) REJECTS (R[17], CC3's family), while a JSON object whose item carries an
  // UNKNOWN department DROPS that item to {items:[]} (CC2 — the typing is a filter, not a gate).
  // T-164-02's reply gate must therefore treat an emptied list as malformed; b.parse alone will not.
  assert.equal(R[17].ok, false, "bare prose with no JSON object must fail to coerce to a Critique");
});

test("FX-RT1 RouteCritique (Layer B) renders byte-identical to the golden; the menu is real + single-sourced", () => {
  assert.ok(R[18].ok, R[18].error);
  assert.equal(R[18].prompt, read(`${ROUTE}/prompt.golden.txt`), "route prompt drifted from the golden");
  assert.equal(R[18].images.length, 0, "the router takes no images");
  // the candidate menu lists every department with its real idioms (the single composition point)
  assert.match(R[18].prompt, /ROOF: dormer, roof\.gable/);
  assert.match(R[18].prompt, /WALL: .*\bquoin\b/);
  assert.match(R[18].prompt, /OPENING: arch, head\.flat, opening-dressing/);
});

test("FX-RT2 b.parse over the canonical route reply equals the minted Dispatch; why is non-vacuous", () => {
  assert.ok(R[19].ok, R[19].error);
  assert.deepEqual(dropNulls(R[19].parsed), readJson(`${ROUTE}/expected.json`), "route parse drifted");
  const items = R[19].parsed.items;
  assert.equal(items.length, 3, "three dispatched items (ROOF/WALL/OPENING)");
  assert.deepEqual(items.map((i) => i.department), ["ROOF", "WALL", "OPENING"]);
  for (const it of items) {
    assert.ok(DEPARTMENTS.includes(it.department), `department ${it.department} in the enum`);
    assert.ok(it.idiom.trim() && it.why.trim(), "idiom + why non-vacuous");
  }
  // SAP leniency, same family as DiagnoseBuild: a JSON object whose item routes to an idiom OUTSIDE its
  // department still PARSES (b.parse types the string idiom; it cannot know the registry). The membership
  // failure is resolveDispatch's (src/workshop/route.mjs, RT3) — b.parse alone will not catch it. R[20]
  // is that specimen: it parses ok here, and route.test.mjs proves resolveDispatch throws on it.
  assert.ok(R[20].ok, "an off-department idiom string still parses (membership is resolveDispatch's gate)");
});

test("FX-D1 decompose renders stably from the minted inputs and parses the minted reply", () => {
  assert.ok(R[12].ok, R[12].error);
  assert.equal(R[12].prompt, read("src/baml/fixtures/decompose/prompt.txt"), "decompose prompt drifted from mint");
  assert.equal(sha256(R[12].prompt), readJson("src/baml/fixtures/decompose/ledger.json").promptSha256);
  assert.ok(R[13].ok, R[13].error);
  const parsed = dropNulls(R[13].parsed);
  assert.deepEqual(parsed, readJson("src/baml/fixtures/decompose/expected.json"));
  // the schema forces the T-131 duplicate-vs-registry distinction, both ways
  assert.ok(parsed.items.length > 0, "new needs become work items");
  assert.ok(parsed.parametrization_notes.length > 0, "owned coverage becomes notes, not duplicates");
  // PINNED LENIENCY: a class of ONLY array fields never rejects — SAP degrades any malformed
  // reply (prose included) to the EMPTY backlog. The T-131 runner's reply gate must therefore
  // classify the empty union (no items AND no notes) as MALFORMED; b.parse alone cannot.
  assert.ok(R[14].ok, "SAP leniency: prose coerces to an empty backlog (see note)");
  assert.deepEqual(dropNulls(R[14].parsed), { items: [], parametrization_notes: [] });
});
