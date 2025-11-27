"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { dayjs } from "@/lib/dayjs";
import { apiEndpoints, apiFetch } from "@/lib/api-client";
import { paths } from "@/paths";
import { useUser } from "@/components/auth/user-context";
import { LogoutButton } from "@/components/auth/logout-button";
import { useCountry } from "@/components/country/country-context";
import { CountryBadge } from "@/components/country/country-badge";
import { AdminOverview } from "@/components/dashboard/admin/admin-overview";
import { BudgetOverview, getPeriodRange, isPeriodEditable } from "@/components/dashboard/budget/budget-overview";

export default function Page() {
	const user = useUser();

	if (!user) {
		return null;
	}

	if (user.role === "admin") {
		return <AdminOverview />;
	}

	return <ClientDashboard />;
}

function ClientDashboard() {
	const searchParams = useSearchParams();
	const initialPeriod = searchParams.get("period") ?? dayjs().format("YYYY-MM");
	const [period, setPeriod] = React.useState(initialPeriod);
	const [budgetState, setBudgetState] = React.useState({ data: null, loading: false, error: null });
	const [txState, setTxState] = React.useState({ data: null, loading: false, error: null });
	const { country, setCountry, options } = useCountry();
	const user = useUser();
	const [savingBudget, setSavingBudget] = React.useState(false);
	const [saveError, setSaveError] = React.useState(null);

	const loadBudgets = React.useCallback(async () => {
		setBudgetState((prev) => ({ ...prev, loading: true, error: null }));
		try {
			const params = new URLSearchParams({
				period,
				country: country.code,
			});
			const data = await apiFetch(`${apiEndpoints.budgets}?${params.toString()}`);
			setBudgetState({ data, loading: false, error: null });
		} catch (error_) {
			setBudgetState((prev) => ({ ...prev, loading: false, error: error_.message }));
		}
	}, [country.code, period]);

	const loadTransactions = React.useCallback(async () => {
		setTxState((prev) => ({ ...prev, loading: true, error: null }));
		try {
			const data = await apiFetch(apiEndpoints.transactions);
			setTxState({ data, loading: false, error: null });
		} catch (error_) {
			setTxState((prev) => ({ ...prev, loading: false, error: error_.message }));
		}
	}, []);

	React.useEffect(() => {
		void loadBudgets();
	}, [loadBudgets]);

	React.useEffect(() => {
		void loadTransactions();
	}, [loadTransactions]);

	const currency = country.currency ?? budgetState.data?.currency ?? "COP";
	const locale = country.locale ?? "es-CO";
	const filteredTransactions = React.useMemo(() => {
		const { start, end } = getPeriodRange(period);
		return (txState.data?.data ?? [])
			.filter((transaction) => {
				const date = new Date(transaction.date);
				return (!start || date >= start) && (!end || date <= end);
			})
			.sort((a, b) => new Date(b.date) - new Date(a.date));
	}, [txState.data?.data, period]);

	const transactionsLink = `${paths.dashboard.transactions.list}?period=${period}`;
	const canEdit = user?.startHereConfigured && isPeriodEditable(period);
	const editHref = canEdit ? `${paths.dashboard.budgets}?period=${period}` : null;

	const handleSaveBudgets = React.useCallback(
		async (categories) => {
			if (!budgetState.data) {
				return;
			}
			setSaveError(null);
			setSavingBudget(true);
			try {
				const payload = {
					period,
					country: country.code,
					currency: budgetState.data?.currency ?? currency,
					startBalance: budgetState.data?.startBalance ?? 0,
					startWithMoney: budgetState.data?.startWithMoney ?? false,
					scope: "personal",
					categories: categories.map((category) => ({
						categoryId: category.id,
						asignado: category.subcategories.reduce((sum, item) => sum + item.asignado, 0),
						subcategories: category.subcategories.map((subcategory) => ({
							id: subcategory.id,
							label: subcategory.label,
							asignado: subcategory.asignado,
							gastado: subcategory.gastado,
						})),
					})),
				};
				await apiFetch(apiEndpoints.budgets, {
					method: "POST",
					body: JSON.stringify(payload),
				});
				await loadBudgets();
			} catch (error_) {
				setSaveError(error_.message);
			} finally {
				setSavingBudget(false);
			}
		},
		[budgetState.data, period, country.code, currency, loadBudgets],
	);

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
				<Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					<Box>
						<Typography variant="h5">Hola, {user?.name ?? "Usuario"}</Typography>
						<Typography color="text.secondary" variant="body2">
							Rol: {user?.role ?? "user"} · Sesión iniciada con {user?.email}
						</Typography>
					</Box>
					<LogoutButton />
				</Stack>

				<Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
					<Box sx={{ flex: "1 1 auto" }}>
						<Typography variant="h4">Budget Dashboard</Typography>
						<Typography color="text.secondary" variant="body2">
							Selecciona el periodo y visualiza tu presupuesto mensual tal cual como en la hoja Budget (Overview, columnas y log).
						</Typography>
					</Box>
					<CountryBadge showProvider size="small" />
					<Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: "stretch" }}>
						<TextField
							label="País"
							select
							size="small"
							value={country.code}
							onChange={(event) => setCountry(event.target.value)}
						>
							{options.map((option) => (
								<MenuItem key={option.code} value={option.code}>
									{option.name}
								</MenuItem>
							))}
						</TextField>
						<Button component={Link} href={paths.dashboard.budgets} variant="outlined">
							Ir a Presupuestos
						</Button>
						<Button component={Link} href={paths.dashboard.transactions.create} variant="contained">
							Nuevo gasto
						</Button>
					</Stack>
				</Stack>

				<Card>
					<CardContent>
						<Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: "center" }}>
							<TextField
								label="Periodo presupuestal"
								type="month"
								value={period}
								onChange={(event) => setPeriod(event.target.value)}
								InputLabelProps={{ shrink: true }}
							/>
							<Button onClick={() => loadBudgets()} disabled={budgetState.loading} variant="outlined">
								Aplicar
							</Button>
						</Stack>
					</CardContent>
				</Card>

				{renderOverview({
					user,
					budgetState,
					period,
					locale,
					currency,
					filteredTransactions,
					transactionsState: txState,
					transactionsLink,
					editHref,
					isEditable: canEdit,
					onSaveBudgets: canEdit ? handleSaveBudgets : null,
					saving: savingBudget,
					saveError,
				})}
			</Stack>
		</Box>
	);
}

function renderOverview({
	user,
	budgetState,
	period,
	locale,
	currency,
	filteredTransactions,
	transactionsState,
	transactionsLink,
	editHref,
	isEditable,
	onSaveBudgets,
	saving,
	saveError,
}) {
	const hasStartHere = Boolean(user?.startHereConfigured);
	if (!hasStartHere) {
		return (
			<Alert severity="info">
				Completa la plantilla Start Here en <Link href={paths.dashboard.budgets}>/dashboard/budgets</Link> para desbloquear este
				resumen con KPIs y columnas.
			</Alert>
		);
	}
	if (budgetState.loading) {
		return (
			<Card>
				<CardContent>
					<CircularProgress />
				</CardContent>
			</Card>
		);
}
	if (budgetState.error) {
		return <Alert severity="error">{budgetState.error}</Alert>;
	}
	return (
		<BudgetOverview
			budget={budgetState.data}
			period={period}
			locale={locale}
			currency={currency}
			transactions={filteredTransactions}
			transactionsLoading={transactionsState.loading}
			transactionsError={transactionsState.error}
			transactionsLink={transactionsLink}
			editHref={editHref}
			isEditable={isEditable}
			onSaveBudgets={onSaveBudgets}
			saving={saving}
			saveError={saveError}
		/>
	);
}
