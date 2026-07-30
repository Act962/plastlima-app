import type { RichTextSegment } from "@/types/content";
import { IMAGES } from "./images";

export type StoryBlock =
	| {
			id: string;
			kind: "paragraph";
			tone?: "lead";
			segments: RichTextSegment[];
	  }
	| { id: string; kind: "image"; src: string; alt: string };

export const ABOUT_STORY: StoryBlock[] = [
	{
		id: "origin",
		kind: "paragraph",
		tone: "lead",
		segments: [
			"A PlastLima é uma empresa com uma história de sucesso e dedicação, que ",
			{ text: "começou em 2002", emphasis: true },
			" como um ",
			{
				text: "pequeno negócio em um box de 30m² na Ceasa de Teresina",
				emphasis: true,
			},
			", com o objetivo inicial de garantir a subsistência. Com muito trabalho e visão empreendedora, a empresa cresceu e expandiu seus horizontes ao longo dos anos.",
		],
	},
	{
		id: "retail-years",
		kind: "paragraph",
		segments: [
			{
				text: "Em 2004, mudamos para o Mercado Central, no Centro de Teresina",
				emphasis: true,
			},
			", focando no atendimento varejista. Em 2005, realizamos uma nova mudança, dessa vez para o bairro Parque Piauí, proporcionando um espaço mais amplo para atender nossos clientes.",
		],
	},
	{
		id: "photo-storefront",
		kind: "image",
		src: IMAGES.about.storefront,
		alt: "Fachada da PlastLima",
	},
	{
		id: "first-headquarters",
		kind: "paragraph",
		segments: [
			"Foi ",
			{ text: "em 2007", emphasis: true },
			" que demos um grande salto, ",
			{
				text: "mudando para o bairro Promorar e estabelecendo nossa sede própria em uma área de 1.000m²",
				emphasis: true,
			},
			". Nesse momento, também iniciamos nossa atuação no comércio atacadista, contando com os primeiros representantes de vendas dedicados a esse segmento. ",
			{
				text: "No mesmo ano, inauguramos nossa primeira loja filial no bairro Parque Piauí,",
				emphasis: true,
			},
			" ampliando nossa presença na região.",
		],
	},
	{
		id: "distribution-center",
		kind: "paragraph",
		segments: [
			"O ",
			{
				text: "ano de 2013 foi marcado pela inauguração do nosso novo centro de distribuição, um espaço de 10 mil metros quadrados",
				emphasis: true,
			},
			". Com quatro lojas PlastLima de varejo em pleno funcionamento e uma carteira de clientes que abrangia toda a cidade de Teresina e Timon-MA, estávamos prontos para atender a demanda crescente.",
		],
	},
	{
		id: "expansion",
		kind: "paragraph",
		segments: [
			{
				text: "Em 2015, expandimos ainda mais nossa presença, abrindo novas lojas PlastLima em diversas localidades de Teresina e Timon-MA",
				emphasis: true,
			},
			". Além disso, iniciamos nosso atendimento atacadista no interior dos estados do Piauí e Maranhão, contando com uma equipe de representantes de vendas e investindo em uma frota própria de carros para garantir uma logística eficiente.",
		],
	},
	{
		id: "photo-warehouse",
		kind: "image",
		src: IMAGES.about.warehouseOperation,
		alt: "Operação do centro de distribuição da PlastLima",
	},
	{
		id: "technology",
		kind: "paragraph",
		segments: [
			{
				text: "A busca constante pela excelência nos levou a investir em tecnologia em 2017",
				emphasis: true,
			},
			", adotando um sistema ERP abrangente para otimizar nossa administração. Esse investimento nos permitiu oferecer atendimento digital aos nossos clientes por meio do aplicativo do novo sistema, fortalecendo ainda mais nossa equipe de representantes de vendas.",
		],
	},
	{
		id: "franchise-model",
		kind: "paragraph",
		segments: [
			{
				text: "Com a chegada da pandemia em 2020, nos adaptamos e começamos a preparar nossas lojas de varejo para a concessão de uso de marca",
				emphasis: true,
			},
			", com o objetivo de expandir por meio do modelo de franquias. ",
			{
				text: "Em 2022, com o apoio de uma consultoria jurídica, legalizamos a marca PlastLima Franquia e transformamos todas as lojas existentes em franquias",
				emphasis: true,
			},
			". Além disso, inauguramos duas novas lojas no formato de franquia, com um layout arquitetônico e estruturação comercial padronizada.",
		],
	},
	{
		id: "new-territory",
		kind: "paragraph",
		segments: [
			{
				text: "Em 2023, demos início ao processo de seleção de candidatos(as) para nossas franquias e fechamos contrato para inaugurar a 10ª franquia na cidade de Ouricuri-PE",
				emphasis: true,
			},
			", conquistando um novo território no estado de Pernambuco.",
		],
	},
	{
		id: "today",
		kind: "paragraph",
		segments: [
			"Com uma trajetória sólida e compromisso com a qualidade, a PlastLima se tornou uma referência no setor, fazendo parte de um setor que emprega mais de 330 mil pessoas somente no Brasil. Estamos comprometidos em fornecer produtos de alta qualidade, excelência no atendimento e oportunidades de negócio para aqueles que desejam se juntar à nossa rede de franquias de sucesso.",
		],
	},
];

export const ABOUT_SUMMARY =
	"A PlastLima é uma empresa referência no ramo de descartáveis, embalagens e com um diversificado mix de produtos para seu empreendimento. Atuando no mercado desde 2002, fornecemos produtos para Restaurantes e Lanchonetes, Confeitaria, Panificação, Comércio, Hospitalar e muito mais. Atualmente, contamos com um Centro de Distribuição de mais de 10.000 metros quadrados para melhor atender clientes e parceiros.";

export const WELCOME_MESSAGE =
	"Seja bem-vindo(a) ao universo PlastLima! Junte-se a nós e faça parte dessa história de crescimento e realização.";
