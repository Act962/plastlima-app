import { cn } from "@plastlima-app/ui/lib/utils";
import { FieldError } from "./field-error";
import { fieldLabelClassName } from "./field-styles";

export type ChoiceOption<Value extends string> = {
	value: Value;
	label: string;
	description?: string;
};

type ChoiceFieldProps<Value extends string> = {
	label: string;
	name: string;
	options: ChoiceOption<Value>[];
	value: Value | null;
	onChange: (value: Value) => void;
	className?: string;
	error?: string;
	hint?: string;
};

/**
 * Escolha entre poucas opções mutuamente exclusivas, apresentada como cartões.
 *
 * Existe em vez de um `select` porque a resposta aqui decide de qual sorteio a
 * pessoa participa: as duas alternativas precisam estar visíveis lado a lado, e
 * nenhuma pode vir marcada por padrão — quem passa batido não pode cair em um
 * grupo por omissão.
 */
export function ChoiceField<Value extends string>({
	label,
	name,
	options,
	value,
	onChange,
	className,
	error,
	hint,
}: ChoiceFieldProps<Value>) {
	const errorId = error === undefined ? undefined : `${name}-error`;

	return (
		<fieldset className={cn("flex flex-col gap-[7px]", className)}>
			<legend className={cn(fieldLabelClassName, "mb-[7px]")}>{label}</legend>

			<div
				aria-describedby={errorId}
				className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-2.5"
			>
				{options.map((option) => {
					const checked = value === option.value;

					return (
						<label
							className={cn(
								"flex cursor-pointer gap-3 rounded-xl border-[1.5px] p-3.5 transition-colors",
								checked
									? "border-brand bg-brand/5"
									: "border-line bg-surface hover:border-body-muted",
								error !== undefined && value === null && "border-brand",
							)}
							key={option.value}
						>
							<input
								checked={checked}
								className="mt-0.5 size-4 shrink-0 accent-brand"
								name={name}
								onChange={() => onChange(option.value)}
								type="radio"
								value={option.value}
							/>
							<span className="flex flex-col gap-0.5">
								<span className="font-semibold text-[15px] text-ink leading-tight">
									{option.label}
								</span>
								{option.description === undefined ? null : (
									<span className="text-[13px] text-body-muted leading-snug">
										{option.description}
									</span>
								)}
							</span>
						</label>
					);
				})}
			</div>

			{hint !== undefined && error === undefined ? (
				<span className="text-[13px] text-body-muted">{hint}</span>
			) : null}
			<FieldError id={errorId} message={error} />
		</fieldset>
	);
}
