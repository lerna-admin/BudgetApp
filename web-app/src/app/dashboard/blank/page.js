import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { appConfig } from "@/config/app";

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
						<Typography variant="h4">Mock budgets</Typography>
						<Typography color="text.secondary" variant="body2">
							Consumiendo {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4010"}
						</Typography>
					</Box>
					<div>
						<Button onClick={fetchBudgets} startIcon={<PlusIcon />} variant="contained">
							Recargar
						</Button>
					</div>
				</Stack>
				<Box sx={{ border: "1px dashed var(--mui-palette-divider)", height: "300px", p: "4px" }} />
			</Stack>
		</Box>
	);
}
