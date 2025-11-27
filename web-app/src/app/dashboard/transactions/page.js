"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { dayjs } from "@/lib/dayjs";
import { apiEndpoints, apiFetch } from "@/lib/api-client";
import { useCountry } from "@/components/country/country-context";
import { CountryBadge } from "@/components/country/country-badge";
import { useWorkspace } from "@/components/workspace/workspace-context";
import { useUser } from "@/components/auth/user-context";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { getPeriodRange } from "@/components/dashboard/budget/budget-overview";
import { paths } from "@/paths";

function formatCurrency(value, locale = "es-CO", currency = "COP") {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
	}).format(Number.isFinite(value) ? value : 0);
}

function formatDateTime(iso, locale = "es-CO") {
	if (!iso) {
		return "—";
	}
	return new Intl.DateTimeFormat(locale, {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));
}

export default function Page() {
	const canView = useRoleGuard(["client", "cs_agent"]);
	if (!canView) {
		return null;
	}
	return <TransactionsList />;
}

function TransactionsList() {
	const searchParams = useSearchParams();
	const initialPeriod = searchParams.get("period") ?? dayjs().format("YYYY-MM");
	const [period, setPeriod] = React.useState(initialPeriod);
	const { scope: workspaceScope, setScope: setWorkspaceScope, hasHousehold } = useWorkspace();
	const [scope, setScope] = React.useState(workspaceScope);
	const { country } = useCountry();
	const locale = country.locale ?? "es-CO";
	const currency = country.currency ?? "COP";
	const user = useUser();
	const householdMembership = user?.householdMemberships?.[0];
	const householdId = householdMembership?.householdId ?? null;
	const [state, setState] = React.useState({ data: [], loading: false, error: null });

	React.useEffect(() => {
		setScope(workspaceScope);
	}, [workspaceScope]);

	const loadTransactions = React.useCallback(async () => {
		if (scope === "household" && !householdId) {
			setState({ data: [], loading: false, error: "No tienes un hogar asignado para este ámbito." });
			return;
		}
		setState((prev) => ({ ...prev, loading: true, error: null }));
		try {
			const params = new URLSearchParams({ scope });
			if (scope === "household" && householdId) {
				params.set("householdId", householdId);
			}
			const response = await apiFetch(`${apiEndpoints.transactions}?${params.toString()}`);
			setState({ data: response.data ?? [], loading: false, error: null });
		} catch (error_) {
			setState({ data: [], loading: false, error: error_.message });
		}
	}, [scope, householdId]);

	React.useEffect(() => {
		void loadTransactions();
	}, [loadTransactions]);

	const filteredTransactions = React.useMemo(() => {
		const { start, end } = getPeriodRange(period);
		return (state.data ?? [])
			.filter((transaction) => {
				const date = new Date(transaction.date);
				return (!start || date >= start) && (!end || date <= end);
			})
			.sort((a, b) => new Date(b.date) - new Date(a.date));
	}, [state.data, period]);

	const totalAmount = filteredTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
	const resumeHref = `${paths.dashboard.overview}?period=${period}`;
	const periodLabel = React.useMemo(() => {
		const { start } = getPeriodRange(period);
		return start ? start.toLocaleDateString(locale, { month: "long", year: "numeric" }) : period;
	}, [period, locale]);

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
				<Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
					<Box sx={{ flex: "1 1 auto" }}>
						<Typography variant="h4">Transacciones del mes</Typography>
						<Typography color="text.secondary" variant="body2">
							Filtra por periodo y ámbito para revisar todos los movimientos registrados en BudgetApp.
						</Typography>
					</Box>
					<CountryBadge showProvider size="small" />
					<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
						<Button component={Link} href={resumeHref} variant="outlined">
							Volver al resumen
						</Button>
						<Button component={Link} href={paths.dashboard.transactions.create} variant="contained">
							Registrar transacción
						</Button>
					</Stack>
				</Stack>

				<Card>
					<CardContent>
						<Stack direction={{ xs: "column", md: "row" }} spacing={2}>
							<TextField
								label="Periodo"
								type="month"
								value={period}
								onChange={(event) => setPeriod(event.target.value)}
								InputLabelProps={{ shrink: true }}
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
									hasHousehold
										? "Alterna entre tus finanzas personales o familiares."
										: "Aún no tienes un hogar vinculado."
								}
							>
								<MenuItem value="personal">Personal</MenuItem>
								<MenuItem value="household" disabled={!hasHousehold}>
									Familiar
								</MenuItem>
							</TextField>
							<Button onClick={loadTransactions} disabled={state.loading} variant="outlined">
								{state.loading ? "Actualizando..." : "Actualizar lista"}
							</Button>
						</Stack>
						{state.error && (
							<Alert severity="error" sx={{ mt: 2 }}>
								{state.error}
							</Alert>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardContent>
						<Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
							<Box>
								<Typography variant="h5" sx={{ textTransform: "capitalize" }}>
									{periodLabel}
								</Typography>
								<Typography color="text.secondary" variant="body2">
									Mostrando {filteredTransactions.length} transacciones · Total:{" "}
									{formatCurrency(totalAmount, locale, currency)}
								</Typography>
							</Box>
							<Typography color="text.secondary" variant="body2">
								Los datos provienen de {scope === "household" ? "tu hogar" : "tu cuenta personal"} en{" "}
								{country.name}.
							</Typography>
						</Stack>
						{state.loading ? (
							<Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
								<CircularProgress />
							</Box>
						) : filteredTransactions.length === 0 ? (
							<Alert severity="info" sx={{ mt: 3 }}>
								No hay transacciones registradas para este periodo.
							</Alert>
						) : (
							<TableContainer component={Paper} sx={{ mt: 3, boxShadow: "none" }}>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>Fecha</TableCell>
											<TableCell>Categoría</TableCell>
											<TableCell>Método</TableCell>
											<TableCell>Fuente</TableCell>
											<TableCell>Estado</TableCell>
											<TableCell align="right">Monto</TableCell>
											<TableCell>Notas</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{filteredTransactions.map((transaction) => (
											<TableRow key={transaction.id}>
												<TableCell>{formatDateTime(transaction.date, locale)}</TableCell>
												<TableCell>{transaction.categoryId || "Sin categoría"}</TableCell>
												<TableCell sx={{ textTransform: "capitalize" }}>{transaction.method ?? "—"}</TableCell>
												<TableCell sx={{ textTransform: "capitalize" }}>{transaction.source ?? "—"}</TableCell>
												<TableCell sx={{ textTransform: "capitalize" }}>{transaction.status ?? "—"}</TableCell>
												<TableCell align="right">
													{formatCurrency(transaction.amount, locale, currency)}
												</TableCell>
												<TableCell>{transaction.notes || "—"}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						)}
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
}
