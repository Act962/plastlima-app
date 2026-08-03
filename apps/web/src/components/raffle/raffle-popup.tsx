"use client";

import { areEntriesOpen } from "@plastlima-app/core";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import { actionClassName } from "@/components/ui/action-styles";
import { RAFFLE_CAMPAIGN } from "@/data/raffle";
import { RAFFLE_FORM_ID } from "./constants";

const OPEN_DELAY_MS = 1200;

/**
 * Anúncio do sorteio a cada carregamento de página — recarregar traz o pop-up
 * de volta. Roda só uma vez, no mount: navegar pelo site por link (sem
 * recarregar) não reabre a cada troca de rota. Não aparece na própria campanha
 * (`/sorteio`) e some sozinho quando as inscrições encerram, a mesma data que
 * já fecha o formulário em `/sorteio`.
 */
export function RafflePopup() {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const { popup, id, entriesCloseAt } = RAFFLE_CAMPAIGN;

	// biome-ignore lint/correctness/useExhaustiveDependencies: só deve rodar no carregamento da página, não a cada troca de rota
	useEffect(() => {
		if (pathname.startsWith("/sorteio")) return;
		if (!areEntriesOpen({ id, entriesCloseAt }, new Date())) return;

		const timer = setTimeout(() => setIsOpen(true), OPEN_DELAY_MS);
		return () => clearTimeout(timer);
	}, []);

	// Fecha se o usuário chegar em /sorteio por um link enquanto o pop-up está aberto.
	useEffect(() => {
		if (pathname.startsWith("/sorteio")) setIsOpen(false);
	}, [pathname]);

	return (
		<Dialog.Root onOpenChange={setIsOpen} open={isOpen}>
			<Dialog.Portal>
				<Dialog.Overlay className="data-[state=closed]:fade-out data-[state=open]:fade-in fixed inset-0 z-70 bg-ink/60 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in" />
				<Dialog.Content
					aria-describedby={undefined}
					className="data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=open]:fade-in data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-70 flex max-h-[calc(100vh-32px)] w-[calc(100%-32px)] max-w-[380px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] bg-surface shadow-[0_30px_80px_rgba(0,0,0,0.35)] focus:outline-none data-[state=closed]:animate-out data-[state=open]:animate-in"
				>
					<Dialog.Close
						aria-label="Fechar"
						className="absolute top-3 right-3 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-ink/60 text-white transition-colors hover:bg-ink/80 focus-visible:outline-2 focus-visible:outline-white"
					>
						<LuX aria-hidden className="size-5" />
					</Dialog.Close>

					{/* Sem caixa de altura fixa: a imagem encolhe conforme o espaço vertical
					disponível (`max-h`), sempre preservando a proporção real da arte — nunca
					corta e nunca força rolagem. */}
					<div className="flex shrink-0 justify-center overflow-hidden">
						<Image
							alt={popup.image.alt}
							className="h-auto max-h-[42vh] w-auto max-w-full"
							height={popup.image.height}
							priority
							sizes="380px"
							src={popup.image.src}
							width={popup.image.width}
						/>
					</div>

					<div className="overflow-y-auto px-6 py-4 text-center">
						<p className="type-eyebrow mb-1 font-mono text-brand uppercase tracking-[0.1em]">
							{popup.eyebrow}
						</p>
						<Dialog.Title className="type-heading-sm mb-1.5 font-extrabold text-ink">
							{popup.title}
						</Dialog.Title>
						<p className="mb-3 text-[14.5px] text-body leading-[1.5]">
							{popup.message}
						</p>

						<Link
							className={actionClassName({
								className: "mb-2.5 w-full",
								size: "md",
							})}
							href={{ pathname: "/sorteio", hash: RAFFLE_FORM_ID }}
							onClick={() => setIsOpen(false)}
						>
							{popup.ctaLabel}
						</Link>
						<Dialog.Close className="cursor-pointer text-[13.5px] text-label underline-offset-2 hover:underline">
							{popup.dismissLabel}
						</Dialog.Close>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
