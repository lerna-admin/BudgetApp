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

import { appConfig } from "@/config/app";
import { apiEndpoints, apiFetch } from "@/lib/api-client";

const methods = [
	{ label: "Efectivo", value: "cash" },
	{ label: "Débito", value: "debit_card" },
	{ label: "Crédito", value: "credit_card" },
	{ label: "Transferencia", value: "transfer" },
];

export const metadata = { title: `Registrar transacción | Dashboard | ${appConfig.name}` };

export default function Page() {
	const [form, setForm] = React.useState({
		date: new Date().toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm
		amount: "",
		categoryId: "",
		method: "debit_card",
		notes: "",
	});
	const [status, setStatus] = React.useState("idle");
	const [message, setMessage] = React.useState(null);

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
			};
			await apiFetch(apiEndpoints.transactions, {
				method: "POST",
				body: JSON.stringify(payload),
			});
			setStatus("success");
			setMessage("Transacción registrada con éxito (mock).");
			setForm((prev) => ({
				...prev,
				amount: "",
				notes: "",
			}));
		} catch (err) {
			setStatus("error");
			setMessage(err.message);
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
					<Typography variant="h4">Registrar transacción (mock)</Typography>
					<Typography color="text.secondary" variant="body2">
						Envía datos a {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4010"} /
						{apiEndpoints.transactions}
					</Typography>
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
									required
								/>
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
