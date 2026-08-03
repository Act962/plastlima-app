"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneNumber } from "@plastlima-app/core";
import {
	type RaffleRegistration,
	raffleRegistrationSchema,
} from "@plastlima-app/core/schemas";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { registerParticipationAction } from "@/app/sorteio/actions";
import { CheckboxField } from "@/components/forms/checkbox-field";
import { FileField } from "@/components/forms/file-field";
import { FormError } from "@/components/forms/form-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { RAFFLE_STORE_OPTIONS } from "@/lib/raffle/store-directory";

const consentLinkClassName =
	"font-semibold text-brand underline underline-offset-2 hover:text-brand-dark";

export function RaffleForm() {
	const [isPending, startTransition] = useTransition();

	const {
		register,
		handleSubmit,
		setValue,
		setError,
		clearErrors,
		watch,
		formState: { errors },
	} = useForm<RaffleRegistration>({
		resolver: zodResolver(raffleRegistrationSchema),
		defaultValues: {
			name: "",
			phone: "",
			storeId: "",
			acceptedTerms: false,
		},
	});

	const phoneField = register("phone");
	const selectedStoreId = watch("storeId");
	const selectedStore = RAFFLE_STORE_OPTIONS.find(
		(option) => option.value === selectedStoreId,
	);

	function onSubmit(values: RaffleRegistration) {
		clearErrors("root");

		startTransition(async () => {
			const result = await registerParticipationAction(values);

			// Em caso de sucesso a action redireciona e este trecho não executa.
			if (result?.status === "error") {
				setError("root", { message: result.message });
			}
		});
	}

	return (
		<form
			className="flex flex-col gap-[18px]"
			noValidate
			onSubmit={handleSubmit(onSubmit)}
		>
			<TextField
				autoComplete="name"
				error={errors.name?.message}
				label="Nome completo"
				placeholder="Como está no seu documento"
				{...register("name")}
			/>

			<TextField
				autoComplete="tel"
				error={errors.phone?.message}
				hint="É por aqui que avisamos o ganhador."
				inputMode="tel"
				label="WhatsApp"
				placeholder="(86) 90000-0000"
				type="tel"
				{...phoneField}
				onChange={(event) => {
					event.target.value = PhoneNumber.mask(event.target.value);
					void phoneField.onChange(event);
				}}
			/>

			<SelectField
				error={errors.storeId?.message}
				hint={
					selectedStore === undefined
						? undefined
						: `Cidade: ${selectedStore.city} — ${selectedStore.state}`
				}
				label="Loja onde você comprou"
				options={RAFFLE_STORE_OPTIONS}
				placeholder="Selecione a loja…"
				{...register("storeId")}
			/>

			<FileField
				hint="Opcional. Ajuda a confirmar sua compra se houver dúvida."
				label="Foto do cupom"
				onChange={(image) => {
					setValue("receiptImage", image?.dataUrl, {
						shouldValidate: true,
					});
				}}
			/>

			<CheckboxField
				error={errors.acceptedTerms?.message}
				{...register("acceptedTerms")}
			>
				Li e aceito o{" "}
				<Link className={consentLinkClassName} href="/sorteio/regulamento">
					regulamento da promoção
				</Link>{" "}
				e a{" "}
				<Link className={consentLinkClassName} href="/politica-de-privacidade">
					política de privacidade
				</Link>
				.
			</CheckboxField>

			{errors.root?.message === undefined ? null : (
				<FormError message={errors.root.message} />
			)}

			<SubmitButton isSubmitting={isPending} label="Quero participar" />
		</form>
	);
}
