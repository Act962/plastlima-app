"use client";

import { cn } from "@plastlima-app/ui/lib/utils";
import { ImageUp, Loader2, X } from "lucide-react";
import { useId, useState } from "react";
import {
	type CompressedImage,
	compressImage,
	formatBytes,
} from "@/lib/image/compress-image";
import { FieldError } from "./field-error";
import { fieldLabelClassName } from "./field-styles";

/** Recusa antes de tentar processar — evita travar o celular com um arquivo absurdo. */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

type FileFieldProps = {
	label: string;
	hint?: string;
	error?: string;
	className?: string;
	onChange: (image: CompressedImage | null) => void;
};

type Status = "idle" | "processing" | "ready" | "error";

/**
 * Campo de foto do cupom.
 *
 * Comprime no navegador antes de entregar o data URL ao formulário: a foto sai
 * de vários MB para algo em torno de 200 KB, e o usuário vê o resultado.
 */
export function FileField({
	label,
	hint,
	error,
	className,
	onChange,
}: FileFieldProps) {
	const inputId = useId();
	const [status, setStatus] = useState<Status>("idle");
	const [preview, setPreview] = useState<CompressedImage | null>(null);
	const [localError, setLocalError] = useState<string | undefined>(undefined);

	async function handleSelect(file: File | undefined) {
		if (file === undefined) {
			return;
		}

		if (file.size > MAX_SOURCE_BYTES) {
			setStatus("error");
			setLocalError("Imagem muito grande. Envie uma foto de até 25 MB.");
			return;
		}

		setStatus("processing");
		setLocalError(undefined);

		try {
			const compressed = await compressImage(file);

			setPreview(compressed);
			setStatus("ready");
			onChange(compressed);
		} catch {
			setStatus("error");
			setLocalError("Não foi possível ler esta imagem. Tente outra foto.");
			onChange(null);
		}
	}

	function handleRemove() {
		setPreview(null);
		setStatus("idle");
		setLocalError(undefined);
		onChange(null);
	}

	const message = error ?? localError;

	return (
		<div className={cn("flex flex-col gap-[7px]", className)}>
			<span className={fieldLabelClassName}>{label}</span>

			{preview === null ? (
				<label
					className={cn(
						"flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-line border-dashed bg-surface px-4 py-7 text-center transition-colors hover:border-brand",
						message !== undefined && "border-brand",
					)}
					htmlFor={inputId}
				>
					{status === "processing" ? (
						<Loader2 aria-hidden className="size-6 animate-spin text-brand" />
					) : (
						<ImageUp aria-hidden className="size-6 text-body-muted" />
					)}
					<span className="font-semibold text-[14.5px] text-ink">
						{status === "processing"
							? "Preparando a imagem…"
							: "Toque para anexar a foto"}
					</span>
					<span className="text-[13px] text-body-muted">
						JPG ou PNG — reduzimos automaticamente
					</span>
					<input
						accept="image/*"
						className="sr-only"
						disabled={status === "processing"}
						id={inputId}
						onChange={(event) => {
							void handleSelect(event.target.files?.[0]);
						}}
						type="file"
					/>
				</label>
			) : (
				<div className="flex items-center gap-3 rounded-xl border-[1.5px] border-line bg-surface p-3">
					{/* Prévia local em base64: next/image não agrega nada aqui. */}
					{/** biome-ignore lint/performance/noImgElement: data URL local, sem otimização possível */}
					<img
						alt="Prévia do cupom anexado"
						className="size-16 shrink-0 rounded-lg object-cover"
						src={preview.dataUrl}
					/>
					<div className="flex min-w-0 flex-1 flex-col">
						<span className="font-semibold text-[14.5px] text-ink">
							Cupom anexado
						</span>
						<span className="text-[13px] text-body-muted">
							{preview.width} × {preview.height} · {formatBytes(preview.bytes)}
						</span>
					</div>
					<button
						aria-label="Remover cupom anexado"
						className="cursor-pointer rounded-full p-2 text-body-muted transition-colors hover:bg-surface-muted hover:text-ink"
						onClick={handleRemove}
						type="button"
					>
						<X aria-hidden className="size-4" />
					</button>
				</div>
			)}

			{hint !== undefined && message === undefined ? (
				<span className="text-[13px] text-body-muted">{hint}</span>
			) : null}
			<FieldError message={message} />
		</div>
	);
}
