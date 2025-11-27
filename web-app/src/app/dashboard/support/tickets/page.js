"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import Link from "next/link";

import { useUser } from "@/components/auth/user-context";
import { apiEndpoints, apiFetch } from "@/lib/api-client";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { paths } from "@/paths";

const STATUS_OPTIONS = [
	{ label: "Abierto", value: "open" },
	{ label: "En progreso", value: "in_progress" },
	{ label: "Resuelto", value: "resolved" },
	{ label: "Cerrado", value: "closed" },
];

const PRIORITY_OPTIONS = [
	{ label: "Baja", value: "low" },
	{ label: "Media", value: "medium" },
	{ label: "Alta", value: "high" },
];

async function fetchTickets() {
	return apiFetch(apiEndpoints.tickets);
}

export default function TicketsPage() {
	const canView = useRoleGuard(["client", "cs_agent", "admin"]);
	if (!canView) {
		return null;
	}
	return <TicketsContent />;
}

function TicketsContent() {
	const user = useUser();
	const isAgent = user?.role === "cs_agent";
	const isAdmin = user?.role === "admin";
	const canCreateTicket = user?.role === "client";
	const [state, setState] = React.useState({ loading: true, error: null, tickets: [] });
	const [form, setForm] = React.useState({ title: "", description: "", priority: "medium" });
	const [commentDrafts, setCommentDrafts] = React.useState({});

	const loadTickets = React.useCallback(async () => {
		setState((prev) => ({ ...prev, loading: true, error: null }));
		try {
			const data = await fetchTickets();
			setState({ loading: false, error: null, tickets: data });
		} catch (error) {
			setState({ loading: false, error: error.message, tickets: [] });
		}
	}, []);

	React.useEffect(() => {
		if (isAdmin) {
			return;
		}
		void loadTickets();
	}, [isAdmin, loadTickets]);

	if (isAdmin) {
		return <AdminTicketSummary />;
	}

	const handleFormChange = (event) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			await apiFetch(apiEndpoints.tickets, {
				method: "POST",
				body: JSON.stringify(form),
			});
			setForm({ title: "", description: "", priority: "medium" });
			await loadTickets();
		} catch (error) {
			setState((prev) => ({ ...prev, error: error.message }));
		}
	};

	const handleTicketUpdate = async (id, payload) => {
		try {
			await apiFetch(apiEndpoints.ticket(id), {
				method: "PUT",
				body: JSON.stringify(payload),
			});
			setCommentDrafts((prev) => ({ ...prev, [id]: "" }));
			await loadTickets();
		} catch (error) {
			setState((prev) => ({ ...prev, error: error.message }));
		}
	};

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
				<Box>
					<Typography variant="h4">Tickets de soporte</Typography>
					<Typography color="text.secondary" variant="body2">
						{isAgent
							? "Consulta los tickets asignados a tu cola y mantén la conversación con el cliente. No verás solicitudes de otros agentes."
							: "Abre y consulta tus tickets con el equipo de soporte. Solo tú y el agente asignado pueden ver cada conversación."}
					</Typography>
				</Box>

				{canCreateTicket && (
					<Card>
						<CardContent>
							<form onSubmit={handleSubmit}>
								<Stack spacing={2}>
									<TextField label="Título" name="title" value={form.title} onChange={handleFormChange} required />
									<TextField
										label="Descripción"
										name="description"
										multiline
										minRows={3}
										value={form.description}
										onChange={handleFormChange}
										required
									/>
									<TextField
										label="Prioridad"
										name="priority"
										select
										value={form.priority}
										onChange={handleFormChange}
									>
										{PRIORITY_OPTIONS.map((option) => (
											<MenuItem key={option.value} value={option.value}>
												{option.label}
											</MenuItem>
										))}
									</TextField>
									<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
										<Button type="submit" variant="contained">
											Abrir ticket
										</Button>
									</Box>
								</Stack>
							</form>
						</CardContent>
					</Card>
				)}

				{state.error && <Alert severity="error">{state.error}</Alert>}

				{state.loading ? (
					<Typography color="text.secondary" variant="body2">
						Cargando tickets...
					</Typography>
				) : (
					state.tickets.map((ticket) => (
						<Card key={ticket.id}>
							<CardContent>
								<Stack spacing={2}>
									<Box>
										<Typography variant="h6">{ticket.title}</Typography>
										<Typography color="text.secondary" variant="body2">
											Prioridad: {ticket.priority} · Estado: {ticket.status}
										</Typography>
									</Box>
									<Typography variant="body2">{ticket.description}</Typography>
									{isAgent && (
										<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
											<TextField
												label="Estado"
												select
												value={ticket.status}
												onChange={(event) =>
													handleTicketUpdate(ticket.id, { status: event.target.value })
												}
												size="small"
											>
												{STATUS_OPTIONS.map((option) => (
													<MenuItem key={option.value} value={option.value}>
														{option.label}
													</MenuItem>
												))}
											</TextField>
											<TextField
												label="Asignado a"
												size="small"
												disabled
												value={ticket.assignedTo ?? "Sin asignar"}
											/>
										</Stack>
									)}
									<Stack spacing={1}>
										<Typography variant="subtitle2">Comentarios</Typography>
										{(ticket.comments ?? []).length === 0 && (
											<Typography color="text.secondary" variant="body2">
												Aún no hay comentarios.
											</Typography>
										)}
										{(ticket.comments ?? []).map((comment) => (
											<Box
												key={comment.id}
												sx={{
													border: "1px solid var(--mui-palette-divider)",
													borderRadius: 1,
													p: 1.5,
												}}
											>
												<Typography color="text.secondary" variant="caption">
													Autor: {comment.authorId || "Desconocido"} · {new Date(comment.createdAt).toLocaleString()}
												</Typography>
												<Typography variant="body2">{comment.message}</Typography>
											</Box>
										))}
									</Stack>
									<Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
										<TextField
											label="Agregar comentario"
											fullWidth
											value={commentDrafts[ticket.id] ?? ""}
											onChange={(event) =>
												setCommentDrafts((prev) => ({
													...prev,
													[ticket.id]: event.target.value,
												}))
											}
										/>
										<Button
											onClick={() =>
												handleTicketUpdate(ticket.id, {
													comment: commentDrafts[ticket.id],
												})
											}
											variant="outlined"
											disabled={!commentDrafts[ticket.id]}
										>
											Enviar
										</Button>
									</Box>
								</Stack>
							</CardContent>
						</Card>
					))
				)}
			</Stack>
		</Box>
	);
}

function AdminTicketSummary() {
	return (
		<Box
			sx={{
				maxWidth: "var(--Content-maxWidth)",
				m: "var(--Content-margin)",
				p: "var(--Content-padding)",
				width: "var(--Content-width)",
			}}
		>
			<Card>
				<CardContent>
					<Stack spacing={2}>
						<Typography variant="h5">Tasks / Tickets</Typography>
						<Typography color="text.secondary" variant="body2">
							Los administradores monitorean la carga desde el panel principal y delegan la atención al equipo de customer
							success. Consulta el overview para revisar métricas y redistribuir trabajo.
						</Typography>
						<Box>
							<Button component={Link} href={paths.dashboard.admin.overview} variant="contained">
								Ir al panel admin
							</Button>
						</Box>
					</Stack>
				</CardContent>
			</Card>
		</Box>
	);
}
