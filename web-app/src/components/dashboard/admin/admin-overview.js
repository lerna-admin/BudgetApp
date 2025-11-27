"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ArrowLineUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowLineUpRight";
import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr/Buildings";
import { ChatsCircleIcon } from "@phosphor-icons/react/dist/ssr/ChatsCircle";
import { GlobeHemisphereEastIcon } from "@phosphor-icons/react/dist/ssr/GlobeHemisphereEast";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr/Lightning";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import Link from "next/link";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { planCatalog } from "@/config/plans";
import { apiEndpoints, apiFetch } from "@/lib/api-client";
import { Summary } from "@/components/dashboard/overview/summary";
import { AppUsage } from "@/components/dashboard/overview/app-usage";
import { AppLimits } from "@/components/dashboard/overview/app-limits";
import { HelperWidget } from "@/components/dashboard/overview/helper-widget";
import { Events } from "@/components/dashboard/overview/events";
import { Subscriptions } from "@/components/dashboard/overview/subscriptions";
import { NoSsr } from "@/components/core/no-ssr";
import { paths } from "@/paths";

const FALLBACK_USAGE = [
	{ name: "Jun", v1: 16, v2: 22 },
	{ name: "Jul", v1: 20, v2: 18 },
	{ name: "Ago", v1: 24, v2: 21 },
	{ name: "Sep", v1: 28, v2: 23 },
	{ name: "Oct", v1: 32, v2: 25 },
	{ name: "Nov", v1: 35, v2: 27 },
];

const EVENTS = [
	{
		id: "ev-1",
		title: "Integración Belvo productiva",
		description: "Seguimiento al despliegue en Colombia.",
		createdAt: "2025-12-04",
	},
	{
		id: "ev-2",
		title: "Revisión de licencias familiares",
		description: "Analizar upgrades hacia el plan Family.",
		createdAt: "2025-12-10",
	},
];

const SUBSCRIPTIONS = [
	{ id: "sub-1", title: "Alertas Proactivas", costs: "$49", billingCycle: "mes", status: "paid" },
	{ id: "sub-2", title: "Integración Bancaria", costs: "$199", billingCycle: "mes", status: "expiring" },
];

export function AdminOverview() {
	const [state, setState] = React.useState({ loading: true, error: null, data: null });

	React.useEffect(() => {
		let isActive = true;
		const load = async () => {
			try {
				const data = await apiFetch(apiEndpoints.reports.kpis);
				if (isActive) {
					setState({ loading: false, error: null, data });
				}
			} catch (error) {
				if (isActive) {
					setState({ loading: false, error: error.message, data: null });
				}
			}
		};
		load();
		return () => {
			isActive = false;
		};
	}, []);

	const kpis = state.data;
	const summaryCards = [
		{
			key: "totalUsers",
			title: "Usuarios totales",
			amount: kpis?.totalUsers ?? 0,
			diff: 18,
			trend: "up",
			icon: UsersThreeIcon,
		},
		{
			key: "activeHouseholds",
			title: "Hogares activos",
			amount: kpis?.activeHouseholds ?? 0,
			diff: 9,
			trend: "up",
			icon: BuildingsIcon,
		},
		{
			key: "openTickets",
			title: "Tickets abiertos",
			amount: kpis?.openTickets ?? 0,
			diff: 5,
			trend: "down",
			icon: ChatsCircleIcon,
		},
		{
			key: "countryAdoption",
			title: "Países con actividad",
			amount: kpis?.countryAdoption?.length ?? 1,
			diff: 3,
			trend: "up",
			icon: GlobeHemisphereEastIcon,
		},
	];

	const usageData = React.useMemo(() => {
		if (!kpis?.monthlyBudgetTrend?.length) {
			return FALLBACK_USAGE;
		}
		return kpis.monthlyBudgetTrend.map((item) => ({
			name: item.period.slice(-2),
			v1: Math.round((item.gastado ?? 0) / 1_000_000),
			v2: Math.round((item.asignado ?? 0) / 1_000_000),
		}));
	}, [kpis?.monthlyBudgetTrend]);

	const planUsage = kpis?.supportLoad?.backlogRatio ?? 45;
	const supportLoad = kpis?.supportLoad;
	const householdsByPlan = kpis?.householdsByPlan ?? [];
	const budgetScope = kpis?.budgetScopeSplit ?? [];
	const ticketsByStatus = kpis?.ticketsByStatus ?? [];
	const priorityMix = supportLoad?.priorityMix ?? [];
	const priorityTotal = priorityMix.reduce((sum, item) => sum + item.value, 0);
	const countryAdoption = kpis?.countryAdoption ?? [];

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
				<Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
					<Box>
						<Typography variant="h4">Panel general</Typography>
						<Typography color="text.secondary" variant="body2">
							Estado de la plataforma, licencias y soporte en tiempo real.
						</Typography>
					</Box>
					<Button component={Link} href={paths.dashboard.settings.account} startIcon={<LightningIcon />} variant="contained">
						Ir a configuración
					</Button>
				</Stack>

				{state.error && <Alert severity="error">{state.error}</Alert>}

				<Grid container spacing={3}>
					{summaryCards.map((card) => (
						<Grid key={card.key} item xs={12} md={6} lg={3}>
							<Summary {...card} />
						</Grid>
					))}
				</Grid>

				<Grid container spacing={3}>
					<Grid item xs={12} md={8}>
						<AppUsage data={usageData} />
					</Grid>
					<Grid item xs={12} md={4}>
						<AppLimits usage={planUsage} />
					</Grid>
				</Grid>

				<Grid container spacing={3}>
					<Grid item xs={12} md={6}>
						<Card>
							<CardContent>
								<Stack spacing={2}>
									<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
										<Typography variant="h6">Carga del equipo de soporte</Typography>
										<Chip icon={<ArrowLineUpRightIcon />} label={`${supportLoad?.ticketsPerAgent ?? 0} tickets/agente`} />
									</Stack>
									{supportLoad ? (
										<Stack spacing={2}>
											<LinearProgress
												value={Math.min((supportLoad.backlogRatio ?? 0) / 1.2, 100)}
												variant="determinate"
												sx={{ height: 8, borderRadius: 999 }}
											/>
											<Typography color="text.secondary" variant="body2">
												Backlog abierto: {supportLoad.backlogRatio ?? 0}%
											</Typography>
											<Stack spacing={1}>
												{priorityMix.map((item) => {
													const percent = priorityTotal > 0 ? Math.round((item.value / priorityTotal) * 100) : 0;
													return (
														<Stack direction="row" justifyContent="space-between" key={item.priority}>
															<Typography variant="body2">{item.label}</Typography>
															<Typography color="text.secondary" variant="body2">
																{item.value} ({percent}%)
															</Typography>
														</Stack>
													);
												})}
												{priorityMix.length === 0 && (
													<Typography color="text.secondary" variant="body2">
														Sin tickets activos.
													</Typography>
												)}
											</Stack>
										</Stack>
									) : (
										<Typography color="text.secondary" variant="body2">
											Sin datos recientes.
										</Typography>
									)}
								</Stack>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={12} md={6}>
						<Card>
							<CardContent>
								<Typography variant="h6" sx={{ mb: 2 }}>
									Planes familiares
								</Typography>
								<Stack spacing={1}>
									{planCatalog.map((plan) => {
										const value = householdsByPlan.find((item) => item.planType === plan.id)?.count ?? 0;
										const total = householdsByPlan.reduce((sum, item) => sum + item.count, 0) || 1;
										const percent = Math.round((value / total) * 100);
										return (
											<Box key={plan.id}>
												<Stack direction="row" justifyContent="space-between">
													<Typography variant="body2">{plan.name}</Typography>
													<Typography color="text.secondary" variant="body2">
														{value} hogares
													</Typography>
												</Stack>
												<LinearProgress
													value={percent}
													variant="determinate"
													sx={{ mt: 1, height: 6, borderRadius: 999 }}
												/>
											</Box>
										);
									})}
								</Stack>
							</CardContent>
						</Card>
					</Grid>
				</Grid>

				<Grid container spacing={3}>
					<Grid item xs={12} md={4}>
						<Card>
							<CardContent>
								<Typography variant="h6" sx={{ mb: 2 }}>
									Tickets por estado
								</Typography>
								<Box sx={{ height: 220 }}>
									<NoSsr fallback={<Box sx={{ height: "100%" }} />}>
										<ResponsiveContainer height="100%">
											<PieChart>
												<Pie data={ticketsByStatus} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={3}>
													{ticketsByStatus.map((entry, index) => (
														<Cell
															key={entry.status}
															fill={["#22C55E", "#FACC15", "#FB923C", "#94A3B8"][index % 4]}
														/>
													))}
												</Pie>
												<Tooltip />
											</PieChart>
										</ResponsiveContainer>
									</NoSsr>
								</Box>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={12} md={4}>
						<Card>
							<CardContent>
								<Typography variant="h6" sx={{ mb: 2 }}>
									ámbito de presupuestos
								</Typography>
								<Box sx={{ height: 220 }}>
									<NoSsr fallback={<Box sx={{ height: "100%" }} />}>
										<ResponsiveContainer height="100%">
											<BarChart data={budgetScope} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
												<CartesianGrid strokeDasharray="3 3" />
												<XAxis dataKey="label" />
												<YAxis allowDecimals={false} />
												<Tooltip />
												<Bar dataKey="count" fill="var(--mui-palette-primary-main)" radius={[8, 8, 4, 4]} />
											</BarChart>
										</ResponsiveContainer>
									</NoSsr>
								</Box>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={12} md={4}>
						<HelperWidget
							action={
								<Button component={Link} href={paths.dashboard.integrations.banks} size="small" variant="contained">
									Ver integraciones
								</Button>
							}
							description="Supervisa el estado de los conectores y dispara un review si detectas retrasos."
							icon={LightningIcon}
							label="Integraciones"
							title="Salud de los proveedores bancarios"
						/>
					</Grid>
				</Grid>

				<Grid container spacing={3}>
					<Grid item xs={12} md={6}>
						<Events events={EVENTS} title="Próximos hitos" />
					</Grid>
					<Grid item xs={12} md={6}>
						<Subscriptions subscriptions={SUBSCRIPTIONS} title="Subscripciones críticas" />
					</Grid>
				</Grid>

				<Card>
					<CardContent>
						<Typography variant="h6" sx={{ mb: 2 }}>
							Países con mayor adopción
						</Typography>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>País</TableCell>
									<TableCell>Presupuestos</TableCell>
									<TableCell>Familiares</TableCell>
									<TableCell align="right">Asignado</TableCell>
									<TableCell align="right">Gastado</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{countryAdoption.map((country) => (
									<TableRow key={country.code}>
										<TableCell>
											<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
												<Chip label={country.code} size="small" />
												<Typography variant="body2">{country.name}</Typography>
											</Stack>
										</TableCell>
										<TableCell>{country.budgets}</TableCell>
										<TableCell>{country.householdBudgets}</TableCell>
										<TableCell align="right">
											{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
												country.asignado ?? 0,
											)}
										</TableCell>
										<TableCell align="right">
											{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
												country.gastado ?? 0,
											)}
										</TableCell>
									</TableRow>
								))}
								{countryAdoption.length === 0 && (
									<TableRow>
										<TableCell colSpan={5}>
											<Typography color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
												Aún no hay países con actividad registrada.
											</Typography>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
}
