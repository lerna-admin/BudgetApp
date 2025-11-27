"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
	const router = useRouter();
	const [loading, setLoading] = React.useState(false);

	async function handleLogout() {
		setLoading(true);
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			router.replace("/login");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Button onClick={handleLogout} size="small" variant="outlined" disabled={loading}>
			{loading ? "Saliendo..." : "Cerrar sesión"}
		</Button>
	);
}
