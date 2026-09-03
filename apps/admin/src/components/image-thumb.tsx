"use client";

import { cn } from "@plastlima-app/ui/lib/utils";
import { ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
	src: string;
	/** Aplicado tanto à imagem quanto à moldura do placeholder. */
	className?: string;
	iconClassName?: string;
};

/**
 * Miniatura de imagem com placeholder amigável.
 *
 * Mostra um marcador neutro quando não há imagem — ou quando ela não carrega,
 * o que é comum no painel: os banners do site usam caminhos relativos como
 * `/banners/…`, que existem no app público e não no admin. Assim a tela nunca
 * exibe o ícone de "imagem quebrada" do navegador.
 */
export function ImageThumb({ src, className, iconClassName }: Props) {
	const [failed, setFailed] = useState(false);

	// Um novo `src` merece nova tentativa de carregar.
	useEffect(() => {
		setFailed(false);
	}, [src]);

	if (!src || failed) {
		return (
			<div
				className={cn(
					"flex items-center justify-center bg-muted text-muted-foreground",
					className,
				)}
			>
				<ImageIcon className={cn("size-5", iconClassName)} />
			</div>
		);
	}

	return (
		// biome-ignore lint/performance/noImgElement: preview do painel a partir de URL/caminho arbitrário.
		<img
			alt=""
			className={cn("object-cover", className)}
			onError={() => setFailed(true)}
			// A imagem pode falhar ainda no HTML do servidor, antes do React ligar o
			// `onError` — então na montagem checamos se ela já carregou vazia.
			ref={(node) => {
				if (node?.complete && node.naturalWidth === 0) {
					setFailed(true);
				}
			}}
			src={src}
		/>
	);
}
