import { fail, ok, type Result } from "../../shared/result";
import { InvalidLeadError } from "../errors";

/**
 * De qual formulário o lead veio.
 *
 * É lista fechada porque a origem muda o que é obrigatório (franquia precisa de
 * telefone, contato precisa de mensagem) e o que a equipe faz com ele depois.
 */
export const LEAD_KINDS = ["contact", "franchise"] as const;
export type LeadKind = (typeof LEAD_KINDS)[number];

/**
 * Onde o lead está no atendimento.
 *
 * Dois estados de propósito: uma caixa de entrada sem "atendido" faz a equipe
 * reler os mesmos contatos todo dia. Fluxos mais ricos (perdido, convertido)
 * são trabalho de CRM, não deste painel.
 */
export const LEAD_STATUSES = ["new", "handled"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 160;
const MAX_PHONE_LENGTH = 40;
const MAX_PLACE_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 5000;

/**
 * Checagem de formato, não de existência do endereço.
 *
 * A validação séria acontece no schema Zod da fronteira; aqui é só a invariante
 * mínima para não gravar "abc" na coluna de e-mail.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Forma plana da entidade, usada pelos mappers de persistência e pela UI. */
export type LeadSnapshot = {
	id: string | null;
	kind: LeadKind;
	name: string;
	email: string;
	phone: string | null;
	/**
	 * Só os dígitos de `phone`, para a busca do painel.
	 *
	 * Existe porque o telefone é guardado como a pessoa digitou — "(86)
	 * 98897-0955" — e uma busca por "86988970955" nunca casaria com isso. O campo
	 * derivado é o preço de manter o original intacto.
	 */
	phoneDigits: string | null;
	state: string | null;
	city: string | null;
	message: string | null;
	status: LeadStatus;
	createdAt: Date;
	handledAt: Date | null;
	/** E-mail de quem marcou como atendido — a trilha de auditoria da caixa. */
	handledBy: string | null;
};

type LeadProps = Omit<LeadSnapshot, "id">;

export type CreateLeadInput = {
	kind: LeadKind;
	name: string;
	email: string;
	phone?: string | null;
	state?: string | null;
	city?: string | null;
	message?: string | null;
	now: Date;
};

/**
 * Uma pessoa que preencheu um formulário do site.
 *
 * `id` é `null` enquanto não foi persistido — no MongoDB é o Prisma que gera o
 * `_id`, então o domínio não inventa identidade (mesma regra de `Participant`).
 *
 * Não há deduplicação: ao contrário do sorteio, a mesma pessoa pode mandar duas
 * mensagens diferentes, e juntar as duas perderia a segunda.
 */
export class Lead {
	private constructor(
		private props: LeadProps,
		readonly id: string | null,
	) {}

	static create(input: CreateLeadInput): Result<Lead, InvalidLeadError> {
		const name = collapse(input.name);
		const email = input.email.trim().toLowerCase();
		const phone = optional(input.phone, MAX_PHONE_LENGTH);
		const state = optional(input.state, MAX_PLACE_LENGTH);
		const city = optional(input.city, MAX_PLACE_LENGTH);
		const message = optional(input.message, MAX_MESSAGE_LENGTH);

		if (name.length < MIN_NAME_LENGTH) {
			return fail(
				new InvalidLeadError(
					`nome precisa de ao menos ${MIN_NAME_LENGTH} caracteres`,
				),
			);
		}

		if (name.length > MAX_NAME_LENGTH) {
			return fail(new InvalidLeadError("nome muito longo"));
		}

		if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
			return fail(new InvalidLeadError("e-mail em formato inválido"));
		}

		if (isTooLong(input.phone, MAX_PHONE_LENGTH)) {
			return fail(new InvalidLeadError("telefone muito longo"));
		}

		if (isTooLong(input.message, MAX_MESSAGE_LENGTH)) {
			return fail(new InvalidLeadError("mensagem muito longa"));
		}

		if (input.kind === "franchise" && phone === null) {
			return fail(new InvalidLeadError("telefone é obrigatório em franquias"));
		}

		if (input.kind === "contact" && message === null) {
			return fail(new InvalidLeadError("mensagem é obrigatória em contato"));
		}

		return ok(
			new Lead(
				{
					kind: input.kind,
					name,
					email,
					phone,
					phoneDigits: onlyDigits(phone),
					state,
					city,
					message,
					status: "new",
					createdAt: input.now,
					handledAt: null,
					handledBy: null,
				},
				null,
			),
		);
	}

	/** Reconstitui a partir do banco. Não revalida — o dado já passou por `create`. */
	static restore(snapshot: LeadSnapshot): Lead {
		const { id, ...props } = snapshot;

		return new Lead({ ...props }, id);
	}

	/**
	 * Marca (ou desmarca) como atendido.
	 *
	 * Desmarcar limpa quem atendeu: manter o nome antigo num lead que voltou para
	 * "novo" faria o painel afirmar algo que não é mais verdade.
	 */
	setHandled(handled: boolean, by: string, at: Date): void {
		if (handled) {
			this.props.status = "handled";
			this.props.handledAt = at;
			this.props.handledBy = by;
			return;
		}

		this.props.status = "new";
		this.props.handledAt = null;
		this.props.handledBy = null;
	}

	get kind(): LeadKind {
		return this.props.kind;
	}

	get name(): string {
		return this.props.name;
	}

	get email(): string {
		return this.props.email;
	}

	get status(): LeadStatus {
		return this.props.status;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	toSnapshot(): LeadSnapshot {
		return { id: this.id, ...this.props };
	}
}

/** Extrai os dígitos para a busca; `null` quando não sobra nenhum. */
function onlyDigits(value: string | null): string | null {
	const digits = value?.replace(/\D/g, "") ?? "";

	return digits.length === 0 ? null : digits;
}

/** Apara as bordas e colapsa espaços internos — "  João   Silva " → "João Silva". */
function collapse(value: string): string {
	return value.trim().replace(/\s+/g, " ");
}

/** Campo opcional: vazio vira `null`, para o banco não guardar string em branco. */
function optional(
	value: string | null | undefined,
	max: number,
): string | null {
	const trimmed = value?.trim() ?? "";

	if (trimmed.length === 0 || trimmed.length > max) {
		return null;
	}

	return trimmed;
}

/** `optional` devolve `null` para vazio e para longo demais; isto separa os dois casos. */
function isTooLong(value: string | null | undefined, max: number): boolean {
	return (value?.trim().length ?? 0) > max;
}
