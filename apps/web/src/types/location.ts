export const LOCATION_STATES = ["Piauí", "Maranhão", "Pernambuco"] as const;

export type LocationState = (typeof LOCATION_STATES)[number];

export type OpeningHours = {
	days: string;
	time: string;
};

export type StoreLocation = {
	id: string;
	name: string;
	state: LocationState;
	city: string;
	phone: string;
	whatsappUrl: string;
	instagramUrl?: string;
	mapEmbedUrl: string;
	hours: OpeningHours[];
};
