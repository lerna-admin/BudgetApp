"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LoginForm({ hideHeader = false, standalone = true }) {
	const router = useRouter();
	const [form, setForm] = React.useState({ email: "", password: "" });
	const [error, setError] = React.useState(null);
	const [loading, setLoading] = React.useState(false);

	function handleChange(event) {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.message || "No se pudo iniciar sesión.");
			}
			router.replace("/dashboard");
		} catch (error_) {
			setError(error_.message);
		} finally {
			setLoading(false);
		}
	}

	const content = (
		<Card sx={{ maxWidth: 420, width: "100%" }}>
			<CardContent>
				<Stack spacing={3}>
					{!hideHeader && (
						<Box>
							<Typography variant="h4">Bienvenido</Typography>
							<Typography color="text.secondary" variant="body2">
								Usa tus credenciales para acceder al dashboard.
							</Typography>
							<Typography color="text.secondary" variant="body2">
								Cuentas demo activas: <strong>admin@budgetapp.test</strong> / <strong>Admin123!</strong> y{" "}
								<strong>agent@budgetapp.test</strong> / <strong>Agent123!</strong>
							</Typography>
						</Box>
					)}
					<form onSubmit={handleSubmit}>
						<Stack spacing={2}>
							<TextField label="Correo" name="email" type="email" value={form.email} onChange={handleChange} required />
							<TextField
								label="Contraseña"
								name="password"
								type="password"
								value={form.password}
								onChange={handleChange}
								required
							/>
							<Button disabled={loading} type="submit" variant="contained">
								{loading ? "Ingresando..." : "Ingresar"}
							</Button>
							{error && (
								<Typography color="error" variant="body2">
									{error}
								</Typography>
							)}
						</Stack>
					</form>
					<Typography color="text.secondary" variant="body2">
						¿No tienes cuenta? <Link href="/register">Regístrate aquí</Link>
					</Typography>
				</Stack>
			</CardContent>
		</Card>
	);

	if (!standalone) {
		return content;
	}

	return (
		<Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
			{content}
		</Box>
	);
}
