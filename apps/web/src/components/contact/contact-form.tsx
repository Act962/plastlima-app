"use client";

import { contactMessageSchema } from "@plastlima-app/core/schemas";
import { FormError, FormSuccess } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { useFormSubmission } from "@/hooks/use-form-submission";
import { leadService } from "@/lib/services/lead-service";

export function ContactForm() {
	const { handleSubmit, isSubmitting, isSuccess, error } = useFormSubmission({
		schema: contactMessageSchema,
		onSubmit: leadService.submitContactMessage,
		successMessage: "Mensagem enviada com sucesso!",
	});

	if (isSuccess) {
		return (
			<FormSuccess
				description="Obrigado pelo contato. Responderemos em breve."
				title="Mensagem enviada"
			/>
		);
	}

	return (
		<form
			className="flex flex-col gap-[18px]"
			noValidate
			onSubmit={handleSubmit}
		>
			<TextField autoComplete="name" label="Nome" name="name" required />
			<TextField
				autoComplete="email"
				label="E-mail"
				name="email"
				required
				type="email"
			/>
			<TextareaField label="Mensagem" name="message" required rows={6} />

			{error ? <FormError message={error} /> : null}

			<SubmitButton isSubmitting={isSubmitting} />
		</form>
	);
}
