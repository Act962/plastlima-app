import type { FranchiseContent } from "@plastlima-app/core/schemas";

/**
 * Conteúdo inicial da página de franquias, para o documento nascer completo no
 * primeiro acesso. Espelha `apps/web/src/data/franchise.ts` (temporário, como os
 * demais seeds) — precisa ser fiel e inteiro, senão a primeira publicação
 * encolheria a página no site.
 */
export const FRANCHISE_SEED: FranchiseContent = {
	timeline: [
		{
			year: "2002",
			description:
				"Início modesto em um pequeno negócio na Ceasa de Teresina, visando a subsistência.",
		},
		{
			year: "2004",
			description:
				"Mudança para o Mercado Central de Teresina, com foco no atendimento varejista.",
		},
		{
			year: "2005",
			description: "Nova mudança de endereço para o bairro Parque Piauí.",
		},
		{
			year: "2007",
			description:
				"Estabelecimento da sede própria no bairro Promorar, expansão para o atendimento atacadista e abertura da primeira filial no bairro Parque Piauí.",
		},
		{
			year: "2013",
			description:
				"Inauguração do novo centro de distribuição para atender às necessidades das quatro lojas de varejo ativas e clientes em Teresina e Timon-MA.",
		},
		{
			year: "2015",
			description:
				"Expansão da empresa, abrangendo o atendimento atacadista no interior dos estados do Piauí e Maranhão, com investimento em frota própria.",
		},
		{
			year: "2017",
			description:
				"Investimento em tecnologia, implementação de um sistema ERP abrangente para otimizar a administração da empresa e atendimento digital de vendas.",
		},
		{
			year: "2020",
			description:
				"Adaptação ao cenário da pandemia e preparação das lojas de varejo para a concessão de uso da marca e a transição para o modelo de franquias.",
		},
		{
			year: "2022",
			description:
				"Formalização legal da marca PlastLima Franquia e conversão de todas as lojas existentes em franquias PlastLima. Abertura de duas novas lojas franqueadas.",
		},
		{
			year: "2023",
			description:
				"Início do processo de seleção de candidatos a franquias e fechamento do contrato da 10ª franquia, inaugurada em março, na cidade de Ouricuri-PE, marcando a expansão da marca para o estado de Pernambuco.",
		},
	],
	segments: [
		"Alimentação",
		"Fast-food",
		"Setor religioso",
		"Lojistas",
		"Padarias",
		"Comércio varejista",
		"Setor hospitalar",
		"Utilidades",
		"Frutarias",
		"Frigoríficos",
		"Linha institucional",
		"Hotelaria",
		"Agropecuária",
		"Petshops",
		"Autopeças e muito mais",
	],
	about: [
		"A PLASTLIMA é uma empresa que nasceu do sonho e dedicação de Aguilar, que iniciou sua carreira como comerciante em um box do CEASA-PI ao lado de sua família.",
		"Com conhecimento acadêmico e experiência no mercado de descartáveis, Aguilar fundou a empresa em 2002 e desenvolveu uma forma própria de gerir seu negócio, permitindo que a PLASTLIMA se tornasse uma das empresas mais sólidas da região nesse segmento. Com o sucesso da empresa, a PLASTLIMA expandiu seus negócios por meio do Sistema de Franquia Empresarial, sendo a primeira franquia no varejo de produtos descartáveis do Brasil.",
		"Atualmente, a PLASTLIMA é uma marca forte, conhecida e consolidada no mercado de descartáveis, parceira dos maiores fornecedores do Brasil e atende a diversos tipos de público.",
	],
	marketImages: [
		{
			src: "/market/market-data-01.png",
			alt: "Dados do mercado de embalagens no Brasil",
		},
		{
			src: "/market/market-data-02.png",
			alt: "Dados de crescimento do setor de embalagens",
		},
	],
};
