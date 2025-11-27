"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import SvgIcon from "@mui/material/SvgIcon";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";

import { hydrateStartHereTemplate } from "@/data/start-here-template";
import { dayjs } from "@/lib/dayjs";
import { apiEndpoints, apiFetch } from "@/lib/api-client";
import { useCountry } from "@/components/country/country-context";
import { CountryBadge } from "@/components/country/country-badge";
import { useUser } from "@/components/auth/user-context";
import { useWorkspace } from "@/components/workspace/workspace-context";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { isPeriodEditable } from "@/components/dashboard/budget/budget-overview";

function generateSubcategoryId(prefix = "subcategory") {
	return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatNumberToInput(value, fallback = "") {
	if (value === null || value === undefined) {
		return fallback;
	}
	const numeric = Number(value);
	if (Number.isNaN(numeric)) {
		return fallback;
	}
	return String(numeric);
}

function cloneGroup(group) {
	return {
		id: group.id,
		label: group.label,
		type: group.type,
		description: group.description,
		accentColor: group.accentColor || "#f1f1f1",
		subcategories: group.subcategories.map((subcategory) => ({
			id: subcategory.id || generateSubcategoryId(group.id),
			label: subcategory.label || "",
		})),
	};
}

function formatCurrency(value, locale = "es-CO", currency = "COP") {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
	}).format(Number.isFinite(value) ? value : 0);
}

function normalizeTemplateToBuilder(template) {
	return {
		currency: template.currency,
		startBalance: formatNumberToInput(template.startBalance, "0"),
		startWithMoney: Boolean(template.startWithMoney),
		groups: template.groups.map((group) => cloneGroup(group)),
	};
}

function createBuilderTemplate(country, overrides = {}) {
	const template = hydrateStartHereTemplate({
		currency: overrides.currency || country?.currency,
		startWithMoney: overrides.startWithMoney,
		startBalance: overrides.startBalance,
	});
	return normalizeTemplateToBuilder(template);
}

function createBuilderFromBudget(budget, country) {
	if (!budget) {
		return createBuilderTemplate(country);
	}
	const template = hydrateStartHereTemplate({
		currency: budget.currency || country?.currency,
		startWithMoney: budget.startWithMoney,
		startBalance: budget.startBalance,
	});
	const groupMap = new Map(
		template.groups.map((group) => [group.id, cloneGroup(group)]),
	);
	const groups = [];
	for (const category of budget.categories || []) {
		const baseGroup =
			groupMap.get(category.categoryId) ??
			{
				id: category.categoryId,
				label: category.categoryId,
				type: "custom",
				description: "",
				subcategories: [],
			};
		const subcategoriesSource =
			Array.isArray(category.subcategories) && category.subcategories.length > 0
				? category.subcategories
				: [
						{
							id: generateSubcategoryId(category.categoryId),
							label: baseGroup.label,
						},
				  ];
		const subcategories = subcategoriesSource.map((subcategory) => ({
			id: subcategory.id || generateSubcategoryId(category.categoryId),
			label: subcategory.label || subcategory.name || baseGroup.label,
		}));
		groups.push({
			...baseGroup,
			subcategories,
		});
		groupMap.delete(category.categoryId);
	}
	for (const group of groupMap.values()) {
		groups.push({
			...group,
			subcategories: group.subcategories.map((subcategory) => ({
				...subcategory,
				label: subcategory.label || "",
			})),
		});
	}
	return {
		currency: budget.currency || template.currency || country?.currency,
		startBalance: formatNumberToInput(budget.startBalance, "0"),
		startWithMoney: Boolean(budget.startWithMoney),
		groups,
	};
}

function builderToCategories(builder) {
	return builder.groups
		.map((group) => {
			const subcategories = group.subcategories
				.filter((subcategory) => subcategory.label?.trim())
				.map((subcategory) => ({
					id: subcategory.id || generateSubcategoryId(group.id),
					label: subcategory.label?.trim() || "Sin nombre",
					asignado: 0,
					startWithMoney: Boolean(builder.startWithMoney),
				}));
			return {
				categoryId: group.id,
				asignado: 0,
				subcategories,
			};
		})
		.filter((category) => category.subcategories.length > 0);
}

export default function Page() {
	const canView = useRoleGuard(["client", "cs_agent"]);
	if (!canView) {
		return null;
	}
	return <BudgetsContent />;
}

function BudgetsContent() {
	const user = useUser();
	const { scope: workspaceScope, setScope: setWorkspaceScope, hasHousehold } = useWorkspace();
	const { country } = useCountry();
	const [period, setPeriod] = React.useState(dayjs().format("YYYY-MM"));
	const [scope, setScope] = React.useState(workspaceScope);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState(null);
	const [builderFeedback, setBuilderFeedback] = React.useState(null);
	const [builderSaving, setBuilderSaving] = React.useState(false);
	const [builder, setBuilder] = React.useState(() => createBuilderTemplate(country));
	const [history, setHistory] = React.useState([]);
	const [historyLoading, setHistoryLoading] = React.useState(false);
	const [historyError, setHistoryError] = React.useState(null);
	const builderCurrency = builder.currency || country.currency || "COP";
	const householdMembership = user?.householdMemberships?.[0];
	const householdId = householdMembership?.householdId ?? null;
	const effectiveScope = scope === "household" && householdId ? "household" : "personal";

	React.useEffect(() => {
		setScope(workspaceScope);
	}, [workspaceScope]);

	const canEditSelectedPeriod = isPeriodEditable(period);

	const loadBudget = React.useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({
				period,
				country: country.code,
				scope: effectiveScope,
			});
			if (effectiveScope === "household" && householdId) {
				params.set("householdId", householdId);
			}
			const response = await apiFetch(`${apiEndpoints.budgets}?${params.toString()}`);
			setBuilder(createBuilderFromBudget(response, country));
		} catch (error_) {
			setError(error_.message);
			setBuilder(createBuilderTemplate(country));
		} finally {
			setLoading(false);
		}
	}, [period, country, effectiveScope, householdId]);

	const loadHistory = React.useCallback(async () => {
		setHistoryLoading(true);
		setHistoryError(null);
		try {
			const params = new URLSearchParams({
				scope: effectiveScope,
			});
			const response = await apiFetch(`${apiEndpoints.budgetsHistory}?${params.toString()}`);
			setHistory(response.data ?? []);
		} catch (error_) {
			setHistoryError(error_.message);
			setHistory([]);
		} finally {
			setHistoryLoading(false);
		}
	}, [effectiveScope]);

	React.useEffect(() => {
		void loadBudget();
	}, [loadBudget]);

	React.useEffect(() => {
		void loadHistory();
	}, [loadHistory]);

	function handleBuilderFieldChange(field, value) {
		setBuilder((prev) => ({
			...prev,
			[field]: field === "startWithMoney" ? Boolean(value) : value,
		}));
		setBuilderFeedback(null);
	}

	function handleSubcategoryChange(groupId, subcategoryId, value) {
		setBuilder((prev) => ({
			...prev,
			groups: prev.groups.map((group) => {
				if (group.id !== groupId) {
					return group;
				}
				return {
					...group,
					subcategories: group.subcategories.map((subcategory) => {
						if (subcategory.id !== subcategoryId) {
							return subcategory;
						}
						return { ...subcategory, label: value };
					}),
				};
			}),
		}));
		setBuilderFeedback(null);
	}

	function handleAddSubcategory(groupId) {
		setBuilder((prev) => ({
			...prev,
			groups: prev.groups.map((group) => {
				if (group.id !== groupId) {
					return group;
				}
				return {
					...group,
					subcategories: [
						...group.subcategories,
						{
							id: generateSubcategoryId(group.id),
							label: "",
						},
					],
				};
			}),
		}));
	}

	function handleRemoveSubcategory(groupId, subcategoryId) {
		setBuilder((prev) => ({
			...prev,
			groups: prev.groups.map((group) => {
				if (group.id !== groupId) {
					return group;
				}
				return {
					...group,
					subcategories: group.subcategories.filter((subcategory) => subcategory.id !== subcategoryId),
				};
			}),
		}));
	}

	function handleResetBuilder() {
		setBuilder(createBuilderTemplate(country));
		setBuilderFeedback(null);
	}

	async function handleBuilderSubmit(event) {
		event.preventDefault();
		if (!canEditSelectedPeriod) {
			setBuilderFeedback({
				severity: "warning",
				message: "Sólo puedes editar el mes actual o futuros.",
			});
			return;
		}
		setBuilderSaving(true);
		setBuilderFeedback(null);
		try {
			const categories = builderToCategories(builder);
			if (categories.length === 0) {
				throw new Error("Agrega al menos una subcategoría antes de guardar.");
			}
			const payload = {
				period,
				country: country.code,
				currency: builderCurrency,
				scope: effectiveScope,
				startBalance: Number(builder.startBalance) || 0,
				startWithMoney: Boolean(builder.startWithMoney),
				categories,
			};
			if (effectiveScope === "household") {
				if (!householdId) {
					throw new Error("No tienes un hogar asignado.");
				}
				payload.householdId = householdId;
			}
			await apiFetch(apiEndpoints.budgets, {
				method: "POST",
				body: JSON.stringify(payload),
			});
			setBuilderFeedback({ severity: "success", message: "Plantilla guardada correctamente." });
			await Promise.all([loadBudget(), loadHistory()]);
		} catch (error_) {
			setBuilderFeedback({ severity: "error", message: error_.message });
		} finally {
			setBuilderSaving(false);
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
				<Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
					<Box sx={{ flex: "1 1 auto" }}>
						<Typography variant="h4">Configurar Start Here</Typography>
						<Typography color="text.secondary" variant="body2">
							Esta vista replica la hoja Start Here del Excel. Define la moneda, el saldo inicial y las subcategorías base;
							el resumen mensual vive en <Link href="/dashboard">/dashboard</Link>.
						</Typography>
					</Box>
					<CountryBadge showProvider size="small" />
				</Stack>

				<Card>
					<CardContent>
						<Stack spacing={3}>
							<Stack direction={{ xs: "column", md: "row" }} spacing={2}>
								<TextField
									label="Periodo a editar"
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
											? "Alterna entre presupuesto personal o familiar."
											: "Aún no tienes paquete familiar asignado."
									}
								>
									<MenuItem value="personal">Personal</MenuItem>
									<MenuItem value="household" disabled={!hasHousehold}>
										Familiar
									</MenuItem>
								</TextField>
								<Button onClick={loadBudget} disabled={loading}>
									{loading ? "Cargando..." : "Cargar periodo"}
								</Button>
							</Stack>
							{error && <Alert severity="error">{error}</Alert>}
							{builderFeedback && <Alert severity={builderFeedback.severity}>{builderFeedback.message}</Alert>}
							<form onSubmit={handleBuilderSubmit}>
								<Stack spacing={3}>
									<Box
										sx={{
											display: "grid",
											gap: 2,
											gridTemplateColumns: {
												xs: "repeat(1, minmax(0, 1fr))",
												sm: "repeat(2, minmax(0, 1fr))",
												md: "repeat(3, minmax(0, 1fr))",
											},
										}}
									>
										<TextField
											label="Currency"
											value={builder.currency}
											onChange={(event) => handleBuilderFieldChange("currency", event.target.value)}
											helperText="Ej. COP, USD, $"
										/>
										<TextField
											label="Start Balance"
											type="number"
											value={builder.startBalance}
											onChange={(event) => handleBuilderFieldChange("startBalance", event.target.value)}
										/>
										<Box
											sx={{
												border: "1px solid",
												borderColor: "divider",
												borderRadius: 1.5,
												display: "flex",
												alignItems: "center",
												px: 2,
											}}
										>
											<FormControlLabel
												control={
													<Switch
														checked={Boolean(builder.startWithMoney)}
														onChange={(event) => handleBuilderFieldChange("startWithMoney", event.target.checked)}
													/>
												}
												label="¿Inicia con dinero?"
												sx={{ m: 0 }}
											/>
										</Box>
									</Box>
									<Divider />
									<Box
										sx={{
											display: "grid",
											gap: 2,
											gridTemplateColumns: {
												xs: "repeat(1, minmax(0, 1fr))",
												sm: "repeat(2, minmax(0, 1fr))",
												md: "repeat(5, minmax(0, 1fr))",
											},
										}}
									>
										{builder.groups.map((group) => (
											<Box key={group.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
												<Box
													sx={{
														backgroundColor: group.accentColor,
														px: 2,
														py: 1.5,
													}}
												>
													<Typography sx={{ fontWeight: 600 }} variant="overline">
														{group.label}
													</Typography>
												</Box>
												<Stack spacing={1.5} sx={{ p: 2 }}>
													{group.description && (
														<Typography color="text.secondary" variant="caption">
															{group.description}
														</Typography>
													)}
													{group.subcategories.map((subcategory) => (
														<Stack
															key={subcategory.id}
															direction="row"
															spacing={1}
															alignItems="center"
															sx={{ width: "100%" }}
														>
															<TextField
																placeholder="Nombre"
																value={subcategory.label}
																onChange={(event) =>
																	handleSubcategoryChange(group.id, subcategory.id, event.target.value)
																}
																fullWidth
															/>
															<Tooltip title="Eliminar subcategoría">
																<span>
																	<IconButton
																		onClick={() => handleRemoveSubcategory(group.id, subcategory.id)}
																		size="small"
																		disabled={builderSaving}
																	>
																		<SvgIcon fontSize="small">
																			<TrashIcon />
																		</SvgIcon>
																	</IconButton>
																</span>
															</Tooltip>
														</Stack>
													))}
													<Button
														onClick={() => handleAddSubcategory(group.id)}
														startIcon={
															<SvgIcon fontSize="small">
																<PlusIcon />
															</SvgIcon>
														}
														type="button"
														variant="text"
														size="small"
														disabled={builderSaving}
													>
														Agregar fila
													</Button>
												</Stack>
											</Box>
										))}
									</Box>
									<Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "flex-end" }}>
										<Button onClick={handleResetBuilder} type="button" disabled={builderSaving}>
											Restablecer plantilla
										</Button>
										<Button type="submit" variant="contained" disabled={builderSaving || !canEditSelectedPeriod}>
											{builderSaving ? "Guardando..." : "Guardar Start Here"}
										</Button>
									</Stack>
								</Stack>
							</form>
						</Stack>
					</CardContent>
				</Card>

				<Card>
					<CardContent>
						<Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
							<Typography variant="h5">Histórico de presupuestos</Typography>
							<Typography color="text.secondary" variant="body2">
								Esta tabla muestra todos los periodos guardados. Usa los botones para verlos en el dashboard o volver a editarlos.
							</Typography>
						</Stack>
						{historyLoading ? (
							<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
								<CircularProgress />
							</Box>
						) : historyError ? (
							<Alert severity="error" sx={{ mt: 2 }}>
								{historyError}
							</Alert>
						) : history.length === 0 ? (
							<Alert severity="info" sx={{ mt: 2 }}>
								Aún no tienes presupuestos registrados. Crea tu Start Here y guarda el primer mes.
							</Alert>
						) : (
							<Table size="small" sx={{ mt: 2 }}>
								<TableHead>
									<TableRow>
										<TableCell>Periodo</TableCell>
										<TableCell>Ámbito</TableCell>
										<TableCell align="right">Asignado</TableCell>
										<TableCell align="right">Gastado</TableCell>
										<TableCell align="right">Acciones</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{history.map((item) => (
										<TableRow key={`${item.period}-${item.ownerType}-${item.ownerId ?? "personal"}`}>
											<TableCell>{item.period}</TableCell>
											<TableCell>{item.ownerType === "household" ? "Familiar" : "Personal"}</TableCell>
											<TableCell align="right">{formatCurrency(item.totals?.asignado ?? 0, country.locale, country.currency)}</TableCell>
											<TableCell align="right">{formatCurrency(item.totals?.gastado ?? 0, country.locale, country.currency)}</TableCell>
											<TableCell align="right">
												<Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
													<Button
														component={Link}
														href={`/dashboard?period=${item.period}`}
														size="small"
														variant="text"
													>
														Ver resumen
													</Button>
													<Button
														size="small"
														variant="outlined"
														onClick={() => {
															setPeriod(item.period);
															window.scrollTo({ top: 0, behavior: "smooth" });
														}}
													>
														Editar
													</Button>
												</Stack>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
}
