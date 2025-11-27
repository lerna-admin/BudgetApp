export const countryCatalog = [
	{
		code: "CO",
		name: "Colombia",
		currency: "COP",
		locale: "es-CO",
		timezone: "America/Bogota",
		provider: "Belvo / Minka",
	},
	{
		code: "MX",
		name: "México",
		currency: "MXN",
		locale: "es-MX",
		timezone: "America/Mexico_City",
		provider: "Belvo (roadmap)",
	},
	{
		code: "BR",
		name: "Brasil",
		currency: "BRL",
		locale: "pt-BR",
		timezone: "America/Sao_Paulo",
		provider: "Open Finance Brasil (roadmap)",
	},
];

export const defaultCountryCode = "CO";

export function getCountryByCode(code) {
	return countryCatalog.find((country) => country.code === code);
}
