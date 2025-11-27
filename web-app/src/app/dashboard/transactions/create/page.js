"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { apiEndpoints, apiFetch } from "@/lib/api-client";
import { useCountry } from "@/components/country/country-context";
import { CountryBadge } from "@/components/country/country-badge";
import { useUser } from "@/components/auth/user-context";
import { useWorkspace } from "@/components/workspace/workspace-context";
import { useRoleGuard } from "@/hooks/use-role-guard";

const API_BASE_LABEL = process.env.NEXT_PUBLIC_API_BASE_URL || "el mismo host (Next.js API)";

const methods = [
	{ label: "Efectivo", value: "cash" },
	{ label: "Débito", value: "debit_card" },
	{ label: "Crédito", value: "credit_card" },
	{ label: "Transferencia", value: "transfer" },
];

export default function Page() {
	const canView = useRoleGuard(["client", "cs_agent"]);
	if (!canView) {
		return null;
	}
	return <TransactionsContent />;
}

function TransactionsContent() {
	const user = useUser();
	const { country } = useCountry();
	const { scope: workspaceScope, setScope: setWorkspaceScope, hasHousehold } = useWorkspace();
	const householdMembership = user?.householdMemberships?.[0];
	const householdId = householdMembership?.householdId ?? null;
	const [form, setForm] = React.useState({
		date: new Date().toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm
		amount: "",
		categoryId: "",
		method: "debit_card",
		notes: "",
	});
	const [scope, setScope] = React.useState(workspaceScope);
	const [status, setStatus] = React.useState("idle");
	const [message, setMessage] = React.useState(null);

	React.useEffect(() => {
		setScope(workspaceScope);
	}, [workspaceScope]);

	function handleChange(event) {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setStatus("loading");
		setMessage(null);
		try {
			const payload = {
				date: new Date(form.date).toISOString(),
				amount: Number(form.amount),
				categoryId: form.categoryId,
				method: form.method,
				notes: form.notes,
				country: country.code,
				scope,
				householdId: scope === "household" && householdId ? householdId : null,
			};
			await apiFetch(apiEndpoints.transactions, {
				method: "POST",
				body: JSON.stringify(payload),
			});
			setStatus("success");
			setMessage("Transacción registrada con éxito.");
			setForm((prev) => ({
				...prev,
				amount: "",
				notes: "",
			}));
		} catch (error_) {
			setStatus("error");
			setMessage(error_.message);
		}
	}

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
					<Typography variant="h4">Registrar transacción (API local)</Typography>
					<Typography color="text.secondary" variant="body2">
						País activo: {country.name} · Moneda: {country.currency} · Endpoint:{" "}
						{`${API_BASE_LABEL}${apiEndpoints.transactions}`}
					</Typography>
					<Box sx={{ mt: 1 }}>
						<CountryBadge size="small" />
					</Box>
				</Box>
				<Card>
					<CardContent>
						<form onSubmit={handleSubmit}>
							<Stack spacing={3}>
								<TextField
									label="Fecha"
									name="date"
									type="datetime-local"
									value={form.date}
									onChange={handleChange}
									required
								/>
								<TextField
									label="Monto (en moneda local)"
									name="amount"
									type="number"
									value={form.amount}
									onChange={handleChange}
									helperText={`Moneda: ${country.currency}`}
									required
								/>
								<TextField
									label="Ámbito"
									select
									value={scope}
									onChange={(event) => {
										const nextScope = event.target.value;
										setScope(nextScope);
										if (nextScope !== workspaceScope) {
											setWorkspaceScope(nextScope);
										}
									}}
									helperText={
										scope === "household" && !householdId
											? "No tienes hogar asignado, usa el presupuesto personal."
											: "Define si afecta al presupuesto personal o familiar."
									}
								>
									<MenuItem value="personal">Personal</MenuItem>
									<MenuItem value="household" disabled={!hasHousehold && !householdId}>
										Familiar
									</MenuItem>
								</TextField>
								<TextField
									label="Categoría"
									name="categoryId"
									placeholder="gastos_fijos"
									value={form.categoryId}
									onChange={handleChange}
									required
								/>
								<TextField label="Método" name="method" select value={form.method} onChange={handleChange}>
									{methods.map((option) => (
										<MenuItem key={option.value} value={option.value}>
											{option.label}
										</MenuItem>
									))}
								</TextField>
								<TextField
									label="Notas"
									name="notes"
									multiline
									minRows={3}
									value={form.notes}
									onChange={handleChange}
								/>
								<Box sx={{ display: "flex", gap: 2 }}>
									<Button disabled={status === "loading"} type="submit" variant="contained">
										{status === "loading" ? "Enviando..." : "Guardar"}
									</Button>
								</Box>
								{message && (
									<Typography color={status === "error" ? "error" : "success.main"} variant="body2">
										{message}
									</Typography>
								)}
							</Stack>
						</form>
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
}
