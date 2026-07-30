/** Builds a wa.me deep link for a phone number in international format (e.g. 5586995548646). */
export function whatsappUrl(phone: string, message?: string): string {
	const base = `https://wa.me/${phone}`;

	return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
