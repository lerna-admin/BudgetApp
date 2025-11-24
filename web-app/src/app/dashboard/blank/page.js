import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { appConfig } from "@/config/app";
import { apiEndpoints, apiFetch } from "@/lib/api-client";

export const metadata = { title: `Blank | Dashboard | ${appConfig.name}` };

export default function Page() {
	const [budgets, setBudgets] = React.useState([]);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState(null);

	const fetchBudgets = React.useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await apiFetch(`${apiEndpoints.budgets}?period=2025-12`);
			setBudgets(response?.categories || []);
		} catch (err) {
			setError(err.message);
			setBudgets([]);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		void fetchBudgets();
	}, [fetchBudgets]);

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
				<Card>
					<CardContent>
						<Stack spacing={2}>
							{loading && <Typography>Cargando presupuesto...</Typography>}
							{error && (
								<Typography color="error" variant="body2">
									Error: {error}
								</Typography>
							)}
							{!loading && !error && budgets.length === 0 && (
								<Typography>No se encontraron categorías en la respuesta.</Typography>
							)}
							{budgets.map((category) => (
								<Box
									key={category.categoryId}
									sx={{
										border: "1px solid var(--mui-palette-divider)",
										borderRadius: "8px",
										p: 2,
									}}
								>
									<Typography variant="subtitle1">{category.categoryId}</Typography>
									<Typography color="text.secondary" variant="body2">
										Asignado: {category.asignado} | Gastado: {category.gastado ?? 0}
									</Typography>
								</Box>
							))}
						</Stack>
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
}
