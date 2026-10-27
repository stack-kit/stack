# Changelog

Each release has a heading `## vX.Y.Z - YYYY-MM-DD` and the sections
Breaking, Added and Fixed. A renamed or removed name is a major version, an
added name is a minor version, and a corrected value is a patch. The release
step writes each entry from the commits since the last tag.

## v1.0.0 - 2026-10-27

### Breaking

- Each release now comes from the public repository
  `https://github.com/stack-kit/stack`. A read of a release needs no
  GitHub login and no key ("Use a release in a product" in
  `README.md`). The package name stays `@stack-kit/stack`. In
  `README.md`, each command that prints the newest tag, clones a tag
  or reads a change log uses the public https address. The change log
  of a tag now comes through `curl` with no login. Before, it came
  through the GitHub API with a `gh` login. A product on v0.9.0 takes
  these steps at this update:
  1. Replace the whole dependency line in `package.json` with this
     line. Then run `npm install`:
     `"@stack-kit/stack": "git+https://github.com/stack-kit/stack.git#v1.0.0"`.
     npm writes the SSH form
     `git+ssh://git@github.com/stack-kit/stack.git#<commit>` into
     `package-lock.json`. But `npm ci` reads the public repository
     over https. So a build host with no SSH key installs the tag
     ("Pin a release with npm").
  2. A project with no Node points its reference clone to the public
     repository with
     `git -C _reference/stack remote set-url origin https://github.com/stack-kit/stack`.
     Then it fetches the tag, as "Update a product to a new release"
     says.
  3. Replace the design line in `AGENTS.md` with the line of "Follow
     the rules for a product" in `README.md`. Its source and its tag
     check name `https://github.com/stack-kit/stack`.
- A proposal is a pull request into `main` of `stack-kit/stack` from a
  branch `proposal/<topic>` of a fork ("Contribute from a product" in
  `README.md`). Before, the branch was `proposal/<product>/<topic>` in
  the repository itself. "Open the pull request" gives the new steps,
  and they still need a `gh` login. A product opens no issue for a
  proposal. Only a release changes `main`
  of `stack-kit/stack`, so STACK merges no pull request. When STACK
  accepts a proposal, it takes the ready change in, or it writes the
  change itself. The next release carries the change. STACK then
  closes the pull request with a link to that release. When STACK
  declines a proposal, it closes the pull request with the reason. A
  ready change under `preview/` also passes `npm ci`, `npm run check`
  and `npm run build:static` in `preview/`, on Node 22.17 or later.
- `### Type steps` and "Phone type" in `### Width bands`: the new type step
  `reading-phone` sets running text to 15 px on a 22 px line below
  768 px. Before, running text kept the `reading` step on a phone,
  14 / 21 px. Now it is as large as the 15 px `body` text around it.
  `stack.css` and `stack-plain.css` change `--text-md` in the phone
  media query, so every `text-md` class follows with no new class. So
  five type steps grow below 768 px, not four. The body, an open quote
  and the translation of a `mail-message` take the step, and so does a
  diff of text (`### diff`). A product that imports `stack.css` or
  `stack-plain.css` changes no code.
- `### figure-band`: a band holds one to four key figures. Before, it
  held two to four. A page with one key figure shows it in a band of
  one under the title of the page, with no card. The list of a band of
  one takes `grid-cols-1` in place of `grid-cols-2`, and its figure
  takes `justify-self-start`. So the figure stands at the start of the
  band, also on a phone, and it is as wide as its parts. The line
  under it crosses the band. `FigureBand.svelte` of the preview takes
  a band of one. A product that copied `FigureBand.svelte` copies it
  again. A product that shows one key figure in a card moves it into a
  band of one.
- "Sorting and search" in `architecture/web-app.md`: the search fold
  changes both texts to lower case, and then it replaces four letters
  that NFD does not split. It replaces ß with ss, ł with l, ø with o,
  and U+0111, the d with a stroke, with d. This order also covers ẞ,
  Ł, Ø and U+0110. Before, the fold replaced only U+0111 and U+0110,
  and it changed the case last. So "strasse" now finds "Straße", and
  "muller" still finds "Müller". A product that folds search text adds
  the three new replacements after the change to lower case.

### Added

- "Make a theme with the generator" in `README.md`: a product makes its
  own theme with the theme generator, `scripts/generate.mjs`. The
  generator takes a base color, an accent color and a contrast level
  from 0 to 100. It writes a theme file with every color role of
  `DESIGN.md` in light and in dark, and `--radius`. The generator
  needs the dev dependencies of STACK, so the npm package does not
  carry it. A product clones its pinned tag into a temporary folder and
  runs `npm ci` there. Then it runs the generator from its own root
  folder, and `--out` names the theme file as a path from that folder.
  When a pair of the contrast check fails, the generator moves the
  lightness of the value until the pair passes. It prints each value
  that it moved. It refuses a theme that fails, with exit code 1. At
  each update, run the command again from a clone of the new tag. The
  first line of the theme file gives the inputs. A block of the Theme
  tab of the create page stays the second way ("Take a theme from the
  Theme tab").
- `CONTRIBUTING.md` of the public repository gives the route of a
  proposal for every contributor. It also gives the checks to run
  before the push of a ready change, and the licence of a
  contribution. A contribution is under the MIT licence of `LICENSE`.
- `scripts/hooks/stack-checks.sh`: the checks of the `pre-commit` hook,
  in one script. It runs the theme check, the names check and the
  markers check on the staged files. It refuses the commit when
  `CHANGELOG.md` has no heading for the version in `package.json`. It
  also refuses every commit when `node` or the packages of `npm ci`
  are missing. The `pre-commit` hook in `.githooks/` runs the script.
  Before that, the hook refuses a staged path with a part that starts
  with `_`, and an embedded repository. The `commit-msg` hook runs the
  names check on the message. To turn the hooks on in a clone, run
  `git config core.hooksPath .githooks`.

### Fixed

- `### table`: below 768 px the header row of a tree is 44 px high
  (`max-md:h-[44px]` on its `Table.Row`). So a box in it, such as
  "Select all", has a target of 44 by 44 px. A product with a tree adds
  the class. `TableTree.svelte` of the preview has it. Before, the
  header row was 40 px, so a tap reached only 40 px of the height of
  that target.
- Step 1 of "Update a product to a new release" in `README.md` copies
  again only the folders that the release holds. A `test -d` guard in
  its command keeps every other folder. The step of v0.9.0 removed a
  folder that the release does not hold, such as `trace`, and then its
  copy failed. A product that lost such a folder takes it back from its
  own git history. Any other folder of `src/lib/components/ui/` stays
  as code of the product, and it must work with the package versions
  of the lock.
- `preview/src/lib/components/ui/LICENSE.md`: the licence notice of
  shadcn-svelte also covers `utils.ts` and `hooks/is-mobile.svelte.ts`.
  They come from the same release of shadcn-svelte. Before, the notice
  named only the component folders and `shadcn-svelte.css`. A product
  copies `LICENSE.md` again at this update, as step 1 of "Update a
  product to a new release" says.
