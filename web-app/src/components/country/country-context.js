"use client";

import * as React from "react";

import { countryCatalog, defaultCountryCode, getCountryByCode } from "@/config/countries";
import { apiEndpoints, apiFetch } from "@/lib/api-client";

const STORAGE_KEY = "budgetapp:country";

const CountryContext = React.createContext(null);

export function CountryProvider({ children }) {
	const [countryCode, setCountryCode] = React.useState(defaultCountryCode);
	const [options, setOptions] = React.useState(countryCatalog);
	const [loading, setLoading] = React.useState(false);

	React.useEffect(() => {
		if (globalThis.window === undefined) {
			return;
		}
		const stored = globalThis.window.localStorage.getItem(STORAGE_KEY);
		if (stored && getCountryByCode(stored)) {
			setCountryCode(stored);
		}
	}, []);

	React.useEffect(() => {
		if (globalThis.window === undefined) {
			return;
		}
		globalThis.window.localStorage.setItem(STORAGE_KEY, countryCode);
	}, [countryCode]);

	const refreshCountries = React.useCallback(async () => {
		setLoading(true);
		try {
			const response = await apiFetch(apiEndpoints.countries);
			if (Array.isArray(response) && response.length > 0) {
				setOptions(response);
			} else if (response?.data) {
				setOptions(response.data);
			}
		} catch (error) {
			console.warn("No se pudo cargar catálogo de países desde API, usando fallback.", error);
			setOptions(countryCatalog);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		void refreshCountries();
	}, [refreshCountries]);

	const setCountry = React.useCallback(
		(nextCode) => {
			const exists =
				options.find((country) => country.code === nextCode) ||
				getCountryByCode(nextCode) ||
				countryCatalog.find((item) => item.code === nextCode);
			if (exists?.code) {
				setCountryCode(exists.code);
			}
		},
		[options],
	);

	const resolvedCountry =
		options.find((item) => item.code === countryCode) ||
		getCountryByCode(countryCode) ||
		getCountryByCode(defaultCountryCode) ||
		options[0] ||
		countryCatalog[0];

	const value = React.useMemo(
		() => ({
			country: resolvedCountry,
			setCountry,
			options,
			refreshCountries,
			loading,
		}),
		[resolvedCountry, setCountry, options, refreshCountries, loading],
	);

	return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry() {
	const context = React.useContext(CountryContext);
	if (!context) {
		throw new Error("useCountry must be used within CountryProvider");
	}
	return context;
}
