"use client";

import type { HeroBannerContent } from "@plastlima-app/core/schemas";
import { Button } from "@plastlima-app/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@plastlima-app/ui/components/dialog";
import { cn } from "@plastlima-app/ui/lib/utils";
import { useEffect, useState } from "react";
import { MediaField } from "@/components/midia/media-field";

const fieldClassName =
	"w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring";

/** Proporção padrão de um banner novo, largura ÷ altura. */
const DEFAULT_ASPECT = "3";
/** Proporção padrão da arte de celular (retrato suave). */
const DEFAULT_MOBILE_ASPECT = "0.8";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Banner a editar, ou `null` para criar um novo. */
	initial: HeroBannerContent | null;
	onSubmit: (banner: HeroBannerContent) => void;
};

/**
 * Cria ou edita um banner do carrossel num diálogo, com todos os campos de uma
 * vez — inclusive a arte opcional de celular, que o site já sabe exibir. Nada é
 * salvo aqui: o `onSubmit` devolve o banner e o editor cuida do rascunho.
 */
export function BannerDialog({ open, onOpenChange, initial, onSubmit }: Props) {
	const isEdit = initial !== null;

	const [alt, setAlt] = useState("");
	const [src, setSrc] = useState("");
	const [aspect, setAspect] = useState(DEFAULT_ASPECT);
	const [href, setHref] = useState("");
	const [mobileSrc, setMobileSrc] = useState("");
	const [mobileAspect, setMobileAspect] = useState(DEFAULT_MOBILE_ASPECT);

	// Recarrega os campos toda vez que o diálogo abre, a partir do banner em
	// edição (ou em branco, para um novo).
	useEffect(() => {
		if (!open) {
			return;
		}

		setAlt(initial?.alt ?? "");
		setSrc(initial?.src ?? "");
		setAspect(
			initial?.aspect != null ? String(initial.aspect) : DEFAULT_ASPECT,
		);
		setHref(initial?.href ?? "");
		setMobileSrc(initial?.mobile?.src ?? "");
		setMobileAspect(
			initial?.mobile ? String(initial.mobile.aspect) : DEFAULT_MOBILE_ASPECT,
		);
	}, [open, initial]);

	// Espelha as invariantes do schema: alt e imagem de desktop obrigatórios.
	const canSave = alt.trim().length > 0 && src.trim().length > 0;

	function handleSubmit() {
		if (!canSave) {
			return;
		}

		const trimmedMobile = mobileSrc.trim();

		onSubmit({
			src: src.trim(),
			alt: alt.trim(),
			aspect: aspect ? Number(aspect) || undefined : undefined,
			href: href.trim() || undefined,
			mobile: trimmedMobile
				? { src: trimmedMobile, aspect: Number(mobileAspect) || 1 }
				: undefined,
		});

		onOpenChange(false);
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[calc(100dvh-4rem)] w-[70vw] max-w-6xl overflow-y-auto sm:max-w-6xl">
				<DialogHeader>
					<DialogTitle>{isEdit ? "Editar banner" : "Novo banner"}</DialogTitle>
					<DialogDescription>
						Preencha a arte e os textos. Nada vai ao ar até você publicar.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<label className="flex flex-col gap-1.5">
						<span className="font-medium text-sm">
							Texto alternativo <span className="text-destructive">*</span>
						</span>
						<textarea
							className={cn(fieldClassName, "min-h-16 resize-y")}
							onChange={(event) => setAlt(event.target.value)}
							placeholder="Descreva a imagem para leitores de tela e SEO"
							value={alt}
						/>
						<span className="text-muted-foreground text-xs">
							Obrigatório — usado por leitores de tela e pelo SEO.
						</span>
					</label>

					<div className="rounded-lg border border-border p-3">
						<MediaField
							alt={alt}
							hint="Arte larga, exibida em telas grandes."
							label="Imagem (desktop)"
							onChange={setSrc}
							value={src}
						/>
					</div>

					<div className="rounded-lg border border-border p-3">
						<MediaField
							alt={alt}
							hint="Opcional. Sem envio, o celular usa a arte de desktop."
							label="Imagem para celular"
							onChange={setMobileSrc}
							value={mobileSrc}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<label className="flex flex-col gap-1.5">
							<span className="font-medium text-sm">
								Proporção — desktop (largura ÷ altura)
							</span>
							<input
								className={fieldClassName}
								onChange={(event) => setAspect(event.target.value)}
								step="0.01"
								type="number"
								value={aspect}
							/>
						</label>

						<label className="flex flex-col gap-1.5">
							<span className="font-medium text-sm">Proporção — celular</span>
							<input
								className={fieldClassName}
								disabled={mobileSrc.trim().length === 0}
								onChange={(event) => setMobileAspect(event.target.value)}
								step="0.01"
								type="number"
								value={mobileAspect}
							/>
						</label>
					</div>

					<label className="flex flex-col gap-1.5">
						<span className="font-medium text-sm">
							Link de redirecionamento
						</span>
						<input
							className={fieldClassName}
							onChange={(event) => setHref(event.target.value)}
							placeholder="Para onde o banner leva ao ser clicado (opcional)"
							type="text"
							value={href}
						/>
					</label>
				</div>

				<DialogFooter>
					<Button
						onClick={() => onOpenChange(false)}
						type="button"
						variant="ghost"
					>
						Cancelar
					</Button>
					<Button disabled={!canSave} onClick={handleSubmit} type="button">
						{isEdit ? "Salvar" : "Adicionar banner"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
