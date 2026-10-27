// The roles and the pairs of "### Email colors" in DESIGN.md. This file is the one source: contrast.mjs
// fails when a table lacks a role or a pair of these lists, and preview/src/lib/email/email.ts reads
// the roles from here.

/** The roles of the first table, in its order. */
export const EMAIL_ROLES = /** @type {const} */ ([
  'background',
  'card',
  'border',
  'muted',
  'foreground',
  'muted-foreground',
  'link',
  'primary',
  'primary-foreground',
  'success',
  'warning',
  'destructive',
]);

/** The pairs of the second table, as "<text> on <ground>". */
export const EMAIL_PAIRS = [
  'foreground on background',
  'foreground on card',
  'foreground on muted',
  'muted-foreground on background',
  'muted-foreground on card',
  'link on background',
  'primary-foreground on primary',
  'primary on background',
  'success on background',
  'warning on background',
  'destructive on background',
];
