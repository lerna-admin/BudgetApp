"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

import { appConfig } from "@/config/app";
import { apiEndpoints, apiFetch } from "@/lib/api-client";

export const metadata = { title: `Budgets | Dashboard | ${appConfig.name}` };

export default function Page() {
	const [data, setData] = React.useState(null);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState(null);

	const loadBudgets = React.useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await apiFetch(`${apiEndpoints.budgets}?period=2025-12`);
			setData(response);
		} catch (err) {
			setError(err.message);
			setData(null);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		void loadBudgets();
	}, [loadBudgets]);

	const categories = data?.categories || [];

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
						<Typography variant="h4">Budgets (mock)</Typography>
						<Typography color="text.secondary" variant="body2">
							Periodo: {data?.period || "2025-12"} · API:{" "}
							{process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4010"}
						</Typography>
					</Box>
					<div>
						<Button onClick={loadBudgets} variant="contained">
							Recargar
						</Button>
					</div>
				</Stack>

				<Card>
					<CardContent>
						{loading && <Typography>Cargando...</Typography>}
						{error && (
							<Typography color="error" variant="body2">
								Error: {error}
							</Typography>
						)}
						{!loading && !error && categories.length === 0 && (
							<Typography color="text.secondary">No hay categorías disponibles.</Typography>
						)}
						<Stack divider={<Divider />} spacing={2} sx={{ mt: 2 }}>
							{categories.map((category) => (
								<Box key={category.categoryId}>
									<Typography variant="subtitle1">{category.categoryId}</Typography>
									<Typography color="text.secondary" variant="body2">
										Asignado: {category.asignado} · Gastado: {category.gastado ?? 0}
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
