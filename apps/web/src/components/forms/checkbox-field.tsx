import { cn } from "@plastlima-app/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";
import { FieldError } from "./field-error";

type CheckboxFieldProps = Omit<
	ComponentProps<"input">,
	"type" | "className" | "children"
> & {
	/** Texto do consentimento. Aceita nós para incluir links. */
	children: ReactNode;
	name: string;
	className?: string;
	error?: string;
};

export function CheckboxField({
	children,
	name,
	className,
	error,
	...inputProps
}: CheckboxFieldProps) {
	const errorId = error === undefined ? undefined : `${name}-error`;

	return (
		<div className={cn("flex flex-col gap-[7px]", className)}>
			<label className="flex cursor-pointer items-start gap-3">
				<input
					aria-describedby={errorId}
					aria-invalid={error === undefined ? undefined : true}
					className={cn(
						"mt-0.5 size-5 shrink-0 cursor-pointer rounded-md border-[1.5px] border-line accent-brand",
						error !== undefined && "border-brand",
					)}
					name={name}
					type="checkbox"
					{...inputProps}
				/>
				<span className="text-[14.5px] text-body leading-[1.5]">
					{children}
				</span>
			</label>
			<FieldError id={errorId} message={error} />
		</div>
	);
}
