// Mass re-recognition (T-136-01, story S-136, epic E-33) — the workshop's re-recognize action
// as a typed BAML function. The model named a PART of its own build and asked to re-read it;
// this prompt re-samples exactly that mass through recognition's native channel (the sketch's
// measured digest — T-123's numbers are the evidence) with the round's critique attached.
//
// E-32 Rule 2 transport: ClaudeStub is render-only; the bridge extracts the rendered request and
// the runner transports via the tiered subscription shim (op "workshop-rerecognize"). The live
// reply gate is parseMassReply (src/workshop/rerecognize.mjs): whole-program substitution
// through the SAME schema + pack-vocabulary gates as recognition, then recompile. ProgramMass
// (recognition.baml) is the typed mirror; the .mjs parser is the authority.

function ReRecognizeMass(
  mass_id: string,
  pack_digest: string,
  sketch_digest: string,
  mass_json: string,
  critique_block: string,
  mass_schema_json: string
) -> ProgramMass {
  client ClaudeStub
  prompt #"
    # Re-read one part of the building

    You are the recognition stage of a Minecraft pattern-book builder, called back by the
    WORKSHOP: while revising its own build against the concept, the builder judged that mass
    "{{ mass_id }}" was mis-read the first time and asked for a re-recognition of that part.

    The builder's critique this round (why the current read is wrong):
    {{ critique_block }}

    The CURRENT program fragment for mass "{{ mass_id }}" (the read being replaced):
    ```json
    {{ mass_json }}
    ```

    Re-read THIS MASS from the sketch's measured digest below — sizes and proportions come from
    the measurements, identity from the pack vocabulary. Keep `id` exactly "{{ mass_id }}";
    change only what the critique implicates and keep everything the critique does not name as
    close to the current fragment as the measurements allow. Round to clean, regular numbers —
    regularity beats mesh fidelity, always. The realizer's layout rules still hold (openings fit
    their wall at minimum spacing; sill + height + head clearance under the wall top; dormers on
    eave-side slopes; jetty needs storeys ≥ 2; every role verbatim from the pack).

    {{ pack_digest }}

    ## The sketch's measured digest

    {{ sketch_digest }}

    ## Output format — STRICT

    Output a SINGLE JSON object for the ONE mass, conforming to the JSON Schema below, and
    NOTHING ELSE — your first character must be `{` and your last `}`. No prose, no code fences.

    JSON Schema (one masses[] item):
    {{ mass_schema_json }}

    Now output ONLY the JSON object, beginning with `{`.
  "#
}
