import * as React from "react";
import RouterLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr/Lightning";

import { paths } from "@/paths";

export function Included() {
	return (
		<Box
			component="section"
			id="producto"
			sx={{
				bgcolor: "var(--mui-palette-neutral-950)",
				color: "var(--mui-palette-common-white)",
				overflow: "hidden",
				py: "120px",
				position: "relative",
			}}
		>
			<Box
				sx={{
					alignItems: "center",
					display: "flex",
					height: "100%",
					justifyContent: "center",
					left: 0,
					position: "absolute",
					top: 0,
					width: "100%",
					zIndex: 0,
				}}
			>
				<Box component="img" src="/assets/home-cosmic.svg" sx={{ height: "auto", width: "1600px" }} />
			</Box>
			<Stack spacing={8} sx={{ position: "relative", zIndex: 1 }}>
				<Container maxWidth="md">
					<Stack spacing={2}>
						<Typography color="inherit" sx={{ textAlign: "center" }} variant="h3">
							Todo lo que necesitas para pilotear tus finanzas
						</Typography>
						<Typography color="neutral.300" sx={{ textAlign: "center" }}>
							Unifica presupuestos, integraciones y soporte en una sola experiencia multi-dispositivo.
						</Typography>
					</Stack>
				</Container>
				<Container maxWidth="lg">
					<Grid alignItems="center" container spacing={3}>
						<Grid
							size={{
								md: 4,
								xs: 12,
							}}
						>
							<Stack spacing={2}>
								<div>
									<Chip color="success" icon={<LightningIcon />} label="Dashboard vivo" variant="soft" />
								</div>
								<Typography color="inherit" variant="h3">
									Presupuestos + alertas + soporte en vivo
								</Typography>
								<Typography color="inherit">
									Monitorea cuánto llevan gastando tus tarjetas, qué porcentaje aporta cada miembro del hogar y abre
									tickets con nuestros agentes para recibir acompañamiento financiero en tiempo real.
								</Typography>
								<div>
									<Button color="secondary" component={RouterLink} href={paths.register} variant="contained">
										Probar BudgetApp
									</Button>
								</div>
							</Stack>
						</Grid>
						<Grid
							size={{
								md: 8,
								xs: 12,
							}}
						>
							<Box sx={{ margin: "0 auto", maxWidth: "100%", position: "relative", width: "390px" }}>
								<Box
									sx={{
										bgcolor: "#8057f4",
										bottom: 0,
										filter: "blur(50px)",
										height: "20px",
										left: "15%",
										position: "absolute",
										right: 0,
										top: 0,
										transform: "rotate(-169deg)",
										zIndex: 0,
									}}
								/>
								<Box
									alt="Widgets"
									component="img"
									src="/assets/home-widgets.png"
									sx={{ height: "auto", position: "relative", width: "100%", zIndex: 1 }}
								/>
							</Box>
						</Grid>
					</Grid>
				</Container>
			</Stack>
		</Box>
	);
}
