detail-2 beats input on the glance, though the gain is modest at this render size. Against the concept, the stepped foot, the minaret corbels and the wing pilasters now read, and the dome has a tonal gradient. The window surrounds, sills and arch lintels are too small to judge at 300px, so I haven't verified them.

- **Treatments kept:** `cornice stepped` on row 2 as the foot, `cornice stepped` on row 8, `cornice bracketed` on row 28, window `frames`/`sills`/`lintels arch`, `pilasters every 5 ... out 1`, minaret `courses 6` and stair corbels, the iwan `gradient` with F protected, and the dome/terrace `gradient` and `vary`.
- **Substitutions:** `plinth` only acts on the ground row, so row 2 uses a stepped cornice instead. Roof coping is limited to the terrace rim (`roof rows 0-8 where E`), because `edge` also caught every dome step. Coping and cornice use the stairs form, since quartz has no wall form (the wall form fell back to end_stone_brick_wall, which reads yellow).
- **Wrote 0:** job 1's `frames quartz_block` on rows 3-5. The panels are depth-1 recesses and `frames` only sees depth ≥2, so the panels are left as they were.
- **Face list:** I painted with `--face north,east,south,west,roof`, not `north,roof`, so `ALL FACES` covers all four walls. The legend letters are identical across these lists.
- **Other:** `$MCD` in zsh doesn't word-split, so I called `node .../mcd.mjs` directly. The output box grew by 1,0,1, and the tool reports the function intact.

Files: `rules.txt`, `detail-2.nbt` (3245 cells), `detail-2-compare.png`. `input.nbt` is untouched.
