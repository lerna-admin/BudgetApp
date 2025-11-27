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

const defaultDebt = () => ({ name: "", balance: "", interestRate: "" });
const defaultGoal = () => ({ name: "", targetAmount: "", targetDate: "" });

export default function OnboardingPage() {
	const canView = useRoleGuard(["client"]);
	if (!canView) {
		return null;
	}
	return <OnboardingContent />;
}

function OnboardingContent() {
	const { country, setCountry, options } = useCountry();
	const [form, setForm] = React.useState({
		ingresosMensuales: "",
		gastosFijos: "",
		country: country.code,
	});
	const [debts, setDebts] = React.useState([defaultDebt()]);
	const [goals, setGoals] = React.useState([defaultGoal()]);
	const [status, setStatus] = React.useState("idle");
	const [error, setError] = React.useState(null);
	const [result, setResult] = React.useState(null);

	function handleInputChange(event) {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
		if (name === "country") {
			setCountry(value);
		}
	}

	React.useEffect(() => {
		setForm((prev) => ({ ...prev, country: country.code }));
	}, [country.code]);

	function updateArrayItem(type, index, field, value) {
		const setter = type === "debts" ? setDebts : setGoals;
		setter((prev) => {
			const clone = [...prev];
			clone[index] = { ...clone[index], [field]: value };
			return clone;
		});
	}

	function addItem(type) {
		if (type === "debts") {
			setDebts((prev) => [...prev, defaultDebt()]);
		} else {
			setGoals((prev) => [...prev, defaultGoal()]);
		}
	}

	function removeItem(type, index) {
		const setter = type === "debts" ? setDebts : setGoals;
		setter((prev) => {
			if (prev.length === 1) {
				return prev;
			}
			return prev.filter((_, i) => i !== index);
		});
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setStatus("loading");
		setError(null);
		setResult(null);

		try {
			const payload = {
				country: form.country,
				ingresosMensuales: Number(form.ingresosMensuales),
				gastosFijos: Number(form.gastosFijos),
			};

			const preparedDebts = debts
				.filter((debt) => debt.name || debt.balance || debt.interestRate)
				.map((debt) => ({
					name: debt.name,
					balance: debt.balance ? Number(debt.balance) : 0,
					interestRate: debt.interestRate ? Number(debt.interestRate) : undefined,
				}));

			if (preparedDebts.length > 0) {
				payload.deudas = preparedDebts;
			}

			const preparedGoals = goals
				.filter((goal) => goal.name || goal.targetAmount || goal.targetDate)
				.map((goal) => ({
					name: goal.name,
					targetAmount: goal.targetAmount ? Number(goal.targetAmount) : 0,
					targetDate: goal.targetDate || undefined,
				}));

			if (preparedGoals.length > 0) {
				payload.metas = preparedGoals;
			}

			const response = await apiFetch(apiEndpoints.onboarding, {
				method: "POST",
				body: JSON.stringify(payload),
			});

			setResult(response);
			setStatus("success");
		} catch (error_) {
			setStatus("error");
			setError(error_.message);
		}
	}

	function handleReset() {
			setForm({
				ingresosMensuales: "",
				gastosFijos: "",
				country: country.code,
			});
		setDebts([defaultDebt()]);
		setGoals([defaultGoal()]);
		setStatus("idle");
		setError(null);
		setResult(null);
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
						<Typography variant="h4">Onboarding financiero (API local)</Typography>
						<Typography color="text.secondary" variant="body2">
							Envía información inicial al endpoint {apiEndpoints.onboarding} usando {API_BASE_LABEL}.
						</Typography>
						<Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
							Selecciona el país objetivo para cargar la configuración correspondiente. Por ahora sólo está
							disponible {selectedCountry?.name ?? "Colombia"}.
						</Typography>
						<Box sx={{ mt: 1 }}>
							<CountryBadge showProvider size="small" />
						</Box>
					</Box>

				<Card>
					<CardContent>
						<form onSubmit={handleSubmit}>
							<Stack spacing={4}>
								<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
									<TextField
										label="País"
										name="country"
										select
										fullWidth
										value={form.country}
										onChange={handleInputChange}
									>
										{options.map((option) => (
											<MenuItem key={option.code} value={option.code}>
												{option.name}
											</MenuItem>
										))}
									</TextField>
									<TextField
										label="Ingresos mensuales"
										name="ingresosMensuales"
										type="number"
										required
										fullWidth
										value={form.ingresosMensuales}
										onChange={handleInputChange}
											helperText={`Moneda base: ${selectedCountry?.currency ?? "COP"}`}
									/>
									<TextField
										label="Gastos fijos mensuales"
										name="gastosFijos"
										type="number"
										required
										fullWidth
										value={form.gastosFijos}
										onChange={handleInputChange}
									/>
								</Stack>

								<Divider />

								<Stack spacing={2}>
									<Stack direction="row" justifyContent="space-between" alignItems="center">
										<Typography variant="h6">Deudas</Typography>
										<Button onClick={() => addItem("debts")} size="small" type="button" variant="outlined">
											Agregar deuda
										</Button>
									</Stack>
									{debts.map((debt, index) => (
										<Card key={`debt-${index}`} variant="outlined">
											<CardContent>
												<Stack spacing={2}>
													<TextField
														label="Nombre"
														value={debt.name}
														onChange={(event) =>
															updateArrayItem("debts", index, "name", event.target.value)
														}
													/>
													<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
														<TextField
															label="Saldo"
															type="number"
															fullWidth
															value={debt.balance}
															onChange={(event) =>
																updateArrayItem("debts", index, "balance", event.target.value)
															}
														/>
														<TextField
															label="Tasa (%)"
															type="number"
															fullWidth
															value={debt.interestRate}
															onChange={(event) =>
																updateArrayItem(
																	"debts",
																	index,
																	"interestRate",
																	event.target.value,
																)
															}
														/>
													</Stack>
													<Button
														color="error"
														disabled={debts.length === 1}
														onClick={() => removeItem("debts", index)}
														type="button"
													>
														Eliminar
													</Button>
												</Stack>
											</CardContent>
										</Card>
									))}
								</Stack>

								<Divider />

								<Stack spacing={2}>
									<Stack direction="row" justifyContent="space-between" alignItems="center">
										<Typography variant="h6">Metas</Typography>
										<Button onClick={() => addItem("goals")} size="small" type="button" variant="outlined">
											Agregar meta
										</Button>
									</Stack>
									{goals.map((goal, index) => (
										<Card key={`goal-${index}`} variant="outlined">
											<CardContent>
												<Stack spacing={2}>
													<TextField
														label="Nombre"
														value={goal.name}
														onChange={(event) =>
															updateArrayItem("goals", index, "name", event.target.value)
														}
													/>
													<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
														<TextField
															label="Monto objetivo"
															type="number"
															fullWidth
															value={goal.targetAmount}
															onChange={(event) =>
																updateArrayItem("goals", index, "targetAmount", event.target.value)
															}
														/>
														<TextField
															label="Fecha objetivo"
															type="date"
															fullWidth
															InputLabelProps={{ shrink: true }}
															value={goal.targetDate}
															onChange={(event) =>
																updateArrayItem("goals", index, "targetDate", event.target.value)
															}
														/>
													</Stack>
													<Button
														color="error"
														disabled={goals.length === 1}
														onClick={() => removeItem("goals", index)}
														type="button"
													>
														Eliminar
													</Button>
												</Stack>
											</CardContent>
										</Card>
									))}
								</Stack>

								<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
									<Button disabled={status === "loading"} type="submit" variant="contained">
										{status === "loading" ? "Enviando..." : "Calcular diagnóstico"}
									</Button>
									<Button disabled={status === "loading"} onClick={handleReset} type="button" variant="text">
										Limpiar todo
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
						<Typography variant="h6">Resultado del diagnóstico</Typography>
						{!result && (
							<Typography color="text.secondary" variant="body2">
								Envía el formulario para calcular tu puntaje y recomendaciones.
							</Typography>
						)}

								{result && (
									<Stack spacing={2} sx={{ mt: 2 }}>
										<Typography variant="h3">{result.scoreSalud ?? "--"} / 100</Typography>
										<Typography color="text.secondary" variant="body2">
											Score de salud financiera calculado por la API local. Úsalo para validar el flujo de onboarding.
										</Typography>
										<CountryBadge showProvider size="small" />
										<Divider />
										<Typography variant="subtitle1">Recomendaciones</Typography>
										{(result.recomendaciones ?? []).length === 0 && (
											<Typography color="text.secondary" variant="body2">
												La API no envió recomendaciones para este escenario.
											</Typography>
										)}
										{(result.recomendaciones ?? []).map((recommendation, index) => (
											<Typography key={`rec-${index}`} variant="body2">
												• {recommendation}
											</Typography>
										))}
									</Stack>
								)}
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
}
