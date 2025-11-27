import * as React from "react";
import RouterLink from "next/link";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";

import { appConfig } from "@/config/app";
import { SplitLayout } from "@/components/auth/split-layout";
import { DynamicLogo } from "@/components/core/logo";
import { paths } from "@/paths";
import { LoginForm } from "./login-form";

export const metadata = { title: `Iniciar sesión | ${appConfig.name}` };

export default function Page() {
	return (
		<SplitLayout>
			<Stack spacing={4}>
				<Link
					color="text.primary"
					component={RouterLink}
					href={paths.home}
					sx={{ alignItems: "center", display: "inline-flex", gap: 1 }}
					variant="subtitle2"
				>
					<ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
					Volver al sitio
				</Link>

				<Box>
					<DynamicLogo colorDark="light" colorLight="dark" height={32} width={122} />
				</Box>

				<Stack spacing={2}>
					<Typography variant="h4">Bienvenido de vuelta</Typography>
					<Typography color="text.secondary" variant="body2">
						Ingresa con tus credenciales para acceder al dashboard. ¿No tienes cuenta?{" "}
						<Link component={RouterLink} href={paths.register} variant="subtitle2">
							Regístrate aquí
						</Link>
					</Typography>
					<Stack spacing={1} sx={{ bgcolor: "var(--mui-palette-background-level1)", borderRadius: 2, p: 2 }}>
						<Typography color="text.secondary" variant="body2">
							Accesos rápidos por rol:
						</Typography>
						<Typography color="text.secondary" variant="body2">
							<strong>Admin</strong>: admin@budgetapp.test / Admin123!
						</Typography>
						<Typography color="text.secondary" variant="body2">
							<strong>CS Agent</strong>: agent@budgetapp.test / Agent123!
						</Typography>
						<Typography color="text.secondary" variant="body2">
							Registra nuevos clientes desde la opción “Crear cuenta” para validar los flujos del rol final.
						</Typography>
					</Stack>
				</Stack>

				<LoginForm hideHeader standalone={false} />
			</Stack>
		</SplitLayout>
	);
}
