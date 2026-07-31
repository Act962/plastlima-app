import { FaWhatsapp } from "react-icons/fa";
import { CONTACT } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";

export function WhatsappFloatingButton() {
	return (
		<a
			aria-label="Fale conosco no WhatsApp"
			className="fixed right-5 bottom-5 z-60 inline-flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_14px_34px_rgba(37,211,102,.35)] transition-transform hover:-translate-y-0.5 hover:bg-[#1eb955] sm:right-6 sm:bottom-6"
			href={whatsappUrl(CONTACT.support.phone)}
			rel="noreferrer"
			target="_blank"
			title="Fale conosco no WhatsApp"
		>
			<FaWhatsapp aria-hidden className="size-7" />
		</a>
	);
}
