const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:4010";

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

	const res = await fetch(url, {
		...options,
		headers,
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
	transactions: "/api/transactions",
	alerts: "/api/alerts",
	bankLinkToken: "/api/integrations/banks/link-token",
};
