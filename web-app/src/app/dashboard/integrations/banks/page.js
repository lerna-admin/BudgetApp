"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { apiEndpoints, apiFetch } from "@/lib/api-client";
import { useCountry } from "@/components/country/country-context";
import { CountryBadge } from "@/components/country/country-badge";
import { useRoleGuard } from "@/hooks/use-role-guard";

const API_BASE_LABEL = process.env.NEXT_PUBLIC_API_BASE_URL || "el mismo host (Next.js API)";

export default function BankIntegrationsPage() {
	const canView = useRoleGuard(["admin", "cs_agent"]);
	if (!canView) {
		return null;
	}
	return <BankIntegrationsContent />;
}

function BankIntegrationsContent() {
	const { country, setCountry, options } = useCountry();
	const [form, setForm] = React.useState({
		country: country.code,
		institutionId: "",
	});
	const [status, setStatus] = React.useState("idle");
	const [error, setError] = React.useState(null);
	const [tokenResponse, setTokenResponse] = React.useState(null);

	function handleChange(event) {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
		if (name === "country") {
			setCountry(value);
		}
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setStatus("loading");
		setError(null);
		setTokenResponse(null);

		try {
			const payload = {
				institutionId: form.institutionId.trim(),
				country: form.country,
			};
			const result = await apiFetch(apiEndpoints.bankLinkToken, {
				method: "POST",
				body: JSON.stringify(payload),
			});
			setTokenResponse(result);
			setStatus("success");
		} catch (error_) {
			setStatus("error");
			setError(error_.message);
		}
	}

	function handleReset() {
		setForm({ country: country.code, institutionId: "" });
		setStatus("idle");
		setError(null);
		setTokenResponse(null);
	}

	const selectedCountry = options.find((option) => option.code === form.country);

	return (
		<Box
			sx={{
				maxWidth: "var(--Content-maxWidth)",
				m: "var(--Content-margin)",
				p: "var(--Content-padding)",
				width: "var(--Content-width)",
			}}
		>
			<Stack spacing={4}>
				<Box>
					<Typography variant="h4">Integraciones bancarias (API local)</Typography>
					<Typography color="text.secondary" variant="body2">
						Genera un `linkToken` efímero consumiendo {apiEndpoints.bankLinkToken} en {API_BASE_LABEL}.
					</Typography>
					<Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
						Usa este token para iniciar el flujo con el proveedor externo (Belvo/Minka en Colombia) antes de redirigir
						al usuario al widget bancario.
					</Typography>
					<Box sx={{ mt: 1 }}>
						<CountryBadge showProvider size="small" />
					</Box>
				</Box>

				<Card>
					<CardContent>
						<form onSubmit={handleSubmit}>
							<Stack spacing={3}>
								<TextField label="País" name="country" select value={form.country} onChange={handleChange}>
									{options.map((option) => (
										<MenuItem key={option.code} value={option.code}>
											{option.name}
										</MenuItem>
									))}
								</TextField>
								<TextField
									label="Institución"
									name="institutionId"
									required
									value={form.institutionId}
									onChange={handleChange}
									helperText="Ejemplos: belvo_sandbox_co, bancolombia_prod"
								/>
								<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
									<Button disabled={status === "loading"} type="submit" variant="contained">
										{status === "loading" ? "Solicitando..." : "Generar link token"}
									</Button>
									<Button disabled={status === "loading"} onClick={handleReset} type="button" variant="text">
										Limpiar
									</Button>
								</Stack>
								{error && (
									<Typography color="error" variant="body2">
										{error}
									</Typography>
								)}
							</Stack>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardContent>
						<Typography variant="h6">Resultado</Typography>
						<Typography color="text.secondary" variant="body2">
							Proveedor objetivo: {selectedCountry?.provider}
						</Typography>
						<Divider sx={{ my: 2 }} />
						{!tokenResponse && (
							<Typography color="text.secondary" variant="body2">
								Completa el formulario para obtener un token efímero.
							</Typography>
						)}
						{tokenResponse && (
							<Stack spacing={1}>
								<Typography variant="body2">
									<strong>linkToken:</strong> {tokenResponse.linkToken}
								</Typography>
								<Typography variant="body2">
									<strong>expira en:</strong> {tokenResponse.expiresIn} segundos
								</Typography>
								<Typography color="text.secondary" variant="body2">
									Usa este token inmediatamente para iniciar el widget del banco o simular la redirección en QA.
								</Typography>
							</Stack>
						)}
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
}
