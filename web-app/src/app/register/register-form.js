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

export function RegisterForm() {
	const router = useRouter();
	const [form, setForm] = React.useState({ name: "", email: "", password: "" });
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
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.message || "No se pudo crear la cuenta.");
			}
			router.replace("/dashboard");
		} catch (error_) {
			setError(error_.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
			<Card sx={{ maxWidth: 420, width: "100%" }}>
				<CardContent>
					<Stack spacing={3}>
						<Box>
							<Typography variant="h4">Crear una cuenta</Typography>
							<Typography color="text.secondary" variant="body2">
								Regístrate para comenzar con tu presupuesto inteligente.
							</Typography>
						</Box>
						<form onSubmit={handleSubmit}>
							<Stack spacing={2}>
								<TextField label="Nombre" name="name" value={form.name} onChange={handleChange} required />
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
									{loading ? "Creando..." : "Crear cuenta"}
								</Button>
								{error && (
									<Typography color="error" variant="body2">
										{error}
									</Typography>
								)}
							</Stack>
						</form>
						<Typography color="text.secondary" variant="body2">
							¿Ya tienes cuenta? <Link href="/login">Ingresa aquí</Link>
						</Typography>
					</Stack>
				</CardContent>
			</Card>
		</Box>
	);
}
