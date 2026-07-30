type FormSuccessProps = {
	title: string;
	description: string;
};

export function FormSuccess({ title, description }: FormSuccessProps) {
	return (
		<div className="px-2 py-12 text-center">
			<p className="mb-2.5 font-display font-extrabold text-[26px]">{title}</p>
			<p className="text-base text-body-muted">{description}</p>
		</div>
	);
}

type FormErrorProps = {
	message: string;
	className?: string;
};

export function FormError({ message, className }: FormErrorProps) {
	return (
		<p className={className} role="alert">
			<span className="font-semibold text-[14px] text-brand">{message}</span>
		</p>
	);
}
