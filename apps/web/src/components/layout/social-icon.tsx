import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import type { SocialPlatform } from "@/types/navigation";

/** Único ponto que liga cada rede social ao seu ícone do react-icons. */
const PLATFORM_ICONS: Record<SocialPlatform, IconType> = {
	facebook: FaFacebookF,
	instagram: FaInstagram,
	whatsapp: FaWhatsapp,
};

type SocialIconProps = {
	/** Texto vindo do conteúdo editável; só rendeiza se for uma rede conhecida. */
	platform: string;
	className?: string;
};

export function SocialIcon({ platform, className }: SocialIconProps) {
	const Icon = PLATFORM_ICONS[platform as SocialPlatform];

	if (Icon === undefined) {
		return null;
	}

	return <Icon aria-hidden className={className} />;
}
