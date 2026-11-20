// The check of the height script of an HTML frame: the hash of the module and the hash of DESIGN.md
// must be the hash of the script, and the script must reach a page unchanged.
//
//   node --test scripts/frame-height.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ATTRIBUTES, check, hashOf } from './frame-height.mjs';

const READS = ATTRIBUTES.map((a) => `root.getAttribute('${a}');`).join('\n\t');
const SCRIPT = `(() => {\n\t${READS}\n\tparent.postMessage({ type: 'stack-frame-height', height: 0 }, '*');\n\t// 'stack-frame-mode'\n})();`;
const module = (script, hash = hashOf(script)) => `// A module in the form of frame-height.ts.
export const FRAME_HEIGHT_TYPE: string = 'stack-frame-height';
export const FRAME_MODE_TYPE: string = 'stack-frame-mode';
export const FRAME_HEIGHT_SCRIPT: string = \`${script}\`;
export const FRAME_HEIGHT_HASH: string = "${hash}";
`;
const design = (hash) => `### html-frame\n\nThe hash of the script of this release is \`${hash}\`.\n`;

test('the hash of SHA-256 in base64 is the source of a CSP hash, with its quotes', () => {
  assert.equal(hashOf(''), "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='");
});

test('a module and DESIGN.md with the hash of the script pass', () => {
  assert.deepEqual(check(module(SCRIPT), design(hashOf(SCRIPT))).problems, []);
});

test('a hash of the module or of DESIGN.md that is not the hash of the script fails', () => {
  const other = hashOf(`${SCRIPT} `);
  assert.match(check(module(SCRIPT, other), design(hashOf(SCRIPT))).problems.join('\n'), /FRAME_HEIGHT_HASH of .* is 'sha256-/);
  assert.match(check(module(SCRIPT), design(other)).problems.join('\n'), /DESIGN\.md publishes 'sha256-/);
  assert.match(check(module(SCRIPT), 'No hash here.').problems.join('\n'), /DESIGN\.md publishes no hash/);
});

test('a script that a page or the string would change fails', () => {
  for (const bad of [`${SCRIPT}\\n`, `${SCRIPT} // $x`, `${SCRIPT} // </script>`, `${SCRIPT} // <!--`, `${SCRIPT} // é`, `${SCRIPT}\r\n`]) {
    assert.notDeepEqual(check(module(bad), design(hashOf(bad))).problems, [], JSON.stringify(bad));
  }
});

test('a script that lacks a type tag of the module fails', () => {
  const script = `(() => { ${READS} parent.postMessage({ type: 'stack-frame-height' }, '*'); })();`;
  assert.match(check(module(script), design(hashOf(script))).problems.join('\n'), /does not hold 'stack-frame-mode'/);
});

test('a script that lacks an attribute of <html> that it reads fails', () => {
  for (const name of ATTRIBUTES) {
    const script = SCRIPT.replace(`'${name}'`, "'data-other'");
    assert.match(check(module(script), design(hashOf(script))).problems.join('\n'), new RegExp(`does not hold '${name}'`), name);
  }
});

test('a script that parses a text as HTML or as code fails', () => {
  const lines = [
    'summary.innerHTML = fold;',
    'summary.outerHTML = fold;',
    "summary.insertAdjacentHTML('beforeend', fold);",
    'summary.setHTMLUnsafe(fold);',
    'Document.parseHTMLUnsafe(fold);',
    'document.createRange().createContextualFragment(fold);',
    "new DOMParser().parseFromString(fold, 'text/html');",
    "frame.setAttribute('srcdoc', fold);",
    'document.write(fold);',
    'document . writeln(fold);',
    'eval(fold);',
    'window.eval(fold);',
    "new Function('return 1')();",
    "Function ('return 1')();",
    "setTimeout('send()', 10);",
    'setInterval( "send()", 10);'
  ];
  for (const line of lines) {
    const script = SCRIPT.replace('})();', `\t${line}\n})();`);
    assert.match(check(module(script), design(hashOf(script))).problems.join('\n'), /parses a text as HTML or as code/, line);
  }
});

test('a script that calls postMessage in a second place, or in none, fails', () => {
  const twice = SCRIPT.replace('})();', "\tparent.postMessage({ type: 'stack-frame-height', height: 1 }, '*');\n})();");
  const none = SCRIPT.replace('parent.postMessage(', 'parent.post(');
  assert.match(check(module(twice), design(hashOf(twice))).problems.join('\n'), /calls postMessage in 2 places/);
  assert.match(check(module(none), design(hashOf(none))).problems.join('\n'), /calls postMessage in 0 places/);
});

test('a timer with a function and a word that holds the name of a sink in no call pass', () => {
  const script = SCRIPT.replace('})();', '\tsetTimeout(() => send(), 10);\n\tconst evaluate = 1;\n})();');
  assert.deepEqual(check(module(script), design(hashOf(script))).problems, []);
});
