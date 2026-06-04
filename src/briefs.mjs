// Shared target & style briefs (T-004-02).
//
// Spec §7 holds the build set and the style brief CONSTANT across the three
// prompting archetypes (single-shot, multi-shot, multimodal) — only the archetype
// varies. So the target/style briefs are shared data, not single-shot's property:
// this module is imported by single-shot.mjs today and by the sibling archetypes
// later, so all three build the same targets in the same style from one source.
//
// Pure, frozen data — no logic, no I/O. Each brief is the spec §8 capability
// statement turned into a buildable brief. `house` is the milestone target
// (T-004-03); `path`/`landscape` are spec-§8 data, ready for the Phase-1 3×3
// matrix (spec §11 step 2) without new code.

/**
 * @typedef {Object} TargetBrief
 * @property {string} headline  one-line statement of the target + the capability it probes
 * @property {string} brief     the buildable brief handed to the model
 */
/**
 * @typedef {Object} StyleBrief
 * @property {string} name   the named style (lands in the artifact's style.name)
 * @property {string} brief  architectural/aesthetic intent, paired with the palette's material description
 */

/**
 * Build targets, keyed by the design-artifact schema's `metadata.target` enum
 * (house | path | landscape). The difficulty ladder of spec §8.
 * @type {Readonly<Record<"house"|"path"|"landscape", TargetBrief>>}
 */
export const TARGET_BRIEFS = Object.freeze({
  house: Object.freeze({
    headline: "House — a bounded volume with interior logic; tests coherent enclosed-structure design.",
    brief:
      "Design a house — an enclosed, genuinely habitable dwelling: a clear footprint, " +
      "walls, a roof, doorways, and windows, with an interior that reads as livable " +
      "(distinct rooms, a floor, headroom) rather than a solid block. Be ambitious and " +
      "detailed — there is no size cap: give it considered proportion, varied massing " +
      "(setbacks, a porch or eave, a chimney), and depth at every surface (recessed " +
      "openings, window framing, trim, a roof with real overhang). Exploit the placement " +
      "DSL fully — fill/box for masses, line for edges, and voxel with block state " +
      "(stairs/slabs, facing/half) for steps, sills, eaves, and trim — so surfaces are " +
      "articulated rather than flat cuboids, and roofs are not all uniform 45° slopes. " +
      "Proportion and detail are what the design is judged on; scale it to read as a " +
      "real, well-built home, not a hut.",
  }),
  path: Object.freeze({
    headline: "Path — linear continuity that follows terrain; tests holding a constraint across distance.",
    brief:
      "Design a path — a linear route that holds a consistent width, grade, and material " +
      "across its whole length rather than within a single footprint; the challenge is " +
      "continuity over distance. Make it crafted, not a flat strip: defined edging and " +
      "surface texture, steps or ramps where the grade changes, borders or drainage, and " +
      "occasional landmarks (markers, lamps, a small bridge) that punctuate the way " +
      "without breaking its identity. Use the DSL fully — voxel with block state " +
      "(stairs/slabs) for steps, kerbs, and ramps — so the route reads as deliberately " +
      "built rather than a uniform 45° ribbon. Proportion (width-to-length, step rhythm) " +
      "and detail are what the design is judged on.",
  }),
  landscape: Object.freeze({
    headline: "Landscape — open composition with no single correct footprint; tests material/aesthetic judgment.",
    brief:
      "Design a landscape composition — an open arrangement with no single correct " +
      "footprint, where geometry does not pin the answer down; the challenge is material " +
      "and aesthetic judgment. Be ambitious: layered terrain and elevation, planting, " +
      "water, paths, and one or more focal features (a folly, statue, terrace, or grove), " +
      "composed with balance, rhythm, and texture. Use the DSL fully — voxel with block " +
      "state for slopes, banks, terraces, and trim — so forms are sculpted rather than " +
      "blocky, avoiding uniform 45° faces. Proportion, composition, and detail are what " +
      "the design is judged on; aim for real scope and richness.",
  }),
});

/**
 * Named styles, keyed by style name. Each pairs an architectural intent with a
 * style palette's material description (the palette supplies the binding block set;
 * the brief supplies the aesthetic the model commits to in `style.rationale`).
 * @type {Readonly<Record<string, StyleBrief>>}
 */
export const STYLE_BRIEFS = Object.freeze({
  industrial: Object.freeze({
    name: "industrial",
    brief:
      "Utilitarian industrial: expose the structure rather than dress it. Bare " +
      "concrete and stone, dark and unpainted metal, oxidized copper, functional " +
      "glazing, and stark task lighting. Greys and irons over warm or decorative " +
      "materials; let load-bearing elements, framing, and fixtures be visible and " +
      "read as a working, functional building.",
  }),
  neoclassical: Object.freeze({
    name: "neoclassical",
    brief:
      "Neoclassical: classical order in pale stone, governed by symmetry and " +
      "proportion. Front the building with a columned portico — a row of evenly " +
      "spaced columns (shaft, capital, and base) carrying a projecting entablature " +
      "and cornice, crowned by a triangular pediment. Raise the whole on a stepped " +
      "base (a stylobate of broad stone steps) so it reads as elevated and formal. " +
      "Use tall, regularly-rhythmed windows and carved horizontal banding; keep both " +
      "elevations and plan bilaterally symmetric about a central axis. Favor crisp " +
      "white marble and ashlar over rustic or colored materials. Reward detail and " +
      "scale — fluting, mouldings, a balustrade, depth in the cornice — over a plain " +
      "box; the silhouette and trim should make the order legible from a distance.",
  }),
});
