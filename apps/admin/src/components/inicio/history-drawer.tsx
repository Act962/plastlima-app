"use client";

import { Button } from "@plastlima-app/ui/components/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RevisionSummary, RollbackResult } from "@/lib/revisions";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "short",
	timeStyle: "short",
	timeZone: "America/Fortaleza",
});

type Props = {
	open: boolean;
	onClose: () => void;
	/** Chamado após uma restauração bem-sucedida, para a tela recarregar. */
	onRestored: () => void;
	/** Ações do documento em edição — o drawer serve qualquer `key`. */
	listAction: () => Promise<RevisionSummary[]>;
	rollbackAction: (version: number) => Promise<RollbackResult>;
};

/**
 * Drawer lateral com o histórico de revisões (spec §6.5): versão, autor, data e
 * nota, com *Restaurar* protegido por confirmação. Restaurar cria uma revisão
 * nova — o histórico nunca encolhe (invariante 3). Recebe as ações por props,
 * então serve tanto a home quanto as configurações e os demais documentos.
 */
export function HistoryDrawer({
	open,
	onClose,
	onRestored,
	listAction,
	rollbackAction,
}: Props) {
	const [revisions, setRevisions] = useState<RevisionSummary[] | null>(null);
	const [confirming, setConfirming] = useState<number | null>(null);
	const [restoring, setRestoring] = useState<number | null>(null);

	// Carrega as revisões toda vez que o drawer abre — assim reflete publicações
	// e restaurações feitas desde a última abertura.
	useEffect(() => {
		if (!open) {
			return;
		}

		setRevisions(null);
		setConfirming(null);
		listAction().then(setRevisions);
	}, [open, listAction]);

	if (!open) {
		return null;
	}

	async function handleRestore(version: number) {
		setRestoring(version);

		const result = await rollbackAction(version);

		setRestoring(null);
		setConfirming(null);

		if (result.ok) {
			toast.success(
				`Revisão ${result.restoredFrom} restaurada (nova revisão ${result.version}).`,
			);
			onRestored();
			onClose();
			return;
		}

		toast.error(result.message);
	}

	return (
		<>
			{/* Overlay clicável como botão: fechar no clique de fora, com acesso por
			    teclado de graça (Enter/Espaço), sem os alertas de a11y de um div. */}
			<button
				aria-label="Fechar histórico"
				className="fixed inset-0 z-40 bg-black/40"
				onClick={onClose}
				type="button"
			/>

			<aside
				aria-label="Histórico de revisões"
				className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-border border-l bg-card shadow-xl"
			>
				<header className="flex items-center justify-between border-border border-b px-5 py-4">
					<h2 className="font-semibold text-lg">Histórico</h2>
					<Button
						aria-label="Fechar histórico"
						onClick={onClose}
						size="icon"
						type="button"
						variant="ghost"
					>
						<X className="size-4" />
					</Button>
				</header>

				<div className="flex-1 overflow-y-auto px-5 py-4">
					<HistoryBody
						confirming={confirming}
						onCancelConfirm={() => setConfirming(null)}
						onConfirm={handleRestore}
						onRequestConfirm={setConfirming}
						restoring={restoring}
						revisions={revisions}
					/>
				</div>
			</aside>
		</>
	);
}

function HistoryBody({
	revisions,
	confirming,
	restoring,
	onRequestConfirm,
	onCancelConfirm,
	onConfirm,
}: {
	revisions: RevisionSummary[] | null;
	confirming: number | null;
	restoring: number | null;
	onRequestConfirm: (version: number) => void;
	onCancelConfirm: () => void;
	onConfirm: (version: number) => void;
}) {
	if (revisions === null) {
		return <p className="text-muted-foreground text-sm">Carregando…</p>;
	}

	if (revisions.length === 0) {
		return (
			<p className="rounded-lg border border-border border-dashed px-4 py-10 text-center text-muted-foreground text-sm">
				Ainda não há publicações. O histórico começa na primeira vez que você
				publicar.
			</p>
		);
	}

	return (
		<ol className="flex flex-col gap-3">
			{revisions.map((revision, index) => (
				<li
					className="rounded-xl border border-border p-4"
					key={revision.version}
				>
					<div className="flex items-center justify-between">
						<span className="font-semibold text-sm">
							Revisão {revision.version}
							{index === 0 ? (
								<span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 text-xs">
									atual
								</span>
							) : null}
						</span>
						<time className="text-muted-foreground text-xs">
							{dateFormatter.format(new Date(revision.createdAt))}
						</time>
					</div>

					<p className="mt-1 text-muted-foreground text-xs">
						por {revision.createdBy}
					</p>
					{revision.note ? (
						<p className="mt-1.5 text-sm">{revision.note}</p>
					) : null}

					{index === 0 ? null : (
						<div className="mt-3">
							{confirming === revision.version ? (
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground text-xs">
										Restaurar este conteúdo?
									</span>
									<Button
										disabled={restoring !== null}
										onClick={() => onConfirm(revision.version)}
										size="sm"
										type="button"
									>
										{restoring === revision.version
											? "Restaurando…"
											: "Confirmar"}
									</Button>
									<Button
										disabled={restoring !== null}
										onClick={onCancelConfirm}
										size="sm"
										type="button"
										variant="ghost"
									>
										Cancelar
									</Button>
								</div>
							) : (
								<Button
									onClick={() => onRequestConfirm(revision.version)}
									size="sm"
									type="button"
									variant="outline"
								>
									Restaurar
								</Button>
							)}
						</div>
					)}
				</li>
			))}
		</ol>
	);
}
