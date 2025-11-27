import os from "node:os";

function normalizeOrigin(value) {
	if (!value) {
		return null;
	}
	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}
	if (trimmed.includes("://")) {
		try {
			const url = new URL(trimmed);
			return url.port ? `${url.hostname}:${url.port}` : url.hostname;
		} catch {
			return null;
		}
	}
	return trimmed;
}

function withPorts(hosts, ports = ["3000", "3001"]) {
	return hosts.flatMap((host) => [host, ...ports.map((port) => `${host}:${port}`)]);
}

function resolveLocalOrigins() {
	const envOrigins = process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS
		? process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS.split(",").map(normalizeOrigin).filter(Boolean)
		: [];
	const defaults = withPorts(["localhost", "127.0.0.1"]);
	const networks = Object.values(os.networkInterfaces()).flatMap((list) =>
		(list ?? [])
			.filter((item) => item && !item.internal && item.family === "IPv4")
			.flatMap((item) => withPorts([item.address])),
	);
	const normalized = [...defaults, ...networks, ...envOrigins];
	return Array.from(new Set(normalized));
}

const allowedDevOrigins = resolveLocalOrigins();
console.info("[Next config] allowedDevOrigins", allowedDevOrigins);

const config = {
	experimental: {
		esmExternals: "loose", // Fix for React PDF Renderer
	},
	allowedDevOrigins,
};

export default config;
