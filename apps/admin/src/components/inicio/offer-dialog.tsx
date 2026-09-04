"use client";

import type { MediaItemContent } from "@plastlima-app/core/schemas";
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

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Novidade a editar, ou `null` para criar uma nova. */
	initial: MediaItemContent | null;
	onSubmit: (offer: MediaItemContent) => void;
};

/**
 * Cria ou edita um card da seção "Novidades" da home.
 *
 * Menos campos que um banner de propósito: o site recorta todo card em um
 * quadrado e manda todos para o catálogo, então proporção e link não teriam
 * efeito nenhum aqui. Nada é salvo no diálogo — o `onSubmit` devolve o item e o
 * editor cuida do rascunho.
 */
export function OfferDialog({ open, onOpenChange, initial, onSubmit }: Props) {
	const isEdit = initial !== null;

	const [alt, setAlt] = useState("");
	const [src, setSrc] = useState("");

	// Recarrega os campos toda vez que o diálogo abre, a partir da novidade em
	// edição (ou em branco, para uma nova).
	useEffect(() => {
		if (!open) {
			return;
		}

		setAlt(initial?.alt ?? "");
		setSrc(initial?.src ?? "");
	}, [open, initial]);

	// Espelha as invariantes do schema: imagem e alt obrigatórios.
	const canSave = alt.trim().length > 0 && src.trim().length > 0;

	function handleSubmit() {
		if (!canSave) {
			return;
		}

		onSubmit({
			src: src.trim(),
			alt: alt.trim(),
			// Preserva um link gravado antes: o site ainda não o usa nesta seção,
			// mas descartá-lo aqui apagaria dado que já está no documento.
			href: initial?.href,
		});

		onOpenChange(false);
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[calc(100dvh-4rem)] w-[70vw] max-w-3xl overflow-y-auto sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Editar novidade" : "Nova novidade"}
					</DialogTitle>
					<DialogDescription>
						Encartes, ofertas e avisos da home. Nada vai ao ar até você
						publicar.
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
							hint="O site exibe a arte recortada em um quadrado — prefira imagens quadradas para nada importante ficar de fora."
							label="Imagem"
							onChange={setSrc}
							value={src}
						/>
					</div>
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
						{isEdit ? "Salvar" : "Adicionar novidade"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
