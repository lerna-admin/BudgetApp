"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { QuestionIcon } from "@phosphor-icons/react/dist/ssr/Question";

const faqs = [
	{
		id: "FAQ-1",
		question: "¿Cómo conectan mis bancos y tarjetas?",
		answer:
			"Trabajamos con proveedores Open Finance (Belvo, Minka) para obtener movimientos con autorización del usuario. La primera versión opera en Colombia y luego expandiremos a México y Brasil.",
	},
	{
		id: "FAQ-2",
		question: "¿Cuál es la diferencia entre los planes Personal Free, Personal y Family?",
		answer:
			"Personal Free limita el historial a 30 días, Personal desbloquea presupuestos ilimitados e integración bancaria individual y Family extiende todo el set de funcionalidades a hogares de hasta 5 miembros con alertas avanzadas.",
	},
	{
		id: "FAQ-3",
		question: "¿Puedo usar BudgetApp fuera de Colombia?",
		answer:
			"La aplicación es global, pero las integraciones bancarias iniciarán en Colombia. Puedes registrar transacciones manuales desde cualquier país y pronto habilitaremos catálogos para México y Brasil.",
	},
	{
		id: "FAQ-4",
		question: "¿Qué tan rápido llegan las alertas?",
		answer:
			"Cuando sincronizamos transacciones desde el banco las evaluamos en segundos; si registras gastos manuales recalculamos tus KPIs al instante y notificamos por push, correo o WhatsApp según tus preferencias.",
	},
	{
		id: "FAQ-5",
		question: "¿Necesito instalar algo para probar la demo?",
		answer:
			"No. Regístrate desde el navegador, levanta la maqueta con `pnpm dev` si eres parte del equipo técnico o usa la versión desplegada para validar el flujo de onboarding, presupuestos y soporte.",
	},
];

export function Faqs() {
	return (
		<Box sx={{ bgcolor: "var(--mui-palette-background-level1)", py: "120px" }}>
			<Container maxWidth="md">
				<Stack spacing={8}>
					<Stack maxWidth="700px" sx={{ mx: "auto" }}>
						<Stack spacing={2}>
							<Box sx={{ display: "flex", justifyContent: "center" }}>
								<Chip color="primary" icon={<QuestionIcon />} label="FAQ" variant="soft" />
							</Box>
							<Typography sx={{ textAlign: "center" }} variant="h3">
								Preguntas frecuentes
							</Typography>
							<Typography color="text.secondary">
								¿Tienes otra duda? Escríbenos a{" "}
								<Box component="a" href="mailto:hola@budgetapp.test" sx={{ color: "inherit", textDecoration: "underline" }}>
									hola@budgetapp.test
								</Box>
								.
							</Typography>
						</Stack>
					</Stack>
					<Stack spacing={2}>
						{faqs.map((faq) => (
							<Faq key={faq.id} {...faq} />
						))}
					</Stack>
				</Stack>
			</Container>
		</Box>
	);
}

function Faq({ answer, question }) {
	const [isExpanded, setIsExpanded] = React.useState(false);

	return (
		<Card sx={{ p: 3 }}>
			<Stack
				onClick={() => {
					setIsExpanded((prevState) => !prevState);
				}}
				sx={{ cursor: "pointer" }}
			>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					<Typography variant="subtitle1">{question}</Typography>
					{isExpanded ? <CaretDownIcon /> : <CaretRightIcon />}
				</Stack>
				<Collapse in={isExpanded}>
					<Typography color="text.secondary" sx={{ pt: 3 }} variant="body2">
						{answer}
					</Typography>
				</Collapse>
			</Stack>
		</Card>
	);
}
