import * as React from "react";
import RouterLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { planCatalog } from "@/config/plans";
import { paths } from "@/paths";
import { Plan } from "./plan";

export function PlansTable() {
	const pricing = {
		personal_free: {
			currency: "COP",
			price: 0,
			icon: "startup",
			action: (
				<Button component={RouterLink} href={paths.register} variant="outlined">
					Crear cuenta gratis
				</Button>
			),
			badge: "1 mes de historial",
		},
		personal: {
			currency: "COP",
			price: 19000,
			icon: "standard",
			action: (
				<Button component={RouterLink} href={paths.register} variant="contained">
					Iniciar ahora
				</Button>
			),
			badge: "Sin límites",
		},
		family: {
			currency: "COP",
			price: 59000,
			icon: "enterprise",
			action: (
				<Button color="secondary" component={RouterLink} href={paths.register} variant="contained">
					Prueba 5 días
				</Button>
			),
			badge: "Familiar",
		},
	};

	return (
		<Box component="section" id="pricing" sx={{ bgcolor: "var(--mui-palette-background-level1)", py: { xs: "60px", sm: "120px" } }}>
			<Container maxWidth="lg">
				<Stack spacing={3}>
					<Stack spacing={2} sx={{ alignItems: "center" }}>
						<Typography sx={{ textAlign: "center" }} variant="h3">
							Planes diseñados para cada tipo de hogar
						</Typography>
						<Typography color="text.secondary" sx={{ textAlign: "center" }} variant="body1">
							Facturación en pesos colombianos / mensual. Expande a otros países simplemente actualizando el catálogo en
							código.
						</Typography>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
							<Chip color="success" label="Incluye alertas y soporte" size="small" />
						</Stack>
					</Stack>
					<div>
						<Grid container spacing={3}>
							{planCatalog.map((plan) => {
								const details = pricing[plan.id] ?? pricing.personal;
								return (
									<Grid
										key={plan.id}
										size={{
											md: 4,
											xs: 12,
										}}
									>
										<Plan
											action={details.action}
											currency={details.currency}
											description={plan.description}
											features={plan.features}
											id={details.icon}
											name={plan.name}
											price={details.price}
										/>
									</Grid>
								);
							})}
						</Grid>
					</div>
					<div>
						<Typography color="text.secondary" component="p" sx={{ textAlign: "center" }} variant="caption">
							¿Necesitas pricing corporativo? Escríbenos a{" "}
							<Box
								component="a"
								href="mailto:hola@budgetapp.test"
								sx={{ color: "inherit", textDecoration: "underline" }}
							>
								hola@budgetapp.test
							</Box>
							.
						</Typography>
					</div>
				</Stack>
			</Container>
		</Box>
	);
}
