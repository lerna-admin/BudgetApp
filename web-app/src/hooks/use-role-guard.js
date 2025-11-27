"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useUser } from "@/components/auth/user-context";
import { paths } from "@/paths";

export function useRoleGuard(allowedRoles = [], options = {}) {
	const user = useUser();
	const router = useRouter();
	const role = user?.role ?? null;
	const hasAccess = useMemo(() => (role ? allowedRoles.includes(role) : false), [allowedRoles, role]);

	useEffect(() => {
		if (!role) {
			return;
		}
		if (!hasAccess) {
			const fallback =
				options.fallback ??
				(role === "admin" ? paths.dashboard.admin.overview : paths.dashboard.overview);
			router.replace(fallback);
		}
	}, [hasAccess, options.fallback, role, router]);

	return hasAccess;
}
