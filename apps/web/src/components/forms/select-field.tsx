import { cn } from "@plastlima-app/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { FieldError } from "./field-error";
import { fieldControlClassName, fieldLabelClassName } from "./field-styles";

export type SelectOption = {
	value: string;
	label: string;
};

type SelectFieldProps = Omit<
	ComponentProps<"select">,
	"className" | "children"
> & {
	label: string;
	name: string;
	options: SelectOption[];
	/** Opção inicial vazia, para o campo não começar já preenchido. */
	placeholder?: string;
	className?: string;
	error?: string;
	hint?: string;
};

export function SelectField({
	label,
	name,
	options,
	placeholder = "Selecione…",
	className,
	error,
	hint,
	...selectProps
}: SelectFieldProps) {
	const errorId = error === undefined ? undefined : `${name}-error`;

	return (
		<label className={cn("flex flex-col gap-[7px]", className)}>
			<span className={fieldLabelClassName}>{label}</span>

			<span className="relative">
				<select
					aria-describedby={errorId}
					aria-invalid={error === undefined ? undefined : true}
					className={cn(
						fieldControlClassName,
						"w-full appearance-none pr-11",
						error !== undefined && "border-brand",
					)}
					defaultValue=""
					name={name}
					{...selectProps}
				>
					<option disabled value="">
						{placeholder}
					</option>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<ChevronDown
					aria-hidden
					className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-body-muted"
				/>
			</span>

			{hint !== undefined && error === undefined ? (
				<span className="text-[13px] text-body-muted">{hint}</span>
			) : null}
			<FieldError id={errorId} message={error} />
		</label>
	);
}
