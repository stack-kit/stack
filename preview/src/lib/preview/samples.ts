// The invented product, records and server answers of the pages outside the shell that the preview
// shows at /outside. Each state has its own address, such as ?page=sign-in&state=code-wrong. The
// sample functions give the answer of that state, and the view page takes the step that leads to it,
// so each frame opens in its state. "### Page outside the shell" in DESIGN.md defines the states.
import type { Fact } from "#lib/outside/Facts.svelte";
import type { LinkPageProps } from "#lib/outside/LinkPage.svelte";
import type {
  OutsideProduct,
  Passkey,
  Refused,
} from "#lib/outside/OutsidePage.svelte";
import type { ReadOnlyPageProps } from "#lib/outside/ReadOnlyPage.svelte";
import type { WithCode } from "#lib/outside/SetupLinkPage.svelte";

/** The product of the head line. A placeholder, because the page belongs to no product. */
export const PRODUCT: OutsideProduct = { name: "Product", mark: "P" };

export const PAGES = {
  link: {
    label: "Link page",
    states: [
      "ready",
      "working",
      "done",
      "expired",
      "used",
      "changed",
      "failed",
      "not-valid",
    ],
  },
  "read-only": {
    label: "Read-only link",
    states: ["ready", "expired", "not-valid"],
  },
  "sign-in": {
    label: "Sign-in page",
    states: [
      "ready",
      "waiting",
      "failed",
      "cancelled",
      "code-wrong",
      "code-expired",
      "app",
      "app-wrong",
      "app-used",
      "app-paused",
      "app-paused-100",
      "passkey",
      "passkey-waiting",
      "passkey-failed",
      "passkey-cancelled",
    ],
  },
  recovery: {
    label: "Recovery page",
    states: [
      "ready",
      "code-wrong",
      "paused",
      "paused-100",
      "setup-wrong",
      "setup-used",
      "setup-paused",
      "passkey",
    ],
  },
  "setup-link": {
    label: "Setup link",
    states: [
      "ready",
      "waiting",
      "failed",
      "cancelled",
      "not-now-failed",
      "recovery-code",
    ],
  },
} as const;

export type PageKind = keyof typeof PAGES;

/** The page and the state of an address, such as ?page=sign-in&state=waiting. */
export function addressOf(url: {
  searchParams: { get(name: string): string | null };
}): { kind: PageKind; state: string } {
  const p = url.searchParams.get("page");
  const kind: PageKind =
    p !== null && Object.hasOwn(PAGES, p) ? (p as PageKind) : "link";
  const s = url.searchParams.get("state");
  const states: readonly string[] = PAGES[kind].states;
  return { kind, state: s !== null && states.includes(s) ? s : "ready" };
}

/** The address of a page in a state. The states of an authenticator app add method=app, which the sign-in page reads. */
export const viewHref = (kind: PageKind, state: string) =>
  `/outside/view?page=${kind}&state=${state}${kind === "sign-in" && state.startsWith("app") ? "&method=app" : ""}`;

/** The address that the sign-in states fill in. */
export const SAMPLE_ADDRESS = "ana@example.org";

/** The codes that the states fill in: a device code of 8 symbols of Crockford base32, 6 digits of an authenticator app, a saved recovery code and a setup code. */
export const CODES = {
  device: "7K4QX2MD",
  app: "482915",
  saved: "7K4Q-X2MD-R8F3-W6PN",
  setup: "7K4Q X2MD R8F3 W6PN 3HJA 9BTC 5E",
} as const;

/** The new recovery code of the setup link and of the recovery page, in four groups of four. */
const RECOVERY_CODE = "R8F3-W6PN-7K4Q-X2MD";

/** The end of a pause: 14:35 today. */
const until = () => {
  const d = new Date();
  d.setHours(14, 35, 0, 0);
  return d.toISOString();
};

/** A browser sheet that stays open, so Waiting stays. */
const open = <T>() => new Promise<T>(() => {});
const refuse = <S extends string>(state: S, pause = false): Refused<S> =>
  pause ? { ok: false, state, until: until() } : { ok: false, state };

/** A passkey step that gives the answer of a state: waiting, failed, cancelled, or a passkey. */
function passkeyOf(state: string): Passkey {
  return async () =>
    state === "waiting"
      ? open()
      : state === "failed" || state === "cancelled"
        ? refuse(state)
        : { ok: true };
}

/** The functions of the sign-in page in a state. */
export function signIn(state: string) {
  const step = state.startsWith("passkey-")
    ? state.slice("passkey-".length)
    : "ready";
  return {
    passkey: passkeyOf(state),
    addPasskey: passkeyOf(step),
    deviceCode: async () =>
      state === "code-wrong" || state === "code-expired"
        ? refuse(state)
        : { ok: true as const },
    appCode: async () =>
      state === "app-wrong" ||
      state === "app-used" ||
      state === "app-paused" ||
      state === "app-paused-100"
        ? refuse(state, state === "app-paused")
        : { ok: true as const },
  };
}

/** The functions of the recovery page in a state. */
export function recovery(state: string) {
  const code: WithCode = { ok: true, recoveryCode: RECOVERY_CODE };
  return {
    recoveryCode: async () =>
      state === "code-wrong" || state === "paused" || state === "paused-100"
        ? refuse(state, state === "paused")
        : { ok: true as const },
    setupCode: async () =>
      state === "setup-wrong" || state === "setup-used"
        ? refuse(state)
        : state === "setup-paused"
          ? refuse("paused", true)
          : { ok: true as const },
    addPasskey: async () => code,
    notNow: async () => code,
  };
}

/** The functions of the setup link in a state. */
export function setupLink(state: string) {
  const code: WithCode = { ok: true, recoveryCode: RECOVERY_CODE };
  return {
    addPasskey: async () =>
      state === "waiting"
        ? open<WithCode>()
        : state === "failed" || state === "cancelled"
          ? refuse(state)
          : code,
    notNow: async () => (state === "not-now-failed" ? refuse("failed") : code),
  };
}

const LOCALE = "en-GB";
const money = (n: number) =>
  new Intl.NumberFormat(LOCALE, { style: "currency", currency: "EUR" }).format(
    n,
  );
const day = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, { dateStyle: "long" }).format(new Date(iso));

/** The quote of the link page: the facts that the approval fixes. */
const QUOTE = {
  id: "QUO-0042",
  client: "Harbour Lane Studio",
  amount: money(1250),
  amountNow: money(1400),
  validUntil: day("2026-11-08"),
  expired: day("2026-10-24"),
  linkDays: 4,
  usedOn: "23 October at 16:05",
  changedOn: "24 October at 11:30",
  doneAt: "14:20",
  requestId: "7f3a9c2e",
} as const;

/** The props of the link page that approves the quote in a state. Working, Done and Failed open after Approve quote. */
export function link(state: string): Omit<LinkPageProps, "product"> {
  const facts: Fact[] = [
    { label: "Quote", value: QUOTE.id, id: true },
    { label: "Client", value: QUOTE.client },
    { label: "Amount", value: QUOTE.amount },
    { label: "Valid until", value: QUOTE.validUntil },
  ];
  const initial =
    state === "expired" ||
    state === "used" ||
    state === "changed" ||
    state === "not-valid"
      ? state
      : "ready";
  // Expired and Not valid give no facts and no text that names the object.
  const bare = initial === "expired" || initial === "not-valid";
  return {
    initial,
    title: bare ? "Approve a quote" : `Approve the quote ${QUOTE.id}?`,
    text: bare
      ? "Approve quote accepts a quote."
      : "Approve quote accepts the quote as the facts below show it.",
    verb: "Approve quote",
    facts: bare
      ? []
      : state === "changed"
        ? facts.map((f) =>
            f.label === "Amount"
              ? { ...f, value: QUOTE.amountNow, was: QUOTE.amount }
              : f,
          )
        : facts,
    texts: bare
      ? {
          done: { title: "Done", text: "You can close this page." },
          expired: `A link to approve a quote works for ${QUOTE.linkDays} days. This link expired on ${QUOTE.expired}.`,
          used: "A link works only once.",
        }
      : {
          done: {
            title: `You approved the quote ${QUOTE.id}`,
            text: `${QUOTE.client} sees the approval now. You can close this page.`,
          },
          expired: `A link to approve a quote works for ${QUOTE.linkDays} days. This link expired on ${QUOTE.expired}.`,
          used: `The quote ${QUOTE.id} was approved on ${QUOTE.usedOn}. A link works only once.`,
          changed: {
            title: `The quote ${QUOTE.id} changed after the email`,
            text: `${QUOTE.client} changed the amount on ${QUOTE.changedOn}. To approve the quote as it is now, use a new link.`,
            reason:
              "The quote changed after the email. Send a new link to approve it as it is now.",
          },
        },
    act: async () =>
      state === "working"
        ? open<never>()
        : state === "failed"
          ? { ok: false, state: "failed", requestId: QUOTE.requestId }
          : {
              ok: true,
              facts: [...facts, { label: "Approved", value: QUOTE.doneAt }],
            },
    resend: async () => ({ ok: true }),
  };
}

/** The visits of the read-only link, one row for each page of a site. */
export const VISITS = {
  month: "October 2026",
  until: day("2026-10-31"),
  rows: [
    { page: "/pricing", visits: 4812, change: 0.12 },
    { page: "/", visits: 3907, change: -0.04 },
    { page: "/docs/start", visits: 2240, change: 0.31 },
    { page: "/contact", visits: 618, change: 0 },
  ],
} as const;

export const count = (n: number) => new Intl.NumberFormat(LOCALE).format(n);
/** A change in percent, with a true minus sign (U+2212), as the table definition asks for a negative number. */
export const change = (n: number) =>
  new Intl.NumberFormat(LOCALE, { style: "percent", signDisplay: "exceptZero" })
    .format(n)
    .replace("-", "\u2212");

/** The props of the read-only link in a state, with no content: the view page gives the table. */
export function readOnly(
  state: string,
): Omit<ReadOnlyPageProps, "product" | "children"> {
  return {
    initial: state === "expired" || state === "not-valid" ? state : "ready",
    // Expired and Not valid give no title that names the content and no text.
    title:
      state === "expired" || state === "not-valid"
        ? "Visits"
        : `Visits in ${VISITS.month}`,
    until: VISITS.until,
    text:
      state === "expired" || state === "not-valid"
        ? undefined
        : "It shows counts only, and no data of a person.",
  };
}
