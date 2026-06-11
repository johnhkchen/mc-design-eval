# roof-diff — church (generated)

Band floor 7; regions {"slopes":90,"ridge":28,"eaves":26,"ends":23}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.795 | 1642 (extra 1260 / missing 382) | wall 822 |
| +x-z (135°) | 0.837 | 1206 (extra 234 / missing 972) | wall 835 |
| -x-z (225°) | 0.819 | 1953 (extra 1425 / missing 528) | wall 1251 |
| -x+z (315°) | 0.763 | 2047 (extra 690 / missing 1357) | wall 1155 |

Cross-azimuth: 6848 px, roof share 40.669%, worst view -x+z.

- **gable-roof-3-roof-7** ridge Δ(eave-rel) rmse 5.075 max -12.137; rakes: lo@-7 (unfitted) rmse 11.04, hi@1 (unfitted) rmse null
- **hip-cap-mass-1** ridge Δ(eave-rel) rmse 1.074 max -1.752; rakes: lo@-19 (unfitted) rmse 0.457, hi@-8 (unfitted) rmse 0.446

Reproducible: byte-identical ×2 (sha256 b5f6aed4d299…).
