"use client";

import { Button } from "@plastlima-app/ui/components/button";
import { cn } from "@plastlima-app/ui/lib/utils";
import { ImageIcon, Library, UploadCloud, X } from "lucide-react";
import { useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
	type AssetSummary,
	listAssetsAction,
} from "@/app/(painel)/midia/actions";

const MAX_BYTES = 5 * 1024 * 1024;

const fieldClassName =
	"w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring";

const ACCEPT = {
	"image/png": [".png"],
	"image/jpeg": [".jpg", ".jpeg"],
	"image/webp": [".webp"],
	"image/avif": [".avif"],
};

type UploadResponse =
	| { ok: true; asset: AssetSummary }
	| { ok: false; message: string };

/** Envia via XHR para acompanhar o progresso (fetch não expõe upload progress). */
function uploadWithProgress(
	file: File,
	alt: string,
	onProgress: (percent: number) => void,
): Promise<UploadResponse> {
	return new Promise((resolve) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", "/api/media/upload");

		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				onProgress(Math.round((event.loaded / event.total) * 100));
			}
		};

		xhr.onload = () => {
			try {
				resolve(JSON.parse(xhr.responseText) as UploadResponse);
			} catch {
				resolve({ ok: false, message: "Resposta inválida do servidor." });
			}
		};

		xhr.onerror = () =>
			resolve({ ok: false, message: "Falha de rede durante o envio." });

		const form = new FormData();
		form.set("file", file);
		form.set("alt", alt);
		xhr.send(form);
	});
}

function messageForRejection(rejection: FileRejection): string {
	const code = rejection.errors[0]?.code;
	if (code === "file-too-large") {
		return "Arquivo maior que 5 MB.";
	}
	if (code === "file-invalid-type") {
		return "Formato não suportado. Envie PNG, JPEG, WebP ou AVIF.";
	}
	return rejection.errors[0]?.message ?? "Arquivo inválido.";
}

type Props = {
	label: string;
	value: string;
	/** Texto alternativo do contexto — vira o alt do arquivo enviado. */
	alt?: string;
	error?: string;
	onChange: (url: string) => void;
};

export function MediaField({ label, value, alt, error, onChange }: Props) {
	const [progress, setProgress] = useState<number | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [libraryOpen, setLibraryOpen] = useState(false);
	const [assets, setAssets] = useState<AssetSummary[] | null>(null);
	const [loadingLibrary, setLoadingLibrary] = useState(false);

	async function handleDrop(accepted: File[], rejections: FileRejection[]) {
		setUploadError(null);

		if (rejections.length > 0) {
			setUploadError(messageForRejection(rejections[0] as FileRejection));
			return;
		}

		const file = accepted[0];
		if (file === undefined) {
			return;
		}

		setProgress(0);
		const result = await uploadWithProgress(
			file,
			alt?.trim() ? alt : file.name,
			setProgress,
		);
		setProgress(null);

		if (!result.ok) {
			setUploadError(result.message);
			return;
		}

		onChange(result.asset.url);
		toast.success("Imagem enviada.");
	}

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		accept: ACCEPT,
		maxSize: MAX_BYTES,
		multiple: false,
		onDrop: handleDrop,
		disabled: progress !== null,
	});

	async function openLibrary() {
		setLibraryOpen(true);
		if (assets === null) {
			setLoadingLibrary(true);
			try {
				setAssets(await listAssetsAction());
			} finally {
				setLoadingLibrary(false);
			}
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<span className="font-medium text-sm">{label}</span>

			{value ? (
				<div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2">
					{/* biome-ignore lint/performance/noImgElement: preview do painel a partir de URL/caminho arbitrário. */}
					<img
						alt=""
						className="size-16 shrink-0 rounded object-contain"
						src={value}
					/>
					<span className="min-w-0 flex-1 truncate text-muted-foreground text-xs">
						{value}
					</span>
					<Button
						aria-label="Remover imagem"
						onClick={() => onChange("")}
						size="icon"
						type="button"
						variant="ghost"
					>
						<X className="size-4" />
					</Button>
				</div>
			) : null}

			<button
				className={cn(
					"flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center text-muted-foreground text-sm transition-colors",
					isDragActive
						? "border-ring bg-muted/50 text-foreground"
						: "border-input hover:bg-muted/40",
					progress !== null && "pointer-events-none opacity-70",
				)}
				type="button"
				{...getRootProps()}
			>
				<input {...getInputProps({ "aria-label": "Enviar imagem" })} />
				<UploadCloud className="size-5" />
				{progress !== null ? (
					<span>Enviando… {progress}%</span>
				) : (
					<span>
						Arraste uma imagem ou{" "}
						<span className="text-foreground underline">
							clique para enviar
						</span>
					</span>
				)}
				<span className="text-xs">PNG, JPEG, WebP ou AVIF · até 5 MB</span>
			</button>

			{progress !== null ? (
				<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-brand transition-all"
						style={{ width: `${progress}%` }}
					/>
				</div>
			) : null}

			<div className="flex items-center gap-2">
				<Button onClick={openLibrary} size="sm" type="button" variant="outline">
					<Library className="size-4" />
					Escolher da biblioteca
				</Button>
			</div>

			<input
				className={fieldClassName}
				onChange={(event) => onChange(event.target.value)}
				placeholder="/banners/exemplo.jpeg ou https://…"
				type="text"
				value={value}
			/>

			{uploadError ? (
				<span className="text-destructive text-xs">{uploadError}</span>
			) : null}
			{error ? <span className="text-destructive text-xs">{error}</span> : null}

			{libraryOpen ? (
				<LibraryPicker
					assets={assets}
					loading={loadingLibrary}
					onClose={() => setLibraryOpen(false)}
					onPick={(url) => {
						onChange(url);
						setLibraryOpen(false);
					}}
				/>
			) : null}
		</div>
	);
}

function LibraryPicker({
	assets,
	loading,
	onPick,
	onClose,
}: {
	assets: AssetSummary[] | null;
	loading: boolean;
	onPick: (url: string) => void;
	onClose: () => void;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
			<div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
				<div className="flex items-center justify-between border-border border-b px-4 py-3">
					<h3 className="font-semibold text-sm">Biblioteca de mídia</h3>
					<Button
						aria-label="Fechar"
						onClick={onClose}
						size="icon"
						type="button"
						variant="ghost"
					>
						<X className="size-4" />
					</Button>
				</div>

				<div className="overflow-y-auto p-4">
					{loading ? (
						<p className="py-8 text-center text-muted-foreground text-sm">
							Carregando…
						</p>
					) : assets && assets.length > 0 ? (
						<ul className="grid grid-cols-[repeat(auto-fill,minmax(min(140px,100%),1fr))] gap-3">
							{assets.map((asset) => (
								<li key={asset.id}>
									<button
										className="flex w-full flex-col overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-ring"
										onClick={() => onPick(asset.url)}
										type="button"
									>
										<span className="flex aspect-video items-center justify-center bg-muted/40">
											{/* biome-ignore lint/performance/noImgElement: preview do painel a partir do R2. */}
											<img
												alt={asset.alt}
												className="max-h-full max-w-full object-contain"
												src={asset.url}
											/>
										</span>
										<span
											className="truncate px-2 py-1.5 text-xs"
											title={asset.alt}
										>
											{asset.alt}
										</span>
									</button>
								</li>
							))}
						</ul>
					) : (
						<div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground text-sm">
							<ImageIcon className="size-6" />
							<p>
								Nenhuma imagem na biblioteca ainda. Envie pela tela de Mídia ou
								arraste uma aqui.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
