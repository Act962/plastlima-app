"use client";

import { FormError, FormSuccess } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { useFormSubmission } from "@/hooks/use-form-submission";
import { franchiseLeadSchema } from "@/lib/schemas/lead";
import { leadService } from "@/lib/services/lead-service";

export function FranchiseLeadForm() {
	const { handleSubmit, isSubmitting, isSuccess, error } = useFormSubmission({
		schema: franchiseLeadSchema,
		onSubmit: leadService.submitFranchiseLead,
		successMessage: "Cadastro enviado com sucesso!",
	});

	if (isSuccess) {
		return (
			<FormSuccess
				description="Obrigado! Nossa equipe de franquias entrará em contato em breve."
				title="Cadastro enviado"
			/>
		);
	}

	return (
		<form
			className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-4"
			noValidate
			onSubmit={handleSubmit}
		>
			<TextField
				autoComplete="name"
				className="col-span-full"
				label="Nome"
				name="name"
				required
			/>
			<TextField
				autoComplete="email"
				label="E-mail"
				name="email"
				required
				type="email"
			/>
			<TextField
				autoComplete="tel"
				label="Telefone"
				name="phone"
				required
				type="tel"
			/>
			<TextField label="Estado" name="state" />
			<TextField label="Cidade" name="city" />
			<TextareaField
				className="col-span-full"
				label="Mensagem"
				name="message"
			/>

			{error ? <FormError className="col-span-full" message={error} /> : null}

			<SubmitButton className="col-span-full" isSubmitting={isSubmitting} />
		</form>
	);
}
