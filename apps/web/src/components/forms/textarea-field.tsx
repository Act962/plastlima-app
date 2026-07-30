import { cn } from "@plastlima-app/ui/lib/utils";
import { fieldControlClassName, fieldLabelClassName } from "./field-styles";

type TextareaFieldProps = {
	label: string;
	name: string;
	rows?: number;
	required?: boolean;
	className?: string;
};

export function TextareaField({
	label,
	name,
	rows = 4,
	required,
	className,
}: TextareaFieldProps) {
	return (
		<label className={cn("flex flex-col gap-[7px]", className)}>
			<span className={fieldLabelClassName}>{label}</span>
			<textarea
				className={cn(fieldControlClassName, "resize-y")}
				name={name}
				required={required}
				rows={rows}
			/>
		</label>
	);
}
