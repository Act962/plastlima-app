import type { Metadata } from "next";
import { Toaster } from "sonner";
import "../index.css";

export const metadata: Metadata = {
	title: {
		default: "Painel Plastlima",
		template: "%s | Painel Plastlima",
	},
	description: "Painel administrativo interno da Plastlima.",
	// Painel interno nunca deve aparecer em busca.
	robots: { index: false, follow: false },
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="pt-BR">
			<body>
				{children}
				<Toaster richColors />
			</body>
		</html>
	);
}
