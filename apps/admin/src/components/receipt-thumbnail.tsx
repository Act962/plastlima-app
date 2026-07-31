"use client";

import { useRef } from "react";

type ReceiptThumbnailProps = {
	dataUrl: string;
	participantName: string;
};

/**
 * Miniatura do cupom que abre em tamanho real.
 *
 * Usa o `<dialog>` nativo: `showModal()` já entrega foco preso, fechamento por
 * Esc e leitura correta por leitor de tela, sem biblioteca.
 */
export function ReceiptThumbnail({
	dataUrl,
	participantName,
}: ReceiptThumbnailProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	return (
		<>
			<button
				aria-label={`Ver cupom de ${participantName}`}
				className="cursor-pointer overflow-hidden rounded border border-border transition-opacity hover:opacity-80"
				onClick={() => dialogRef.current?.showModal()}
				type="button"
			>
				{/* biome-ignore lint/performance/noImgElement: data URL do banco, sem otimização possível */}
				<img
					alt={`Cupom enviado por ${participantName}`}
					className="size-11 object-cover"
					src={dataUrl}
				/>
			</button>

			<dialog
				className="m-auto max-h-[90vh] max-w-[90vw] rounded-xl bg-background p-0 backdrop:bg-black/60"
				ref={dialogRef}
			>
				<div className="flex items-center justify-between gap-6 border-border border-b px-5 py-3">
					<p className="font-semibold text-sm">Cupom de {participantName}</p>
					<button
						className="cursor-pointer rounded px-2 py-1 text-muted-foreground text-sm hover:text-foreground"
						onClick={() => dialogRef.current?.close()}
						type="button"
					>
						Fechar
					</button>
				</div>
				{/* biome-ignore lint/performance/noImgElement: data URL do banco, sem otimização possível */}
				<img
					alt={`Cupom enviado por ${participantName}`}
					className="max-h-[75vh] w-auto"
					src={dataUrl}
				/>
			</dialog>
		</>
	);
}
