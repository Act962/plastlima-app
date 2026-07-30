import { actionClassName } from "@/components/ui/action-styles";

type SubmitButtonProps = {
	isSubmitting: boolean;
	label?: string;
	className?: string;
};

export function SubmitButton({
	isSubmitting,
	label = "Enviar",
	className,
}: SubmitButtonProps) {
	return (
		<button
			className={actionClassName({ className: `w-full ${className ?? ""}` })}
			disabled={isSubmitting}
			type="submit"
		>
			{isSubmitting ? "Enviando…" : label}
		</button>
	);
}
