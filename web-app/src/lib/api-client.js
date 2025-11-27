const STATIC_ENV_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || null;
const FORCE_STATIC_IN_BROWSER =
	process.env.NEXT_PUBLIC_API_STRICT_BASE === "true" ||
	process.env.NEXT_PUBLIC_API_FORCE_BASE === "true";
const SERVER_FALLBACK_PORT = process.env.NEXT_PUBLIC_API_PORT || process.env.PORT || "3000";
const hasWindow = globalThis.window !== undefined;

function resolveBaseUrl() {
	if (hasWindow) {
		if (FORCE_STATIC_IN_BROWSER && STATIC_ENV_BASE) {
			return STATIC_ENV_BASE;
		}
		return `${globalThis.window.location.protocol}//${globalThis.window.location.host}`;
	}

	if (STATIC_ENV_BASE) {
		return STATIC_ENV_BASE;
	}

	return `http://127.0.0.1:${SERVER_FALLBACK_PORT}`;
}

const API_BASE_URL = resolveBaseUrl();

if (hasWindow) {
	// Helpful when sharing screenshots/logs about network errors.
	console.info("[API CLIENT] base URL", API_BASE_URL);
}

function resolveUrl(path) {
	if (!path) {
		throw new Error("Path is required");
	}
	if (path.startsWith("http://") || path.startsWith("https://")) {
		return path;
	}
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return `${API_BASE_URL}${normalized}`;
}

export async function apiFetch(path, options = {}) {
	const url = resolveUrl(path);
	const headers = {
		"Content-Type": "application/json",
		...options.headers,
	};

	console.debug("[API FETCH] request", { method: options.method ?? "GET", url, body: options.body });

	let res;
	try {
		res = await fetch(url, {
			...options,
			headers,
		});
	} catch (error) {
		console.error("[API FETCH] network error", { url, error });
		throw error;
	}

	console.debug("[API FETCH] response", {
		status: res.status,
		url,
		statusText: res.statusText,
	});

	if (!res.ok) {
		const errorBody = await res.text();
		throw new Error(
			`API error ${res.status}: ${res.statusText} - ${errorBody || "sin cuerpo"}`,
		);
	}

	if (res.status === 204) {
		return null;
	}

	return res.json();
}

export const apiEndpoints = {
	onboarding: "/api/onboarding",
	budgets: "/api/budgets",
	budgetsHistory: "/api/budgets/history",
	transactions: "/api/transactions",
	alerts: "/api/alerts",
	bankLinkToken: "/api/integrations/banks/link-token",
	countries: "/api/countries",
	households: "/api/households",
	householdMembers: (id) => `/api/households/${id}/members`,
	tickets: "/api/tickets",
	ticket: (id) => `/api/tickets/${id}`,
	reports: {
		kpis: "/api/reports/kpis",
	},
	auth: {
		login: "/api/auth/login",
		register: "/api/auth/register",
		logout: "/api/auth/logout",
	},
};
