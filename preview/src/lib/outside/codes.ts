// The code of a new device: 8 characters of Crockford base32, which the sign-in page reads in its
// CodeInput. The server of a product reads a code the same way, so it imports these functions too.

/**
 * The characters that the code field takes: the 32 symbols of Crockford base32 in both cases, and
 * I, L and O, which Crockford reads as 1, 1 and 0. U is not a symbol.
 */
export const CODE_PATTERN = '^[0-9A-TV-Za-tv-z]+$';

/** The code as Crockford base32 reads it: upper case, O as 0, and I and L as 1. The server reads it the same way. */
export const readCode = (code: string) => code.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');

/** A pasted code without the hyphens and the spaces between its groups, which the pattern refuses. */
export const pasteCode = (text: string) => text.replace(/[\s-]/g, '');
