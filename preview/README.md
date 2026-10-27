# Preview

The preview shows the components and the tokens of the design file in each theme and mode. It reads `DESIGN.md`, `stack.css` and `themes/` from the folder above.

## Theme

The script in `<head>` of `src/app.html` links the theme and sets the mode before the first paint. It is the script of "Pick a theme" in `../README.md`, with the keys `stack-preview-theme` and `stack-preview-mode` in `localStorage` and the path `/themes/`. The route `src/routes/themes/[name].css` serves each file of `../themes/` unchanged at `/themes/<name>.css`. The route is prerendered, so the static build holds the same files in `dist-static/themes/`. A new theme file needs its name in the list of themes of the script, and `npm run theme -- --check` in the folder above fails until the list holds it.

## Static build

The static build is the same preview as HTML, CSS and JavaScript in one folder. It opens with no dev server.

In this folder, install the packages once with `npm ci`. Then write the build into `dist-static/`:

```sh
npm run build:static
```

Open the build with one command, then open the address that the command prints:

```sh
npx serve@14.2.6 -s dist-static
```

The `-s` option sends `index.html` for every path, so a direct link to any page works. Another static server works only if it does the same. `python3 -m http.server` does not: it shows `/`, but it returns 404 for a direct load of `/tokens`.
