// The time of a conversation by its age ("Formats" in architecture/web-app.md). MailMessage and the
// comment parts share it. The package exports no path to this file: MailMessage exports age.

/** A time by its age, as "Formats" in architecture/web-app.md says. */
export function age(at: Date, now: Date, locale: string, timeZone: string): string {
	const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone });
	const year = (d: Date) => d.toLocaleDateString('en-CA', { timeZone, year: 'numeric' });
	if (day(at) === day(now)) return new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit' }).format(at);
	if (year(at) === year(now)) return new Intl.DateTimeFormat(locale, { timeZone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(at);
	return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'medium' }).format(at);
}
