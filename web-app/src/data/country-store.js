import { ensureCountriesSeeded, readCountries, persistCountries } from "../lib/db";

function normalizeCountry(payload = {}) {
	const code = payload.code?.toUpperCase();
	if (!code || code.length < 2) {
		throw new Error("Código ISO inválido");
	}
	if (!payload.name) {
		throw new Error("Nombre requerido");
	}
	if (!payload.currency) {
		throw new Error("Moneda requerida");
	}
	return {
		code,
		name: payload.name,
		currency: payload.currency.toUpperCase(),
		locale: payload.locale ?? "es-CO",
		timezone: payload.timezone ?? "America/Bogota",
		provider: payload.provider ?? "",
	};
}

export async function listCountries() {
	await ensureCountriesSeeded();
	return readCountries();
}

export async function getCountry(code) {
	if (!code) {
		return null;
	}
	await ensureCountriesSeeded();
	return readCountries().find((country) => country.code === code.toUpperCase()) ?? null;
}

export async function upsertCountry(payload) {
	const country = normalizeCountry(payload);
	await ensureCountriesSeeded();
	const countries = readCountries();
	const index = countries.findIndex((item) => item.code === country.code);
	if (index === -1) {
		countries.push(country);
	} else {
		countries[index] = country;
	}
	persistCountries(countries);
	return country;
}

export async function removeCountry(code) {
	if (!code) {
		return false;
	}
	await ensureCountriesSeeded();
	const countries = readCountries().filter((country) => country.code !== code.toUpperCase());
	persistCountries(countries);
	return true;
}
