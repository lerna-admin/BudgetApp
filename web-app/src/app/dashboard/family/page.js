"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useUser } from "@/components/auth/user-context";
import { apiEndpoints, apiFetch } from "@/lib/api-client";
import { getPlanById, planCatalog } from "@/config/plans";
import { useRoleGuard } from "@/hooks/use-role-guard";

export default function FamilyPage() {
	const canView = useRoleGuard(["client"]);
	if (!canView) {
		return null;
	}
	return <FamilyContent />;
}

function FamilyContent() {
	const user = useUser();
	const [state, setState] = React.useState({ loading: true, error: null, household: null });

	React.useEffect(() => {
		let active = true;
		const load = async () => {
			setState((prev) => ({ ...prev, loading: true, error: null }));
			try {
				const households = await apiFetch(apiEndpoints.households);
				const membership = user?.householdMemberships?.[0];
				if (!membership) {
					setState({ loading: false, error: null, household: null });
					return;
				}
				const found = households.find((item) => item.id === membership.householdId) ?? null;
				if (active) {
					setState({ loading: false, error: null, household: found });
				}
			} catch (error) {
				if (active) {
					setState({ loading: false, error: error.message, household: null });
				}
			}
		};
		load();
		return () => {
			active = false;
		};
	}, [user?.householdMemberships]);

	if (!user?.householdMemberships?.length) {
		return (
			<Box
				sx={{
					maxWidth: "var(--Content-maxWidth)",
					m: "var(--Content-margin)",
					p: "var(--Content-padding)",
					width: "var(--Content-width)",
				}}
			>
				<Card>
					<CardContent>
						<Typography variant="h5">Paquete familiar</Typography>
						<Typography color="text.secondary" variant="body2">
							Aún no perteneces a un paquete familiar. Pide a un administrador que te agregue desde el panel de
							hogares.
						</Typography>
					</CardContent>
				</Card>
			</Box>
		);
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
					<Typography variant="h4">Mi familia</Typography>
					<Typography color="text.secondary" variant="body2">
						Gestiona el presupuesto compartido y revisa la participación de cada integrante del paquete familiar.
					</Typography>
				</Box>
				<Card>
					<CardContent>
						{state.error ? (
							<Alert severity="error">{state.error}</Alert>
						) : state.loading ? (
							<Typography color="text.secondary" variant="body2">
								Cargando información del hogar...
							</Typography>
						) : state.household ? (
							<Stack spacing={3}>
								<HouseholdSummary household={state.household} />
								<Box>
									<Typography variant="subtitle1">Integrantes</Typography>
									<Stack spacing={1} sx={{ mt: 1 }}>
										{state.household.members.map((member) => (
											<Box
												key={member.userId}
												sx={{
													border: "1px solid var(--mui-palette-divider)",
													borderRadius: 1,
													p: 2,
												}}
											>
												<Typography variant="body1">{member.userId}</Typography>
												<Typography color="text.secondary" variant="body2">
													Rol: {member.role} · {member.sharePercent}% del presupuesto familiar
												</Typography>
											</Box>
										))}
									</Stack>
								</Box>
							</Stack>
						) : (
							<Typography color="text.secondary" variant="body2">
								No se encontró información del paquete familiar asociado a tu cuenta.
							</Typography>
						)}
					</CardContent>
				</Card>
				<PlanCatalogSection />
			</Stack>
		</Box>
	);
}

function HouseholdSummary({ household }) {
	const plan = getPlanById(household.planType);
	return (
		<Stack spacing={2}>
			<Box>
				<Typography variant="h6">{household.name}</Typography>
				<Typography color="text.secondary" variant="body2">
					Plan: {plan.name} · Facturado a: {household.billingUserId}
				</Typography>
				<Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
					{plan.description}
				</Typography>
			</Box>
			<Box>
				<Typography variant="subtitle2">Beneficios del plan</Typography>
				<List dense disablePadding>
					{plan.features.map((feature) => (
						<ListItem key={feature} disableGutters sx={{ py: 0.25 }}>
							<ListItemText primaryTypographyProps={{ variant: "body2" }} primary={feature} />
						</ListItem>
					))}
				</List>
				<Chip
					label={`Hasta ${plan.maxMembers} integrante${plan.maxMembers > 1 ? "s" : ""}`}
					size="small"
					sx={{ mt: 1, width: "fit-content" }}
				/>
			</Box>
		</Stack>
	);
}

function PlanCatalogSection() {
	return (
		<Card>
			<CardContent>
				<Stack spacing={2}>
					<Box>
						<Typography variant="h6">Planes disponibles</Typography>
						<Typography color="text.secondary" variant="body2">
							Consulta las características y alcance de cada plan antes de solicitar un cambio de paquete.
						</Typography>
					</Box>
					<Stack spacing={2}>
						{planCatalog.map((plan) => (
							<Box
								key={plan.id}
								sx={{
									border: "1px solid var(--mui-palette-divider)",
									borderRadius: 1,
									p: 2,
								}}
							>
								<Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
									<Box>
										<Typography variant="subtitle1">{plan.name}</Typography>
										<Typography color="text.secondary" variant="body2">
											{plan.description}
										</Typography>
									</Box>
									<Chip label={`${plan.maxMembers} integrante${plan.maxMembers > 1 ? "s" : ""}`} size="small" />
								</Stack>
								<List dense disablePadding sx={{ mt: 1 }}>
									{plan.features.map((feature) => (
										<ListItem key={`${plan.id}-${feature}`} disableGutters sx={{ py: 0.25 }}>
											<ListItemText primaryTypographyProps={{ variant: "body2" }} primary={feature} />
										</ListItem>
									))}
								</List>
							</Box>
						))}
					</Stack>
				</Stack>
			</CardContent>
		</Card>
	);
}
