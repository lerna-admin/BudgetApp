"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import Link from "next/link";

import { startHereTemplate } from "@/data/start-here-template";

const CATEGORY_META = new Map(
	startHereTemplate.groups.map((group) => [
		group.id,
		{
			label: group.label,
			type: group.type,
			accentColor: group.accentColor ?? "var(--mui-palette-background-level1)",
		},
	]),
);

function getCategoryMeta(categoryId) {
	return CATEGORY_META.get(categoryId) ?? {
		label: categoryId,
		type: "custom",
		accentColor: "var(--mui-palette-background-level1)",
	};
}

function formatCurrency(value, locale = "es-CO", currency = "COP") {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
	}).format(Number.isFinite(value) ? value : 0);
}

function getPeriodDetails(period, locale = "es-CO") {
	const { start, end } = getPeriodRange(period);
	if (!start || !end) {
		return { label: period || "—", start: null, end: null };
	}
	const label = start.toLocaleDateString(locale, { month: "long", year: "numeric" });
	return { label, start, end };
}

function formatShortDate(date, locale = "es-CO") {
	if (!date) return "—";
	return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatTransactionDate(iso, locale = "es-CO") {
	if (!iso) {
		return "—";
	}
	const date = new Date(iso);
	return new Intl.DateTimeFormat(locale, {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function cloneCategories(sourceCategories = []) {
	return sourceCategories.map((category) => {
		const meta = getCategoryMeta(category.categoryId);
		const subcategories = (category.subcategories ?? []).map((subcategory) => ({
			id: subcategory.id || `${category.categoryId}-${subcategory.label}`,
			label: subcategory.label || "Sin nombre",
			asignado: Number(subcategory.asignado) || 0,
			gastado: Number(subcategory.gastado) || 0,
		}));
		const assigned = category.asignado ?? subcategories.reduce((sum, item) => sum + item.asignado, 0);
		const spent = category.gastado ?? subcategories.reduce((sum, item) => sum + item.gastado, 0);
		return {
			id: category.categoryId,
			label: meta.label,
			type: meta.type,
			accentColor: meta.accentColor,
			asignado: assigned,
			gastado: spent,
			subcategories,
		};
	});
}

export function BudgetOverview({
	budget,
	period,
	locale,
	currency,
	transactions,
	transactionsLoading,
	transactionsError,
	transactionsLink,
	editHref,
	isEditable = false,
	onSaveBudgets,
	saving = false,
	saveError = null,
}) {
	const initialCategories = React.useMemo(() => cloneCategories(budget?.categories ?? []), [budget]);
	const [editableCategories, setEditableCategories] = React.useState(initialCategories);
	const categoryMap = React.useMemo(
		() => new Map(editableCategories.map((category) => [category.id, category])),
		[editableCategories],
	);

	React.useEffect(() => {
		setEditableCategories(initialCategories);
	}, [initialCategories]);

	if (!budget) {
		return (
			<Card>
				<CardContent>
					<Typography color="text.secondary" variant="body2">
						No hay información disponible para este periodo.
					</Typography>
				</CardContent>
			</Card>
		);
	}

	const totals = budget?.totals ?? { asignado: 0, gastado: 0 };
	const startBalance = Number(budget?.startBalance) || 0;
	const getCategory = (id) => {
		if (categoryMap.has(id)) {
			return categoryMap.get(id);
		}
		const meta = getCategoryMeta(id);
		return {
			id,
			label: meta.label,
			type: meta.type,
			accentColor: meta.accentColor,
			asignado: 0,
			gastado: 0,
			subcategories: [],
		};
	};

	const income = getCategory("income");
	const savings = getCategory("savings");
	const bills = getCategory("bills");
	const expenses = getCategory("expenses");
	const debt = getCategory("debt");
	const totalsAssigned = totals.asignado ?? editableCategories.reduce((sum, item) => sum + item.asignado, 0);
	const totalsActual = totals.gastado ?? editableCategories.reduce((sum, item) => sum + item.gastado, 0);
	const leftToBudget = Math.max(totalsAssigned - totalsActual, 0);
	const leftToSpend = Math.max(startBalance + totalsAssigned - totalsActual, 0);
	const spentPercent = totalsAssigned > 0 ? Math.min(100, (totalsActual / totalsAssigned) * 100) : 0;
	const periodDetails = getPeriodDetails(period, locale);

	const cashFlowRows = [
		{ label: "Rollover", budget: startBalance, actual: startBalance },
		{ label: "Income", budget: income.asignado, actual: income.gastado },
		{ label: "Savings", budget: savings.asignado, actual: savings.gastado },
		{
			label: "Bills & Expenses",
			budget: bills.asignado + expenses.asignado,
			actual: bills.gastado + expenses.gastado,
		},
		{ label: "Debt", budget: debt.asignado, actual: debt.gastado },
		{
			label: "Left",
			budget: startBalance + income.asignado - (savings.asignado + bills.asignado + expenses.asignado + debt.asignado),
			actual: startBalance + income.gastado - (savings.gastado + bills.gastado + expenses.gastado + debt.gastado),
			isTotal: true,
		},
	];

	const breakdownSegments = editableCategories.filter((category) => category.id !== "income" && category.asignado > 0);
	const breakdownTotal = breakdownSegments.reduce((sum, category) => sum + category.asignado, 0);
	let breakdownCursor = 0;
	const breakdownGradientStops =
		breakdownSegments.length > 0
			? breakdownSegments
					.map((category) => {
						const start = (breakdownCursor / breakdownTotal) * 100;
						breakdownCursor += category.asignado;
						const end = (breakdownCursor / breakdownTotal) * 100;
						return `${category.accentColor} ${start}% ${end}%`;
					})
					.join(", ")
			: "#e0e0e0 0 100%";

	const breakdownLegend = breakdownSegments.map((category) => {
		const percent = breakdownTotal > 0 ? Math.round((category.asignado / breakdownTotal) * 100) : 0;
		return { label: category.label, percent, color: category.accentColor };
	});

	const handleBudgetChange = (categoryId, subcategoryId, value) => {
		if (!isEditable) {
			return;
		}
		setEditableCategories((prev) =>
			prev.map((category) => {
				if (category.id !== categoryId) {
					return category;
				}
				const subcategories = category.subcategories.map((subcategory) => {
					if (subcategory.id !== subcategoryId) {
						return subcategory;
					}
					return { ...subcategory, asignado: Number(value) || 0 };
				});
				const asignado = subcategories.reduce((sum, item) => sum + item.asignado, 0);
				return { ...category, subcategories, asignado };
			}),
		);
	};

	const incomeRows = income.subcategories.map((sub) => ({
		categoryId: income.id,
		id: sub.id,
		label: sub.label,
		budget: sub.asignado,
		actual: sub.gastado,
	}));
	const savingsRows = savings.subcategories.map((sub) => ({
		categoryId: savings.id,
		id: sub.id,
		label: sub.label,
		budget: sub.asignado,
		actual: sub.gastado,
	}));
	const billsRows = bills.subcategories.map((sub) => ({
		categoryId: bills.id,
		id: sub.id,
		label: sub.label,
		budget: sub.asignado,
		actual: sub.gastado,
	}));
	const expensesRows = expenses.subcategories.map((sub) => ({
		categoryId: expenses.id,
		id: sub.id,
		label: sub.label,
		budget: sub.asignado,
		actual: sub.gastado,
	}));
	const debtRows = debt.subcategories.map((sub) => ({
		categoryId: debt.id,
		id: sub.id,
		label: sub.label,
		budget: sub.asignado,
		actual: sub.gastado,
	}));

	const topTransactions = transactions.slice(0, 6);

	const layoutGrid = {
		width: "100%",
		maxWidth: 1280,
		mx: "auto",
		px: { xs: 2, md: 0 },
		display: "grid",
		gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
		gap: 3,
		py: 3,
	};
	const topCardShadow = "0 20px 35px rgba(15, 23, 42, 0.08)";

	return (
		<Box sx={{ width: "100%" }}>
			<Box sx={layoutGrid}>
				<Box sx={{ gridColumn: "span 12" }}>
					<Card
						sx={{
							borderRadius: 3,
							boxShadow: topCardShadow,
							padding: 3,
							height: "100%",
						}}
					>
						<CardContent sx={{ padding: 0 }}>
							<Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ alignItems: "center", justifyContent: "space-between" }}>
								<Box>
									<Typography color="text.secondary" variant="overline">
										Budget Dashboard
									</Typography>
									<Typography sx={{ textTransform: "capitalize" }} variant="h4">
										{periodDetails.label}
									</Typography>
								</Box>
								<Stack direction="row" spacing={3} sx={{ alignItems: "center", flexWrap: "wrap" }}>
									<Box>
										<Typography color="text.secondary" variant="body2">
											Start date
										</Typography>
										<Typography variant="h6">{formatShortDate(periodDetails.start, locale)}</Typography>
									</Box>
									<Box>
										<Typography color="text.secondary" variant="body2">
											End date
										</Typography>
										<Typography variant="h6">{formatShortDate(periodDetails.end, locale)}</Typography>
									</Box>
									<Box>
										<Typography color="text.secondary" variant="body2">
											Left to spend
										</Typography>
										<Typography variant="h6">{formatCurrency(leftToSpend, locale, currency)}</Typography>
									</Box>
									{editHref && (
										<Button component={Link} href={editHref} variant="contained" size="small">
											Editar presupuesto
										</Button>
									)}
								</Stack>
							</Stack>
						</CardContent>
					</Card>
				</Box>

				<Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
					<Card
						sx={{
							borderRadius: 3,
							boxShadow: topCardShadow,
							padding: 2,
							height: "100%",
						}}
					>
						<Typography color="text.secondary" variant="overline">
							Left to Budget
						</Typography>
						<Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
							<Box sx={{ position: "relative", display: "inline-flex" }}>
								<CircularProgress size={140} thickness={4} value={100} variant="determinate" sx={{ color: "action.hover" }} />
								<CircularProgress
									size={140}
									thickness={4}
									value={Math.min(100, 100 - spentPercent)}
									variant="determinate"
									sx={{ color: "primary.main", position: "absolute", left: 0 }}
								/>
								<Box
									sx={{
										top: 0,
										left: 0,
										bottom: 0,
										right: 0,
										position: "absolute",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flexDirection: "column",
									}}
								>
									<Typography variant="h6">{formatCurrency(leftToBudget, locale, currency)}</Typography>
									<Typography color="text.secondary" variant="caption">
										{spentPercent.toFixed(0)}% gastado
									</Typography>
								</Box>
							</Box>
						</Box>
					</Card>
				</Box>

				<Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
					<Card
						sx={{
							borderRadius: 3,
							boxShadow: topCardShadow,
							height: "100%",
						}}
					>
						<CardContent>
							<Typography color="text.secondary" variant="overline">
								Budget vs Actual
							</Typography>
							<Stack spacing={2} sx={{ mt: 2 }}>
								{editableCategories.map((category) => {
									const percent =
										category.asignado > 0
											? Math.min(100, (category.gastado / category.asignado) * 100)
											: 0;
									return (
										<Box key={category.id}>
											<Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
												<Typography sx={{ fontWeight: 600 }}>{category.label}</Typography>
												<Typography color="text.secondary" variant="body2">
													{formatCurrency(category.gastado, locale, currency)} /{" "}
													{formatCurrency(category.asignado, locale, currency)}
												</Typography>
											</Stack>
											<LinearProgress
												color="primary"
												sx={{ mt: 1, height: 8, borderRadius: 4 }}
												variant="determinate"
												value={percent}
											/>
										</Box>
									);
								})}
							</Stack>
						</CardContent>
					</Card>
				</Box>

				<Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
					<Card
						sx={{
							borderRadius: 3,
							boxShadow: topCardShadow,
							padding: 2,
							height: "100%",
						}}
					>
						<Typography color="text.secondary" variant="overline">
							Breakdown
						</Typography>
						<Stack direction="row" spacing={3} sx={{ mt: 2, alignItems: "center" }}>
							<Box
								sx={{
									width: 140,
									height: 140,
									borderRadius: "50%",
									background: `conic-gradient(${breakdownGradientStops})`,
									position: "relative",
								}}
							>
								<Box
									sx={{
										position: "absolute",
										top: "50%",
										left: "50%",
										transform: "translate(-50%, -50%)",
										width: 80,
										height: 80,
										borderRadius: "50%",
										bgcolor: "background.default",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Typography variant="h6">
										{breakdownTotal > 0 ? `${(100 - spentPercent).toFixed(0)}%` : "0%"}
									</Typography>
								</Box>
							</Box>
							<Stack spacing={1}>
								{breakdownLegend.map((item) => (
									<Stack key={item.label} direction="row" spacing={1} alignItems="center">
										<Box
											sx={{
												width: 12,
												height: 12,
												borderRadius: "50%",
												backgroundColor: item.color,
											}}
										/>
										<Typography variant="body2">
											{item.label} · {item.percent}%
										</Typography>
									</Stack>
								))}
							</Stack>
						</Stack>
					</Card>
				</Box>

				<Box sx={{ gridColumn: { xs: "span 12", md: "span 8" } }}>
					<BudgetColumn accentColor="#d3e3fd" title="Cash Flow" rows={cashFlowRows} locale={locale} currency={currency} showTotal />
				</Box>

				<Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
					<BudgetColumn
						accentColor={income.accentColor}
						title="Income"
						rows={incomeRows}
						locale={locale}
						currency={currency}
						isEditable={isEditable}
						onBudgetChange={handleBudgetChange}
					/>
				</Box>

				<Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
					<BudgetColumn
						accentColor={savings.accentColor}
						title="Savings"
						rows={savingsRows}
						locale={locale}
						currency={currency}
						isEditable={isEditable}
						onBudgetChange={handleBudgetChange}
					/>
				</Box>

				<Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
					<BudgetColumn
						accentColor={bills.accentColor}
						title="Bills"
						rows={billsRows}
						locale={locale}
						currency={currency}
						isEditable={isEditable}
						onBudgetChange={handleBudgetChange}
					/>
				</Box>

				<Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
					<BudgetColumn
						accentColor={expenses.accentColor}
						title="Expenses"
						rows={expensesRows}
						locale={locale}
						currency={currency}
						isEditable={isEditable}
						onBudgetChange={handleBudgetChange}
					/>
				</Box>

				<Box sx={{ gridColumn: "span 12" }}>
					<BudgetColumn
						accentColor={debt.accentColor}
						title="Debt"
						rows={debtRows}
						locale={locale}
						currency={currency}
						isEditable={isEditable}
						onBudgetChange={handleBudgetChange}
					/>
				</Box>

				<Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
					<TransactionsLog
						transactions={topTransactions}
						loading={transactionsLoading}
						error={transactionsError}
						locale={locale}
						currency={currency}
						link={transactionsLink}
					/>
				</Box>

				<Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
					<SpendingBreakdownTable legend={breakdownLegend} />
				</Box>
			</Box>

			{isEditable && onSaveBudgets ? (
				<Box
					sx={{
						width: "100%",
						maxWidth: 1280,
						mx: "auto",
						px: { xs: 2, md: 0 },
						display: "flex",
						justifyContent: "flex-end",
					}}
				>
					<Button onClick={() => onSaveBudgets(editableCategories)} disabled={saving}>
						{saving ? "Guardando..." : "Actualizar montos"}
					</Button>
				</Box>
			) : null}

			{saveError && (
				<Box sx={{ width: "100%", maxWidth: 1280, mx: "auto", px: { xs: 2, md: 0 } }}>
					<Alert severity="error">{saveError}</Alert>
				</Box>
			)}
		</Box>
	);
}

export function getPeriodRange(period) {
	const [year, month] = (period ?? "").split("-").map(Number);
	if (!year || !month) {
		return { start: null, end: null };
	}
	const start = new Date(Date.UTC(year, month - 1, 1));
	const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
	return { start, end };
}

export function isPeriodEditable(period, referenceDate = new Date()) {
	const [targetYear, targetMonth] = (period ?? "").split("-").map(Number);
	if (!targetYear || !targetMonth) {
		return false;
	}
	const year = referenceDate.getUTCFullYear();
	const month = referenceDate.getUTCMonth() + 1;
	if (targetYear > year) {
		return true;
	}
	if (targetYear < year) {
		return false;
	}
	return targetMonth >= month;
}

function BudgetColumn({ title, rows, locale, currency, accentColor, showTotal = false, isEditable = false, onBudgetChange }) {
	const totals = rows.reduce(
		(acc, row) => {
			acc.budget += row.budget || 0;
			acc.actual += row.actual || 0;
			return acc;
		},
		{ budget: 0, actual: 0 },
	);
	const displayRows = showTotal
		? [
				...rows,
				{ id: `${title}-total`, label: "TOTAL", budget: totals.budget, actual: totals.actual, isTotal: true },
		  ]
		: rows;

	const hasCustomColor = typeof accentColor === "string" && accentColor.startsWith("#");
	const fallbackBase = "#e4e8ff";
	const baseColor = hasCustomColor ? accentColor : fallbackBase;
	const surfaceColor = alpha(baseColor, 0.45);
	const headerColor = alpha(baseColor, 0.75);
	const borderColor = alpha(baseColor, 0.65);
	const dividerColor = alpha("#101828", 0.08);

	return (
		<Card
			sx={{
				height: "100%",
				backgroundColor: hasCustomColor ? surfaceColor : accentColor ?? "var(--mui-palette-background-paper)",
				borderRadius: 3,
				boxShadow: { xs: "0 10px 30px rgba(15,23,42,0.08)", md: "0 25px 55px rgba(15,23,42,0.08)" },
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					backgroundColor: hasCustomColor ? headerColor : "rgba(255,255,255,0.5)",
					px: 3,
					py: 2,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Typography sx={{ fontWeight: 700 }} variant="subtitle1">
					{title}
				</Typography>
				{showTotal && (
					<Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
						{formatCurrency(totals.budget, locale, currency)}
					</Typography>
				)}
			</Box>
			<Table
				size="small"
				sx={{
					"& th": {
						color: "text.secondary",
						fontSize: 12,
						fontWeight: 600,
						textTransform: "uppercase",
						borderBottom: "1px solid",
						borderBottomColor: borderColor,
					},
					"& td": {
						borderBottom: "1px solid",
						borderBottomColor: dividerColor,
					},
				}}
			>
				<TableHead>
					<TableRow>
						<TableCell />
						<TableCell align="right">Budget</TableCell>
						<TableCell align="right">Actual</TableCell>
						<TableCell align="right">Left</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{displayRows.length === 0 && (
						<TableRow>
							<TableCell colSpan={4}>
								<Typography color="text.secondary" variant="body2">
									Sin datos
								</Typography>
							</TableCell>
						</TableRow>
					)}
					{displayRows.map((row) => (
						<TableRow
							key={row.id}
							sx={{
								"&:last-of-type td": { borderBottom: "none" },
								"& td": { fontWeight: row.isTotal ? 700 : 500 },
							}}
						>
							<TableCell sx={{ fontWeight: row.isTotal ? 800 : 600 }}>{row.label}</TableCell>
							<TableCell align="right">
								{isEditable && !row.isTotal ? (
									<TextField
										type="number"
										size="small"
										variant="filled"
										value={row.budget}
										onChange={(event) => onBudgetChange?.(row.categoryId, row.id, event.target.value)}
										inputProps={{ min: 0 }}
										InputProps={{
											disableUnderline: true,
											sx: {
												backgroundColor: "rgba(255,255,255,0.85)",
												borderRadius: 1,
												fontWeight: 600,
												"& input": {
													textAlign: "right",
													py: 0.5,
												},
											},
										}}
									/>
								) : (
									formatCurrency(row.budget, locale, currency)
								)}
							</TableCell>
							<TableCell align="right">{formatCurrency(row.actual, locale, currency)}</TableCell>
							<TableCell align="right">
								{formatCurrency((row.budget || 0) - (row.actual || 0), locale, currency)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Card>
	);
}

function TransactionsLog({ transactions, loading, error, locale, currency, link }) {
	return (
		<Card sx={{ height: "100%" }}>
			<CardHeader
				title="Log"
				action={
					link ? (
						<Button component={Link} href={link} size="small">
							Ver todas
						</Button>
					) : null
				}
			/>
			<TableContainer component={Paper} sx={{ boxShadow: "none" }}>
				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
						<CircularProgress size={32} />
					</Box>
				) : error ? (
					<Box sx={{ p: 2 }}>
						<Alert severity="error">{error}</Alert>
					</Box>
				) : transactions.length === 0 ? (
					<Box sx={{ p: 2 }}>
						<Typography color="text.secondary" variant="body2">
							No hay transacciones para este mes.
						</Typography>
					</Box>
				) : (
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Fecha</TableCell>
								<TableCell>Categoría</TableCell>
								<TableCell align="right">Monto</TableCell>
								<TableCell>Notas</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{transactions.map((transaction) => (
								<TableRow key={transaction.id}>
									<TableCell>{formatTransactionDate(transaction.date, locale)}</TableCell>
									<TableCell>{transaction.categoryId || "Sin categoría"}</TableCell>
									<TableCell align="right">
										{formatCurrency(transaction.amount, locale, currency)}
									</TableCell>
									<TableCell>{transaction.notes || "—"}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</TableContainer>
		</Card>
	);
}

function SpendingBreakdownTable({ legend }) {
	return (
		<Card sx={{ height: "100%" }}>
			<CardHeader title="Spending Breakdown" />
			<CardContent>
				{legend.length === 0 ? (
					<Typography color="text.secondary" variant="body2">
						Sin datos suficientes para calcular el desglose.
					</Typography>
				) : (
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Categoría</TableCell>
								<TableCell align="right">% del presupuesto</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{legend.map((item) => (
								<TableRow key={item.label}>
									<TableCell>
										<Stack direction="row" spacing={1} alignItems="center">
											<Box
												sx={{
													width: 12,
													height: 12,
													borderRadius: "50%",
													backgroundColor: item.color,
												}}
											/>
											{item.label}
										</Stack>
									</TableCell>
									<TableCell align="right">{item.percent}%</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
