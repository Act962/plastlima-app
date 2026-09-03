import type { Metadata } from "next";
import { Toaster } from "sonner";
import "../index.css";
import { cn } from "@plastlima-app/ui/lib/utils";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
		<html lang="pt-BR" className={cn("font-sans", inter.variable)}>
			<body>
				{children}
				<Toaster richColors />
			</body>
		</html>
	);
}
