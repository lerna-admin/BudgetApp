"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { UsersIcon } from "@phosphor-icons/react/dist/ssr/Users";
import useEmblaCarousel from "embla-carousel-react";

const reviews = [
	{
		id: "REV-5",
		author: "Laura P. · Líder de CX en fintech",
		comment:
			"Con BudgetApp duplicamos la adopción del plan familiar. El dashboard ya trae KPIs y alertas, así que sólo enfocamos al equipo en soporte y contenidos.",
	},
	{
		id: "REV-4",
		author: "Diego R. · Consultor financiero",
		comment:
			"Mis clientes aterrizan su presupuesto en minutos. Registran gastos, ven porcentajes de participación y yo recibo tickets cuando necesitan ajustes.",
	},
	{
		id: "REV-3",
		author: "Sara M. · Emprendedora remota",
		comment:
			"La integración bancaria me recuerda en qué tarjeta estoy gastando de más y las alertas predictivas me ayudan a frenar antes de romper el presupuesto.",
	},
	{
		id: "REV-2",
		author: "Camilo V. · Padre de familia",
		comment:
			"Pasamos de tener hojas de cálculo a usar BudgetApp para todo: asignamos porcentajes a cada quien y nos avisa cuando un rubro se sale de control.",
	},
	{
		id: "REV-1",
		author: "Ana M. · CFO de startup",
		comment:
			"Lo usamos como plantilla de gobernanza financiera: un mismo stack para onboarding, pricing y alertas. Integrar nuevos países es tan simple como actualizar el catálogo.",
	},
];

export function Testimonails() {
	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
	const [prevBtnDisabled, setPrevBtnDisabled] = React.useState(true);
	const [nextBtnDisabled, setNextBtnDisabled] = React.useState(true);
	const [selectedIndex, setSelectedIndex] = React.useState(0);
	const [scrollSnaps, setScrollSnaps] = React.useState([]);

	const scrollPrev = React.useCallback(() => {
		emblaApi?.scrollPrev();
	}, [emblaApi]);

	const scrollNext = React.useCallback(() => {
		emblaApi?.scrollNext();
	}, [emblaApi]);

	const scrollTo = React.useCallback(
		(index) => {
			emblaApi?.scrollTo(index);
		},
		[emblaApi]
	);

	const onInit = React.useCallback((api) => {
		setScrollSnaps(api.scrollSnapList());
	}, []);

	const onSelect = React.useCallback((api) => {
		setSelectedIndex(api.selectedScrollSnap());
		setPrevBtnDisabled(!api.canScrollPrev());
		setNextBtnDisabled(!api.canScrollNext());
	}, []);

	React.useEffect(() => {
		if (!emblaApi) return;

		onInit(emblaApi);
		onSelect(emblaApi);
		emblaApi.on("reInit", onInit);
		emblaApi.on("reInit", onSelect);
		emblaApi.on("select", onSelect);
	}, [emblaApi, onInit, onSelect]);

	return (
		<Box
			sx={{
				bgcolor: "var(--mui-palette-background-level1)",
				borderTop: "1px solid var(--mui-palette-divider)",
				pt: "120px",
			}}
		>
			<Container maxWidth="md">
				<Stack spacing={8}>
					<Stack spacing={2}>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<Chip color="primary" icon={<UsersIcon />} label="Features" variant="soft" />
						</Box>
						<Typography sx={{ textAlign: "center" }} variant="h3">
							What are people saying
						</Typography>
					</Stack>
					<Stack spacing={3} sx={{ "--slide-spacing": "1rem", "--slide-size": "100%", "--slide-height": " 300px" }}>
						<Box ref={emblaRef} sx={{ overflow: "hidden" }}>
							<Box
								sx={{
									backfaceVisibility: "hidden",
									display: "flex",
									touchAction: "pan-y",
									ml: "calc(var(--slide-spacing) * -1)",
								}}
							>
								{reviews.map((review) => (
									<Stack
										key={review.id}
										spacing={2}
										sx={{
											flex: "0 0 var(--slide-size)",
											minWidth: 0,
											pl: "var(--slide-spacing)",
											position: "relative",
										}}
									>
										<Typography color="text.secondary" sx={{ textAlign: "center" }}>
											{review.comment}
										</Typography>
										<Typography sx={{ textAlign: "center" }}>{review.author}</Typography>
									</Stack>
								))}
							</Box>
						</Box>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
							<IconButton disabled={prevBtnDisabled} onClick={scrollPrev}>
								<CaretLeftIcon />
							</IconButton>
							<Stack direction="row" spacing={1} sx={{ flex: "1 1 auto", justifyContent: "center" }}>
								{scrollSnaps.map((_, index) => (
									<Box
										key={index}
										onClick={() => {
											scrollTo(index);
										}}
										sx={{
											bgcolor:
												index === selectedIndex
													? "var(--mui-palette-primary-main)"
													: "var(--mui-palette-action-selected)",
											borderRadius: "50%",
											cursor: "pointer",
											height: "8px",
											mx: "0.25rem",
											width: "8px",
										}}
									/>
								))}
							</Stack>
							<IconButton disabled={nextBtnDisabled} onClick={scrollNext}>
								<CaretRightIcon />
							</IconButton>
						</Stack>
					</Stack>
				</Stack>
			</Container>
		</Box>
	);
}
