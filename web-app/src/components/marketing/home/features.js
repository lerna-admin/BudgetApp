import * as React from "react";
import RouterLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { StackIcon } from "@phosphor-icons/react/dist/ssr/Stack";

import { paths } from "@/paths";

export function Features() {
	return (
		<Box component="section" id="features" sx={{ pt: "120px" }}>
			<Stack spacing={8}>
				<Stack maxWidth="700px" sx={{ mx: "auto", px: 3 }}>
					<Stack spacing={2}>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<Chip color="primary" icon={<StackIcon />} label="Experiencias" variant="soft" />
						</Box>
						<Typography sx={{ textAlign: "center" }} variant="h3">
							Un solo stack para presupuestos, integraciones y soporte
						</Typography>
						<Typography color="text.secondary" sx={{ textAlign: "center" }}>
							Configura onboarding inteligente, automatiza alertas por categoría y ofrece canales de soporte para tus
							clientes o tu familia sin construir todo desde cero.
						</Typography>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<Button component={RouterLink} endIcon={<CaretRightIcon />} href={paths.pricing} variant="contained">
								Ver planes disponibles
							</Button>
						</Box>
					</Stack>
				</Stack>
				<Container maxWidth="md">
					<Box component="img" src="/assets/home-techs.svg" sx={{ display: "block", height: "auto", width: "100%" }} />
				</Container>
			</Stack>
		</Box>
	);
}
