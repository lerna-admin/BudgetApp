"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { apiEndpoints, apiFetch } from "@/lib/api-client";
import { useCountry } from "@/components/country/country-context";
import { CountryBadge } from "@/components/country/country-badge";

const locales = [
	{ value: "es-CO", label: "Español (Colombia)" },
	{ value: "es-MX", label: "Español (México)" },
	{ value: "pt-BR", label: "Português (Brasil)" },
	{ value: "en-US", label: "English (US)" },
];

export default function CountryAdminPage() {
	const { options, refreshCountries } = useCountry();
	const [form, setForm] = React.useState({
		code: "",
		name: "",
		currency: "",
		locale: "es-CO",
		timezone: "America/Bogota",
		provider: "",
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
				code: form.code.toUpperCase(),
				name: form.name,
				currency: form.currency.toUpperCase(),
				locale: form.locale,
				timezone: form.timezone,
				provider: form.provider,
			};
			await apiFetch(apiEndpoints.countries, {
				method: "POST",
				body: JSON.stringify(payload),
			});
			setStatus("success");
			setMessage("País registrado correctamente.");
			await refreshCountries();
			setForm({
				code: "",
				name: "",
				currency: "",
				locale: "es-CO",
				timezone: "America/Bogota",
				provider: "",
			});
		} catch (error) {
			setStatus("error");
			setMessage(error.message);
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
					<Typography variant="h4">Administrar países</Typography>
					<Typography color="text.secondary" variant="body2">
						Esta vista está pensada para usuarios con rol Admin/Compliance. Permite consultar y registrar nuevas
						entradas del catálogo `country_config` consumido por las demás pantallas.
					</Typography>
					<Box sx={{ mt: 1 }}>
						<CountryBadge showProvider size="small" />
					</Box>
				</Box>

				<Card>
					<CardContent>
						<Typography variant="h6" sx={{ mb: 2 }}>
							Catálogo actual
						</Typography>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Código</TableCell>
									<TableCell>Nombre</TableCell>
									<TableCell>Moneda</TableCell>
									<TableCell>Locale</TableCell>
									<TableCell>Timezone</TableCell>
									<TableCell>Proveedor bancario</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{options.map((country) => (
									<TableRow key={country.code}>
										<TableCell>{country.code}</TableCell>
										<TableCell>{country.name}</TableCell>
										<TableCell>{country.currency}</TableCell>
										<TableCell>{country.locale}</TableCell>
										<TableCell>{country.timezone}</TableCell>
										<TableCell>{country.provider}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card>
					<CardContent>
						<Typography variant="h6" sx={{ mb: 2 }}>
							Registrar país
						</Typography>
						<form onSubmit={handleSubmit}>
							<Grid container spacing={2}>
								<Grid xs={12} sm={4}>
									<TextField
										label="Código ISO (ej. CO)"
										name="code"
										value={form.code}
										onChange={handleChange}
										inputProps={{ maxLength: 3 }}
										required
										fullWidth
									/>
								</Grid>
								<Grid xs={12} sm={8}>
									<TextField label="Nombre" name="name" value={form.name} onChange={handleChange} required fullWidth />
								</Grid>
								<Grid xs={12} sm={4}>
									<TextField
										label="Moneda (ej. COP)"
										name="currency"
										value={form.currency}
										onChange={handleChange}
										required
										fullWidth
									/>
								</Grid>
								<Grid xs={12} sm={4}>
									<TextField label="Locale" name="locale" select value={form.locale} onChange={handleChange} fullWidth>
										{locales.map((option) => (
											<MenuItem key={option.value} value={option.value}>
												{option.label}
											</MenuItem>
										))}
									</TextField>
								</Grid>
								<Grid xs={12} sm={4}>
									<TextField
										label="Zona horaria"
										name="timezone"
										value={form.timezone}
										onChange={handleChange}
										required
										fullWidth
									/>
								</Grid>
								<Grid xs={12}>
									<TextField
										label="Proveedor bancario principal"
										name="provider"
										value={form.provider}
										onChange={handleChange}
										fullWidth
									/>
								</Grid>
								<Grid xs={12}>
									<Stack direction="row" spacing={2}>
										<Button disabled={status === "loading"} type="submit" variant="contained">
											{status === "loading" ? "Guardando..." : "Guardar"}
										</Button>
										<Button
											type="button"
											onClick={() =>
												setForm({
													code: "",
													name: "",
													currency: "",
													locale: "es-CO",
													timezone: "America/Bogota",
													provider: "",
												})
											}
										>
											Limpiar
										</Button>
									</Stack>
								</Grid>
								<Grid xs={12}>
									{message && (
										<Alert severity={status === "error" ? "error" : "success"}>{message}</Alert>
									)}
								</Grid>
							</Grid>
						</form>
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
}
