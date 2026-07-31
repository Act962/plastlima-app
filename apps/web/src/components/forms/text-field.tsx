import { cn } from "@plastlima-app/ui/lib/utils";
import type { ComponentProps } from "react";
import { FieldError } from "./field-error";
import { fieldControlClassName, fieldLabelClassName } from "./field-styles";

type TextFieldProps = Omit<ComponentProps<"input">, "className"> & {
	label: string;
	name: string;
	className?: string;
	/** Mensagem de erro do campo. Aceita o `ref` e o resto das props do input,
	 * para funcionar tanto com formulários nativos quanto com react-hook-form. */
	error?: string;
	hint?: string;
};

export function TextField({
	label,
	name,
	type = "text",
	className,
	error,
	hint,
	...inputProps
}: TextFieldProps) {
	const errorId = error === undefined ? undefined : `${name}-error`;

	return (
		<label className={cn("flex flex-col gap-[7px]", className)}>
			<span className={fieldLabelClassName}>{label}</span>
			<input
				aria-describedby={errorId}
				aria-invalid={error === undefined ? undefined : true}
				className={cn(
					fieldControlClassName,
					error !== undefined && "border-brand",
				)}
				name={name}
				type={type}
				{...inputProps}
			/>
			{hint !== undefined && error === undefined ? (
				<span className="text-[13px] text-body-muted">{hint}</span>
			) : null}
			<FieldError id={errorId} message={error} />
		</label>
	);
}
