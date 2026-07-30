import { cn } from "@plastlima-app/ui/lib/utils";
import { fieldControlClassName, fieldLabelClassName } from "./field-styles";

type TextFieldProps = {
	label: string;
	name: string;
	type?: "text" | "email" | "tel";
	required?: boolean;
	autoComplete?: string;
	className?: string;
};

export function TextField({
	label,
	name,
	type = "text",
	required,
	autoComplete,
	className,
}: TextFieldProps) {
	return (
		<label className={cn("flex flex-col gap-[7px]", className)}>
			<span className={fieldLabelClassName}>{label}</span>
			<input
				autoComplete={autoComplete}
				className={fieldControlClassName}
				name={name}
				required={required}
				type={type}
			/>
		</label>
	);
}
