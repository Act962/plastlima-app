"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneNumber, TaxDocument } from "@plastlima-app/core";
import {
	type RaffleRegistration,
	raffleRegistrationSchema,
} from "@plastlima-app/core/schemas";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { registerParticipationAction } from "@/app/sorteio/actions";
import { CheckboxField } from "@/components/forms/checkbox-field";
import { ChoiceField } from "@/components/forms/choice-field";
import { FormError } from "@/components/forms/form-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { RAFFLE_CAMPAIGN } from "@/data/raffle";
import {
	DISTRIBUTION_CENTER_ID,
	RAFFLE_STORE_OPTIONS,
} from "@/lib/raffle/store-directory";

const consentLinkClassName =
	"font-semibold text-brand underline underline-offset-2 hover:text-brand-dark";

/**
 * Onde a pessoa comprou, do ponto de vista da tela.
 *
 * É estado só da interface: o que vai para o servidor é sempre um `storeId` —
 * o do Centro de Distribuição ou o da loja escolhida. O grupo sorteado é
 * deduzido lá a partir dessa loja, então não há como enviar um grupo que
 * contradiz o local da compra.
 */
type PurchaseOrigin = "cd" | "unidades";

export function RaffleForm() {
	const [isPending, startTransition] = useTransition();
	const [origin, setOrigin] = useState<PurchaseOrigin | null>(null);

	const { poolChoice } = RAFFLE_CAMPAIGN.form;

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
			document: "",
			acceptedTerms: false,
		},
	});

	const phoneField = register("phone");
	const documentField = register("document");
	const selectedStoreId = watch("storeId");
	const selectedStore = RAFFLE_STORE_OPTIONS.find(
		(option) => option.value === selectedStoreId,
	);

	function handleOriginChange(next: PurchaseOrigin) {
		setOrigin(next);
		clearErrors("storeId");

		// O CD é uma "loja" do diretório: escolher a origem já resolve o `storeId`.
		// Ao voltar para as lojas, limpa para a pessoa escolher qual.
		setValue("storeId", next === "cd" ? DISTRIBUTION_CENTER_ID : "", {
			shouldValidate: false,
		});
	}

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

			<ChoiceField
				error={origin === null ? errors.storeId?.message : undefined}
				hint={poolChoice.hint}
				label={poolChoice.label}
				name="purchaseOrigin"
				onChange={handleOriginChange}
				options={[
					{
						value: "cd",
						label: poolChoice.options.cd.label,
						description: poolChoice.options.cd.description,
					},
					{
						value: "unidades",
						label: poolChoice.options.unidades.label,
						description: poolChoice.options.unidades.description,
					},
				]}
				value={origin}
			/>

			{origin === "unidades" ? (
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
			) : null}

			<TextField
				autoComplete="off"
				error={errors.document?.message}
				hint="Ajuda a confirmar sua identidade na entrega do prêmio."
				inputMode="numeric"
				label="CPF ou CNPJ (opcional)"
				placeholder="000.000.000-00"
				{...documentField}
				onChange={(event) => {
					event.target.value = TaxDocument.mask(event.target.value);
					void documentField.onChange(event);
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
