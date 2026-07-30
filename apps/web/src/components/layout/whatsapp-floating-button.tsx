import { CONTACT } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";

export function WhatsappFloatingButton() {
	return (
		<a
			className="fixed right-5 bottom-5 z-60 inline-flex items-center gap-2.5 rounded-full bg-ink px-[22px] py-[15px] font-bold text-[14.5px] text-white shadow-[0_14px_34px_rgba(16,20,24,.28)] transition-transform hover:-translate-y-0.5 hover:bg-brand sm:right-6 sm:bottom-6"
			href={whatsappUrl(CONTACT.support.phone)}
			rel="noreferrer"
			target="_blank"
		>
			<span aria-hidden="true" className="size-2 rounded-full bg-online" />
			Fale no WhatsApp
		</a>
	);
}
