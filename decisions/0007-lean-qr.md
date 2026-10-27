---
status: accepted
date: 2026-10-26
decision-makers: the developer
---

# lean-qr for a QR code

## Context and Problem Statement

A back office shows a QR code that a phone scans, such as a link that pairs a phone or the key of a scanner. A product asked for the part in a proposal pull request on 2026-10-26. A product that draws a code itself can fail in dark mode, because a camera needs dark modules on a light ground. `DESIGN.md` had no QR code. Which library computes the code, and in which form does a product draw it?

## Decision Drivers

1. The library computes the code with no DOM and no network, so that the code renders on the server.
2. The product sets the colors, the quiet zone and the size of a module, so that the code follows `### qr-code` in each mode and in each theme.
3. The level of error correction is at least M, and the largest version is a setting, so that a module never shrinks under 4 px.
4. The library has no dependencies, and its licence permits it in a closed product.
5. A maintainer released it in 2026.
6. Of the options that meet drivers 1 to 5, it adds the least to the page that uses it.

## Considered Options

- lean-qr 2.7.4: `generate` computes the modules, and a small component of the product draws them as one SVG path
- The SVG output of a library, with the quiet zone and the module size as settings
- A port of a reference QR generator, at version 0.1.3
- A QR generator and reader with no dependencies, at version 0.7.2
- The oldest of the four libraries, at version 1.5.4, with three dependencies

## Decision Outcome

Chosen option: "lean-qr 2.7.4: `generate` computes the modules, and a small component of the product draws them as one SVG path", because it met each driver in the test of 2026-10-26. The preview pins `lean-qr` 2.7.4 exactly. `DESIGN.md` holds the part, `### qr-code`, and the preview holds the component in `preview/src/lib/stack/QrCode.svelte`.

### Consequences

- Good, because `generate` takes `minCorrectionLevel` and `maxVersion`. It raises the level to Q or H when the higher level fits in the same version. The key of the showcase took level Q in version 2.
- Good, because the component draws one `<path>` in `currentColor`. So the classes of the tile set both colors in each mode, with no code for a theme.
- Good, because esbuild 0.28.2 bundles `generate` to 6,848 B raw and 3,645 B gzip, the smallest of the four libraries.
- Good, because the package has no dependencies and the MIT licence, and its last release is of 2026-09-07 (npm, read 2026-10-26).
- Bad, because one maintainer publishes it on npm, and its repository has 61 stars and 4 contributors (GitHub, read 2026-10-26).
- Bad, because an error carries a number and no text: a value that is too long throws "lean-qr error 4". The component reads the number 4, which `lean-qr/extras/errors` names "Too much data", and it shows the note of the part.
- Neutral, because the package also holds a command line tool, which the component does not use.

### Confirmation

The test of 2026-10-26 built the component in the preview with lean-qr 2.7.4 pinned exactly. It checked the component in Chromium 1223 through Playwright 1.60.0. Two decoders read each code with no inversion: jsQR 1.4.0 and ZXing in zxing-wasm 3.1.6. Both ran outside the repository.

- **Screens.** The showcase holds four codes. Both decoders read each code from a screenshot in both modes of the default and the graphite theme. The windows were 1440 and 390 px wide, at 1x and 2x. They read 64 codes of 64.
- **Sizes.** A link of 38 bytes took version 3 with modules of 6 px, and a key of 23 bytes took version 2 with modules of 6 px. A link of 113 bytes took version 7 with modules of 4 px. A link of 126 bytes threw the error 4 at `maxVersion: 7`, and the part showed its note.
- **Contrast.** A drawn code at 4.54:1 read in both decoders. At 3.19:1 jsQR read nothing, and ZXing read the code.
- **Forced colors.** With `forced-color-adjust: none` on the tile, both decoders read the code under forced colors in both schemes. Without it, the dark scheme drew white modules on a black tile, and neither decoder read the code.
- **Print.** A PDF of A4 from windows of 1440 and 390 px in dark mode held each code in gray 10 on white. Both decoders read each code at 300 dpi.
- **Camera.** The camera app of the developer's phone read both codes of the showcase that it was given, from the screen of a laptop: the link of 38 bytes, and the link of 113 bytes at 4 px a module (2026-10-26).
- **The four libraries.** Each library encoded the same three values at level M. The values were a link of 38 bytes, an address of 99 bytes with a key, and a text of 40 bytes with Serbian letters. Each library gave the same version for each value. Both decoders read each code at 4 px a module, with a quiet zone of 4 modules.

Firefox, Safari and a screen reader were not tested. A person checks them.

## Pros and Cons of the Options

### lean-qr 2.7.4: `generate` computes the modules, and a small component of the product draws them as one SVG path

- Good, because the test met each driver.
- Bad, because of the one maintainer and the error numbers (Consequences).

### The SVG output of a library, with the quiet zone and the module size as settings

- Good, because the product writes no code for the path.
- Bad, because the quiet zone is a setting with a default. The generator and reader of 0.7.2 draws 2 modules by default, and the port of 0.1.3 draws 1 module (their sources, read 2026-10-26). A product that keeps the default draws less than the 4 modules of the format.
- Bad, because the module size is a setting too, and the product must still pick a whole px for each module.

### A port of a reference QR generator, at version 0.1.3

- Good, because it has no dependencies and the MIT licence. It takes `boostEcc`, `minVersion` and `maxVersion`, and it bundles to 10,215 B raw and 3,883 B gzip.
- Bad, because its version is before 1.0. Its last release, of 2026-04-03, came after a gap from 2023-08-16.

### A QR generator and reader with no dependencies, at version 0.7.2

- Good, because it has no dependencies, the licence is MIT or Apache 2.0, and its last release is of 2026-09-28.
- Bad, because it bundles to 14,733 B raw and 6,618 B gzip, the largest of the three with no dependencies.
- Bad, because its version is before 1.0. It takes a fixed version and no largest version, and no option raises the level.

### The oldest of the four libraries, at version 1.5.4, with three dependencies

- Good, because its own output draws a quiet zone of 4 modules by default (README, read 2026-10-26).
- Bad, because it depends on three packages, and one of them parses a command line for its tool.
- Bad, because its last release is of 2024-08-05. It bundles to 24,865 B raw and 9,605 B gzip for the browser.

## More Information

The facts of the four options, read on 2026-10-26 from npm and from the repository of each:

| Option | Licence | Unpacked | Last release | Dependencies | Bundle, raw and gzip |
|---|---|---|---|---|---|
| lean-qr 2.7.4 | MIT | 68,780 B | 2026-09-07 | none | 6,848 B and 3,645 B |
| The port, 0.1.3 | MIT | 79,278 B | 2026-04-03 | none | 10,215 B and 3,883 B |
| The generator and reader, 0.7.2 | MIT or Apache 2.0 | 539,239 B | 2026-09-28 | none | 14,733 B and 6,618 B |
| The oldest, 1.5.4 | MIT | 135,364 B | 2024-08-05 | 3 | 24,865 B and 9,605 B |

The bundle holds one call that computes the modules at level M, built with esbuild 0.28.2 and `--minify`, and gzip at level 9.

The test found these rules for a product:

- **The modules.** Call `generate(value, { minCorrectionLevel: correction.M, maxVersion: 7 })`. Catch the error with `code` 4 and show the note of the part. Throw every other error again.
- **The quiet zone and the module.** Draw the quiet zone in the component, and never trust the default of a library. Take the largest whole module that fits the tile of 224 px with a quiet zone of 4 modules. Center the code on a whole px.
- **The tile.** Take the classes of `### qr-code`: `background` and `foreground`, swapped in dark mode, and `forced-color-adjust-none`.
