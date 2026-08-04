"use client";

import { Button } from "@plastlima-app/ui/components/button";
import { cn } from "@plastlima-app/ui/lib/utils";
import { Copy, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
	type AssetSummary,
	deleteAssetAction,
	uploadAssetAction,
} from "@/app/(painel)/midia/actions";

const fieldClassName =
	"w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring";

function formatBytes(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(0)} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
	initialAssets: AssetSummary[];
	configured: boolean;
};

export function MediaLibrary({ initialAssets, configured }: Props) {
	const [assets, setAssets] = useState<AssetSummary[]>(initialAssets);
	const [alt, setAlt] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	async function handleUpload() {
		if (file === null) {
			toast.error("Selecione um arquivo.");
			return;
		}

		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.set("file", file);
			formData.set("alt", alt);

			const result = await uploadAssetAction(formData);

			if (!result.ok) {
				toast.error(result.message);
				return;
			}

			setAssets((current) => [result.asset, ...current]);
			setAlt("");
			setFile(null);
			if (fileInputRef.current !== null) {
				fileInputRef.current.value = "";
			}
			toast.success("Imagem enviada.");
		} finally {
			setIsUploading(false);
		}
	}

	async function handleCopy(url: string) {
		try {
			await navigator.clipboard.writeText(url);
			toast.success("URL copiada.");
		} catch {
			toast.error("Não foi possível copiar.");
		}
	}

	async function handleDelete(id: string) {
		setDeletingId(id);
		try {
			const result = await deleteAssetAction(id);

			if (!result.ok) {
				toast.error(result.message);
				return;
			}

			setAssets((current) => current.filter((asset) => asset.id !== id));
			toast.success("Imagem removida.");
		} finally {
			setDeletingId(null);
		}
	}

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8">
			<header>
				<h1 className="font-bold text-2xl tracking-tight">Mídia</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Envie imagens (PNG, JPEG, WebP ou AVIF, até 5 MB) e copie a URL para
					usar nos documentos do site.
				</p>
			</header>

			{configured ? (
				<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
					<h2 className="font-semibold text-sm">Enviar imagem</h2>
					<input
						accept="image/png,image/jpeg,image/webp,image/avif"
						className={cn(
							fieldClassName,
							"file:mr-3 file:border-0 file:bg-transparent file:font-medium file:text-sm",
						)}
						onChange={(event) => setFile(event.target.files?.[0] ?? null)}
						ref={fileInputRef}
						type="file"
					/>
					<label className="flex flex-col gap-1.5">
						<span className="font-medium text-sm">Texto alternativo</span>
						<input
							className={fieldClassName}
							onChange={(event) => setAlt(event.target.value)}
							placeholder="Descreva a imagem para acessibilidade e SEO"
							value={alt}
						/>
					</label>
					<Button
						className="w-fit"
						disabled={isUploading || file === null}
						onClick={handleUpload}
						type="button"
					>
						<Upload className="size-4" />
						{isUploading ? "Enviando…" : "Enviar"}
					</Button>
				</section>
			) : (
				<div
					className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
					role="alert"
				>
					Upload indisponível: configure as variáveis <code>R2_*</code> no
					servidor para habilitar a biblioteca de mídia.
				</div>
			)}

			<section className="flex flex-col gap-4">
				<h2 className="font-semibold text-lg">
					{assets.length} {assets.length === 1 ? "imagem" : "imagens"}
				</h2>

				{assets.length === 0 ? (
					<p className="rounded-xl border border-border border-dashed px-4 py-10 text-center text-muted-foreground text-sm">
						Nenhuma imagem ainda.
					</p>
				) : (
					<ul className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-4">
						{assets.map((asset) => (
							<li
								className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
								key={asset.id}
							>
								<div className="flex aspect-video items-center justify-center bg-muted/40">
									{/* biome-ignore lint/performance/noImgElement: preview do painel; a imagem vem do R2, sem loader do Next aqui. */}
									<img
										alt={asset.alt}
										className="max-h-full max-w-full object-contain"
										src={asset.url}
									/>
								</div>
								<div className="flex flex-1 flex-col gap-2 p-3">
									<p className="line-clamp-2 text-sm" title={asset.alt}>
										{asset.alt}
									</p>
									<p className="text-muted-foreground text-xs">
										{asset.width}×{asset.height} · {formatBytes(asset.bytes)}
									</p>
									<div className="mt-auto flex items-center gap-2">
										<Button
											className="flex-1"
											onClick={() => handleCopy(asset.url)}
											size="sm"
											type="button"
											variant="outline"
										>
											<Copy className="size-4" />
											Copiar URL
										</Button>
										<Button
											aria-label="Remover imagem"
											disabled={deletingId === asset.id}
											onClick={() => handleDelete(asset.id)}
											size="icon"
											type="button"
											variant="ghost"
										>
											<Trash2 className="size-4 text-destructive" />
										</Button>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
