"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type { ZodType } from "zod";

export type FormStatus = "idle" | "submitting" | "success" | "error";

type UseFormSubmissionOptions<Values> = {
	schema: ZodType<Values>;
	onSubmit: (values: Values) => Promise<void>;
	successMessage: string;
};

/**
 * Validate-then-send pipeline shared by every form: reads the native FormData,
 * validates it with the given schema and delegates delivery to `onSubmit`.
 */
export function useFormSubmission<Values>({
	schema,
	onSubmit,
	successMessage,
}: UseFormSubmissionOptions<Values>) {
	const [status, setStatus] = useState<FormStatus>("idle");
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const parsed = schema.safeParse(
			Object.fromEntries(new FormData(event.currentTarget)),
		);

		if (!parsed.success) {
			setStatus("error");
			setError(
				parsed.error.issues[0]?.message ?? "Verifique os campos preenchidos.",
			);
			return;
		}

		setStatus("submitting");
		setError(null);

		try {
			await onSubmit(parsed.data);
			setStatus("success");
			toast.success(successMessage);
		} catch {
			setStatus("error");
			setError("Não foi possível enviar agora. Tente novamente em instantes.");
		}
	}

	return {
		status,
		error,
		handleSubmit,
		isSubmitting: status === "submitting",
		isSuccess: status === "success",
	};
}
