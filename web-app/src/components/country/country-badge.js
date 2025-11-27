"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useCountry } from "@/components/country/country-context";

export function CountryBadge({ showProvider = false, size = "medium" }) {
	const { country } = useCountry();

	if (!country) {
		return null;
	}

	return (
		<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
			<Chip label={`${country.name} · ${country.currency}`} size={size} />
			{showProvider && country.provider ? (
				<Chip color="primary" label={country.provider} size={size} variant="outlined" />
			) : null}
			{country.timezone ? (
				<Box>
					<Typography color="text.secondary" variant="caption">
						Huso: {country.timezone}
					</Typography>
				</Box>
			) : null}
		</Stack>
	);
}
