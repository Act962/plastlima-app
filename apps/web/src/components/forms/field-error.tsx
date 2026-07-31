type FieldErrorProps = {
	id?: string;
	message?: string;
};

/** Mensagem de erro de um campo específico, anunciada por leitores de tela. */
export function FieldError({ id, message }: FieldErrorProps) {
	if (message === undefined) {
		return null;
	}

	return (
		<span className="font-semibold text-[13px] text-brand" id={id} role="alert">
			{message}
		</span>
	);
}
