import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { appConfig } from "@/config/app";

const API_BASE_LABEL = process.env.NEXT_PUBLIC_API_BASE_URL || "el mismo host (Next.js API)";

export const metadata = { title: `Blank | Dashboard | ${appConfig.name}` };

export default function Page() {
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
						<Typography variant="h4">Presupuestos (API local)</Typography>
						<Typography color="text.secondary" variant="body2">
							Consumiendo {API_BASE_LABEL}
						</Typography>
					</Box>
					<div>
						<Button disabled startIcon={<PlusIcon />} variant="contained">
							Acción pendiente
						</Button>
					</div>
				</Stack>
				<Box sx={{ border: "1px dashed var(--mui-palette-divider)", height: "300px", p: "4px" }} />
			</Stack>
		</Box>
	);
}
