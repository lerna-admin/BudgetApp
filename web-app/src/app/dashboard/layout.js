import * as React from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function Layout(props) {
	const user = await getCurrentUser();
	if (!user) {
		redirect("/login");
	}
	return <DashboardShell {...props} user={user} />;
}
