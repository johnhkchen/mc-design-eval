Detail-2 is byte-identical to detail-1 (both sha `58a45be`), and both beat input.

- **Treatments:** texture first (vary/weather on P, gradient base and cobbled plinth 2), then oak-sill-free `sills oak_slab` plus deepslate hoods on north and west openings, deep polished-deepslate cornice on north and west row 17, stepped quartz cornice and coping over the portico, chiseled capitals on the pilasters, roof vary/gradient with a coping lip, and dark-oak courses on the west tower plus a row-8 band.
- **Dropped:** pilaster bases (row 1 has no E under the pilasters, wrote 0) and portico frames (no openings in the selection, wrote 0). Chiseled capitals fall back to deepslate tile stairs because chiseled blocks have no stair form.
- **Judgement calls:** I read the gable-shoulder coping as `north wall tops where T`, and I put the texture rules ahead of the base and wall rules because the language says later rules win.
- **Versus input:** the west-wall render (t1 right-elevation) shows storey bands on the oak tower, window hoods and sills, and a stone plinth where t0 was flat. The front shows the hoods and portico cornice; the north shaft looks a little busier at 300px. The roof coping wrote 178 cells, which reads as an edge lip but is large.
- **Not checked:** I only viewed the t1 renders; detail-2 is the same file, so t2 would match. `mcd paint` reported "function intact"; I did not separately verify function.

Files are in `detail-haiku-high-lang-jobs/`: `rules.txt`, `detail-1.nbt`, `detail-2.nbt`, and the renders in `t0/`, `t1/`, `t2/`.
