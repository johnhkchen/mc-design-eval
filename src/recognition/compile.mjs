// The program compiler — building-program/v1 → workshop-program/v1 (T-125-01, story S-125,
// epic E-31). The deterministic lowering: the model's recognized idiom instances (roles, counts,
// rhythm) become concrete registry elements (blocks, cells-to-be) plus the conformance
// DECLARATIONS the workshop gate runs every round. PURE — consumes exactly (program, pack);
// never the sketch, never a mesh, no tolerances (E-31 Rule 3: the canonical realization wins).
// The committed program is therefore a CLOSED replay input: program + pack → byte-identical
// workshop program → byte-identical artifact (Rule 5).
//
// ROLES RESOLVE HERE, ONCE. Every block in the compiled output comes from roleBlock(pack, role)
// or from the pack's own idiom params — in-pack by construction, so `palette-in-pack` cannot
// fail. No block name is ever DERIVED (no "_stairs" suffixing — the voxel-palette lesson): the
// roof's stair/slab members ride only when the program's field role matches the pack's declared
// roof family; any other field realizes as full cubes, honestly chunky rather than mismatched.
//
// LAYOUT IS RHYTHM, NOT FITTING: openings and dormers distribute evenly within their wall/slope
// at a spacing chosen inside the pack's openingRhythm band — regularity by construction (Rule 4).
// Declarations are DECLARED, never inferred from cells (the cage-solid-shells lesson): bands
// carry exactly the blocks this compiler assigned to each y-slice; openings carry the world
// AABBs it computed (the watertight allow-regions; rhythm groups are per program entry).

import { WORKSHOP_PROGRAM_SCHEMA } from "../workshop/program.mjs";
import { ROOF_LAYOUTS, headRows, openingLanes } from "./program.mjs";

const fail = (msg) => { throw new Error(`compileProgram: ${msg}`); };

/** Resolve a pack palette role to its block id — the ONE role→block point. */
export function roleBlock(pack, role) {
  const entry = pack.palette.find((p) => p.role === role);
  if (!entry) fail(`role "${role}" is not in the pack palette`);
  return entry.block;
}

/** Wall-plane geometry over an inclusive footprint rect (matches boxShell's WALL_PLANES). */
function planeOf(rect, wall) {
  const x1 = rect.x0 + rect.w - 1;
  const z1 = rect.z0 + rect.d - 1;
  switch (wall) {
    case "+x": return { fixed: x1, uAxis: "z", uLo: rect.z0 + 1, uHi: z1 - 1, out: +1 };
    case "-x": return { fixed: rect.x0, uAxis: "z", uLo: rect.z0 + 1, uHi: z1 - 1, out: -1 };
    case "+z": return { fixed: z1, uAxis: "x", uLo: rect.x0 + 1, uHi: x1 - 1, out: +1 };
    case "-z": return { fixed: rect.z0, uAxis: "x", uLo: rect.x0 + 1, uHi: x1 - 1, out: -1 };
    default: return fail(`unknown wall "${wall}"`);
  }
}

/**
 * Even distribution of items (given widths, in order) over the inclusive column range
 * [uLo, uHi], with ONE inter-item gap chosen INSIDE [minGap, maxGap] (closest to balancing the
 * edge margins; smaller gap wins ties — deterministic). Returns each item's first column.
 */
export function layoutRun({ uLo, uHi, widths, minGap, maxGap }) {
  const avail = uHi - uLo + 1;
  const totalW = widths.reduce((s, w) => s + w, 0);
  let best = null;
  for (let g = minGap; g <= maxGap; g++) {
    const leftover = avail - (totalW + (widths.length - 1) * g);
    if (leftover < 0) break;
    const score = Math.abs(leftover / 2 - g);
    if (best === null || score < best.score) best = { g, leftover, score };
  }
  if (best === null) fail(`widths [${widths}] cannot lay out in ${avail} columns at gaps [${minGap}, ${maxGap}]`);
  let u = uLo + Math.floor(best.leftover / 2);
  return widths.map((w) => { const at = u; u += w + best.g; return at; });
}

/**
 * Merge a lane's entries into ONE display sequence by ideal-position spreading (each entry's
 * instances spread evenly across the lane; a singleton centers between them — door flanked by
 * its windows). Deterministic: ties break by declaration order. Returns lane instances in
 * left-to-right order, each {entry, instance}.
 */
export function laneSequence(lane) {
  const n = lane.entries.reduce((s, e) => s + e.count, 0);
  const items = [];
  for (const e of lane.entries) {
    for (let i = 0; i < e.count; i++) {
      items.push({ entry: e, instance: i, ideal: ((i + 0.5) * n) / e.count - 0.5 });
    }
  }
  items.sort((a, b) => a.ideal - b.ideal || a.entry.index - b.entry.index);
  return items.map(({ entry, instance }) => ({ entry, instance }));
}

/** The roof's {field, stairs, slab} family: stair/slab members ride ONLY when the program's
 *  field role resolves to the pack roof idiom's own declared field (no name derivation). */
function roofBlocks(pack, roofIdiomName, fieldBlock) {
  const params = pack.idioms.find((i) => i.name === roofIdiomName)?.params?.blocks ?? null;
  if (params && params.field === fieldBlock) {
    return { field: fieldBlock, stairs: params.stairs ?? null, slab: params.slab ?? null };
  }
  return { field: fieldBlock, stairs: null, slab: null };
}

/**
 * Compile a validated building program against its (validated) pack.
 * @param {object} program  assertBuildingProgram + validateProgramAgainstPack first
 * @param {object} pack
 * @returns {{workshopProgram: object}}  workshop-program/v1, declarations included
 */
export function compileProgram(program, pack) {
  const rhythm = pack.proportions.openingRhythm;
  const dormerStyle = pack.idioms.find((i) => i.name === "dormer")?.params ?? {};
  const chimneyStyle = pack.idioms.find((i) => i.name === "chimney")?.params ?? {};

  const elements = [];
  const extents = []; // {block, yLo, yHi} — feeds the band declarations
  const openingDecls = [];
  const note = (block, yLo, yHi) => extents.push({ block, yLo, yHi });

  let groundTopOfPrimary = null;
  let primaryArea = -1;
  const eaveYs = [];
  const tops = [];

  for (const m of program.masses) {
    const rect = m.rect;
    const x1 = rect.x0 + rect.w - 1;
    const z1 = rect.z0 + rect.d - 1;
    const sh = m.storeyHeight;
    const eaveY = m.storeys * sh;
    eaveYs.push(eaveY);
    if (rect.w * rect.d > primaryArea) {
      primaryArea = rect.w * rect.d;
      groundTopOfPrimary = sh - 1;
    }

    const groundBlock = roleBlock(pack, m.walls.ground.role);
    const upperBlock = roleBlock(pack, m.walls.upper.role);
    const dressBlock = m.walls.dressing ? roleBlock(pack, m.walls.dressing.role) : null;

    // --- openings: per-lane joint layout (the door and its flanking windows share one rhythm),
    //     TRUE holes whose height includes the head rows; world-AABB declarations per instance.
    //     Rhythm declaration groups: per ENTRY on single-entry lanes (the gate verifies spacing
    //     + shared sill); per INSTANCE on joint lanes (mixed sills/widths — recorded, vacuous).
    const shellOpenings = [];
    const placedOpenings = []; // {entry, u, plane} — heads consume these positions
    for (const lane of openingLanes(m.openings)) {
      const plane = planeOf(rect, lane.wall);
      const seq = laneSequence(lane);
      const us = layoutRun({
        uLo: plane.uLo, uHi: plane.uHi,
        widths: seq.map((s) => s.entry.w),
        minGap: rhythm.minSpacing, maxGap: rhythm.maxSpacing,
      });
      const joint = lane.entries.length > 1;
      seq.forEach((s, i) => {
        const o = s.entry;
        const u = us[i];
        const rows = headRows(o.head ?? null, o.w);
        shellOpenings.push({ wall: lane.wall, at: [u, o.sill], w: o.w, h: o.h + rows });
        placedOpenings.push({ entry: o, u, plane });
        const lo = plane.uAxis === "x" ? [u, o.sill, plane.fixed] : [plane.fixed, o.sill, u];
        const hi = plane.uAxis === "x"
          ? [u + o.w - 1, o.sill + o.h + rows - 1, plane.fixed]
          : [plane.fixed, o.sill + o.h + rows - 1, u + o.w - 1];
        const group = joint ? `${m.id}:${lane.wall}#${o.index}.${s.instance}` : `${m.id}:${lane.wall}#${o.index}`;
        openingDecls.push({ wall: group, kind: o.kind, min: lo, max: hi });
      });
    }
    elements.push({
      id: `${m.id}-shell`, kind: "shell",
      spec: {
        footprint: { x0: rect.x0, x1, z0: rect.z0, z1 },
        y0: 0, height: eaveY, wallBlock: upperBlock,
        courses: [{ yRange: [0, sh - 1], block: groundBlock }],
        openings: shellOpenings,
      },
    });
    note(groundBlock, 0, sh - 1);
    if (eaveY - 1 >= sh) note(upperBlock, sh, eaveY - 1);

    // --- plinth ---
    if (m.plinth) {
      const block = roleBlock(pack, m.plinth.role);
      elements.push({
        id: `${m.id}-plinth`, kind: "idiom", idiom: "plinth",
        spec: { footprint: { x0: rect.x0, x1, z0: rect.z0, z1 }, y0: 0, courses: m.plinth.courses, block },
      });
      note(block, 0, m.plinth.courses - 1);
    }

    // --- jetty: bressummer + joists at the upper storey's floor line ---
    if (m.jetty) {
      const beamBlock = roleBlock(pack, m.jetty.beamRole);
      const joistBlock = m.jetty.joistRole ? roleBlock(pack, m.jetty.joistRole) : null;
      for (const wall of m.jetty.walls) {
        const axis = wall.endsWith("x") ? "z" : "x"; // the axis the edge RUNS ALONG
        const at = wall === "+x" ? x1 : wall === "-x" ? rect.x0 : wall === "+z" ? z1 : rect.z0;
        const range = axis === "x" ? [rect.x0, x1] : [rect.z0, z1];
        elements.push({
          id: `${m.id}-jetty-${wall}`, kind: "idiom", idiom: "jetty",
          spec: { edge: { axis, at, side: wall[0], range }, y: sh, beamBlock, joistBlock },
        });
      }
      note(beamBlock, sh, sh);
      if (joistBlock) note(joistBlock, sh - 1, sh - 1);
    }

    // --- roof: footprint widened one cell past each EAVE edge (the eave stays the widest layer) ---
    const layout = ROOF_LAYOUTS[m.roof.idiom];
    const fieldBlock = roleBlock(pack, m.roof.fieldRole);
    const blocks = roofBlocks(pack, m.roof.idiom, fieldBlock);
    const allEaves = !layout.ridge || m.roof.idiom === "roof.hip";
    const ex = { // expanded footprint
      x0: rect.x0 - (allEaves || m.roof.ridgeAxis === "z" ? 1 : 0),
      x1: x1 + (allEaves || m.roof.ridgeAxis === "z" ? 1 : 0),
      z0: rect.z0 - (allEaves || m.roof.ridgeAxis === "x" ? 1 : 0),
      z1: z1 + (allEaves || m.roof.ridgeAxis === "x" ? 1 : 0),
    };
    const pitch = m.roof.pitchClass;
    let ridgeY;
    if (layout.ridge) {
      const perpSpan = m.roof.ridgeAxis === "x" ? ex.z1 - ex.z0 + 1 : ex.x1 - ex.x0 + 1;
      ridgeY = eaveY + Math.max(1, Math.round(pitch * Math.floor((perpSpan - 1) / 2)));
      elements.push({
        id: `${m.id}-roof`, kind: "idiom", idiom: m.roof.idiom,
        spec: { footprint: ex, ridgeAxis: m.roof.ridgeAxis, eaveY, ridgeY, pitch, blocks },
      });
    } else {
      const half = Math.floor((Math.min(ex.x1 - ex.x0, ex.z1 - ex.z0)) / 2);
      ridgeY = eaveY + Math.max(1, Math.round(pitch * half));
      elements.push({
        id: `${m.id}-roof`, kind: "idiom", idiom: m.roof.idiom,
        spec: { footprint: ex, eaveY, pitch, blocks },
      });
    }
    for (const b of [blocks.field, blocks.stairs, blocks.slab]) if (b) note(b, eaveY, ridgeY);
    tops.push(ridgeY);

    // --- dormers: evenly spaced along the ridge on one eave-side slope ---
    if (m.roof.dormers) {
      const facing = m.roof.dormers.wall ?? (m.roof.ridgeAxis === "x" ? "+z" : "+x");
      const width = dormerStyle.width ?? 3;
      const lane = m.roof.ridgeAxis === "x" ? { uLo: rect.x0 + 1, uHi: x1 - 1 } : { uLo: rect.z0 + 1, uHi: z1 - 1 };
      const us = layoutRun({ ...lane, widths: Array(m.roof.dormers.count).fill(width), minGap: 1, maxGap: Math.max(1, rhythm.maxSpacing) });
      // front face sits on the WALL plane (not the eave edge): the main roof's SOLID courses
      // back the face one cell in, so the dormer light is a sealed niche and the cheeks embed
      // in solid — watertight with stair-roofed dormers (stairs are fixtures and never seal)
      const front = facing === "+x" ? x1 : facing === "-x" ? rect.x0 : facing === "+z" ? z1 : rect.z0;
      us.forEach((u, i) => {
        const center = u + (width - 1) / 2;
        const origin = facing.endsWith("x") ? [front, eaveY + 1, center] : [center, eaveY + 1, front];
        elements.push({
          id: `${m.id}-dormer-${i}`, kind: "idiom", idiom: "dormer",
          spec: { origin, facing, width, depth: dormerStyle.depth ?? 3, wallHeight: dormerStyle.wallHeight ?? 2,
                  wallBlock: dormerStyle.wallBlock ?? upperBlock, roofBlock: dormerStyle.roofBlock ?? blocks.stairs ?? blocks.field,
                  faceBlock: dormerStyle.faceBlock ?? upperBlock, ridgeBlock: dormerStyle.ridgeBlock ?? blocks.field,
                  // 1×1 light: the construct's default 1×2 face hole would orphan the ridge row
                  // (the face center column is the ridge's only 6-connection)
                  aperture: { w: 1, h: 1 } },
        });
      });
      for (const b of [dormerStyle.wallBlock ?? upperBlock, dormerStyle.roofBlock ?? blocks.stairs ?? blocks.field,
                       dormerStyle.faceBlock ?? upperBlock, dormerStyle.ridgeBlock ?? blocks.field]) {
        note(b, eaveY, ridgeY + 2);
      }
      tops.push(ridgeY + 2);
    }

    // --- chimney: through the roof on the ridge line, crowning two courses above it ---
    if (m.chimney) {
      const block = roleBlock(pack, m.chimney.role);
      const capBlock = roleBlock(pack, m.chimney.capRole);
      const axis = layout.ridge ? m.roof.ridgeAxis : (rect.w >= rect.d ? "x" : "z");
      const lo = axis === "x" ? rect.x0 + 1 : rect.z0 + 1;
      const hi = axis === "x" ? x1 - 1 : z1 - 1;
      const along = m.chimney.atEnd === "lo" ? lo : m.chimney.atEnd === "hi" ? hi : Math.floor((lo + hi) / 2);
      const across = axis === "x" ? Math.floor((rect.z0 + z1) / 2) : Math.floor((rect.x0 + x1) / 2);
      const base = axis === "x" ? [along, eaveY, across] : [across, eaveY, along];
      const height = ridgeY + 2 - eaveY + 1;
      elements.push({
        id: `${m.id}-chimney`, kind: "idiom", idiom: "chimney",
        spec: { base, footprint: chimneyStyle.footprint ?? { w: 1, d: 1 }, height, block,
                cap: chimneyStyle.cap ?? "crown", capBlock },
      });
      note(block, eaveY, ridgeY + 2);
      note(capBlock, ridgeY + 2, ridgeY + 3);
      tops.push(ridgeY + 3);
    }

    // --- opening heads: arch ring / flat lintel in the dressing material, at the placed columns ---
    const headCounters = new Map();
    for (const { entry: o, u, plane } of placedOpenings) {
      if (!o.head) continue;
      const block = o.headRole ? roleBlock(pack, o.headRole) : dressBlock;
      if (!block) fail(`${m.id}.openings[${o.index}] has a head but no headRole and no walls.dressing role`);
      const rows = headRows(o.head, o.w);
      const spanAxis = plane.uAxis;
      const depthAxis = spanAxis === "x" ? "z" : "x";
      const common = {
        span: { axis: spanAxis, range: [u, u + o.w - 1] },
        yRange: [o.sill, o.sill + o.h + rows - 1],
        depth: { axis: depthAxis, range: [plane.fixed, plane.fixed] },
        block,
      };
      const spec = o.head === "arch"
        ? { ...common, center: [u + (o.w - 1) / 2, o.sill + o.h - 1], radius: o.w / 2 }
        : { ...common, level: o.sill + o.h - 1 };
      const i = headCounters.get(o.index) ?? 0;
      headCounters.set(o.index, i + 1);
      elements.push({
        id: `${m.id}-head-${o.wall}-${o.index}-${i}`, kind: "idiom",
        idiom: o.head === "arch" ? "arch" : "head.flat",
        spec,
      });
      note(block, o.sill, o.sill + o.h + rows - 1);
    }
  }

  // --- declarations: bands as y-slices carrying exactly the blocks assigned there -------------
  const eaveMin = Math.min(...eaveYs);
  const topMax = Math.max(...tops);
  const sliceDefs = [
    { name: "base", yRange: [0, groundTopOfPrimary] },
    ...(eaveMin - 1 >= groundTopOfPrimary + 1 ? [{ name: "upper", yRange: [groundTopOfPrimary + 1, eaveMin - 1] }] : []),
    { name: "roof", yRange: [eaveMin, topMax] },
  ];
  const bands = sliceDefs.map(({ name, yRange }) => {
    const blocks = [...new Set(
      extents.filter((e) => e.yLo <= yRange[1] && e.yHi >= yRange[0]).map((e) => e.block),
    )].sort();
    return { name, yRange, blocks, ...(blocks.length > 1 ? { mixed: true } : {}) };
  });

  const workshopProgram = {
    schema: WORKSHOP_PROGRAM_SCHEMA,
    subject: program.subject,
    pack: program.pack,
    budget: { rounds: 1 }, // this ticket commits the accepted draft; re-sampling is the workshop's
    declarations: { bands, symmetry: null, openings: openingDecls },
    elements,
  };
  return { workshopProgram };
}
