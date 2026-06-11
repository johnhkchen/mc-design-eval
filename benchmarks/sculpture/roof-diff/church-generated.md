# roof-diff — church (generated)

Band floor 7; regions {"slopes":90,"ridge":28,"eaves":26,"ends":23}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.795 | 1636 (extra 1253 / missing 383) | wall 807 |
| +x-z (135°) | 0.84 | 1185 (extra 234 / missing 951) | wall 830 |
| -x-z (225°) | 0.819 | 1953 (extra 1425 / missing 528) | wall 1251 |
| -x+z (315°) | 0.777 | 1919 (extra 644 / missing 1275) | wall 1032 |

Cross-azimuth: 6693 px, roof share 41.431%, worst view -x-z.

- **gable-roof-3-roof-7** ridge Δ(eave-rel) rmse 4.824 max -12.137; rakes: lo@-7 (unfitted) rmse 10.573, hi@1 (unfitted) rmse 3.872
- **hip-cap-mass-1** ridge Δ(eave-rel) rmse 1.145 max 1.999; rakes: lo@-19 (unfitted) rmse 0.457, hi@-8 (unfitted) rmse 0.554

Reproducible: byte-identical ×2 (sha256 7374059b9ed6…).
