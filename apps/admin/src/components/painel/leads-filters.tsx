"use client";

import { Button, buttonVariants } from "@plastlima-app/ui/components/button";
import { Input } from "@plastlima-app/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@plastlima-app/ui/components/select";
import { cn } from "@plastlima-app/ui/lib/utils";
import { Download, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

/** Sentinela de "sem filtro": o Select precisa de um valor, a URL não. */
const ALL = "all";

/**
 * Rótulos por valor. O `Select` do base-ui mostra o valor cru se não receber
 * um filho-função que traduza — é o que evita "all" aparecer no gatilho.
 */
const ORIGEM_LABELS: Record<string, string> = {
	[ALL]: "Todas as origens",
	contact: "Contato",
	franchise: "Franquia",
};

const SITUACAO_LABELS: Record<string, string> = {
	[ALL]: "Todas as situações",
	new: "Novos",
	handled: "Atendidos",
};

type Props = {
	search?: string;
	kind?: string;
	status?: string;
};

export function LeadsFilters({ search, kind, status }: Props) {
	const router = useRouter();
	// `useTransition` para o clique não parecer travado: a navegação por
	// searchParams volta ao servidor, e sem o estado pendente o filtro fica
	// "surdo" até a resposta chegar. Com ele, a lista escurece e o botão avisa.
	const [isPending, startTransition] = useTransition();
	const [term, setTerm] = useState(search ?? "");
	const [origem, setOrigem] = useState(kind ?? ALL);
	const [situacao, setSituacao] = useState(status ?? ALL);

	function apply(next?: Partial<{ origem: string; situacao: string }>) {
		const o = next?.origem ?? origem;
		const s = next?.situacao ?? situacao;

		const params = new URLSearchParams();
		if (term.trim()) params.set("busca", term.trim());
		if (o !== ALL) params.set("origem", o);
		if (s !== ALL) params.set("situacao", s);

		const query = params.toString();
		startTransition(() => {
			router.push(query ? `/leads?${query}` : "/leads");
		});
	}

	function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		apply();
	}

	const exportParams = new URLSearchParams();
	if (term.trim()) exportParams.set("busca", term.trim());
	if (origem !== ALL) exportParams.set("origem", origem);
	if (situacao !== ALL) exportParams.set("situacao", situacao);
	const exportQuery = exportParams.toString();
	const exportHref = exportQuery
		? `/leads/exportar?${exportQuery}`
		: "/leads/exportar";

	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-2 transition-opacity",
				isPending && "opacity-60",
			)}
		>
			<search className="min-w-[200px] flex-1">
				<form className="relative" onSubmit={onSubmit}>
					<Search
						aria-hidden
						className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						aria-label="Buscar por nome, e-mail ou telefone"
						className="max-w-xs pl-8"
						onChange={(event) => setTerm(event.target.value)}
						placeholder="Buscar por nome, e-mail ou telefone"
						type="search"
						value={term}
					/>
				</form>
			</search>

			<Select
				onValueChange={(value) => {
					const next = value ?? ALL;
					setOrigem(next);
					apply({ origem: next });
				}}
				value={origem}
			>
				<SelectTrigger aria-label="Origem" className="w-[176px]">
					<SelectValue>
						{(value) => ORIGEM_LABELS[String(value)] ?? ORIGEM_LABELS[ALL]}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>Todas as origens</SelectItem>
					<SelectItem value="contact">Contato</SelectItem>
					<SelectItem value="franchise">Franquia</SelectItem>
				</SelectContent>
			</Select>

			<Select
				onValueChange={(value) => {
					const next = value ?? ALL;
					setSituacao(next);
					apply({ situacao: next });
				}}
				value={situacao}
			>
				<SelectTrigger aria-label="Situação" className="w-[176px]">
					<SelectValue>
						{(value) => SITUACAO_LABELS[String(value)] ?? SITUACAO_LABELS[ALL]}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>Todas as situações</SelectItem>
					<SelectItem value="new">Novos</SelectItem>
					<SelectItem value="handled">Atendidos</SelectItem>
				</SelectContent>
			</Select>

			<Button disabled={isPending} onClick={() => apply()} variant="outline">
				{isPending ? "Filtrando…" : "Filtrar"}
			</Button>

			<a className={buttonVariants({ className: "ml-auto" })} href={exportHref}>
				<Download />
				Exportar CSV
			</a>
		</div>
	);
}
