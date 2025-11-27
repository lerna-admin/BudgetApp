"use client";

import * as React from "react";

import { useSettings } from "@/components/core/settings/settings-context";
import { CountryProvider } from "@/components/country/country-context";
import { UserProvider } from "@/components/auth/user-context";
import { HorizontalLayout } from "@/components/dashboard/layout/horizontal/horizontal-layout";
import { VerticalLayout } from "@/components/dashboard/layout/vertical/vertical-layout";
import { dashboardConfig } from "@/config/dashboard";
import { WorkspaceProvider } from "@/components/workspace/workspace-context";

function filterNavTree(items, role) {
	return items
		.map((item) => {
			const children = item.items ? filterNavTree(item.items, role) : undefined;
			const isAllowed = !item.roles || item.roles.includes(role);
			if (children) {
				const next = { ...item, items: children };
				if (next.items.length > 0) {
					return next;
				}
				return isAllowed ? { ...next, items: [] } : null;
			}
			return isAllowed ? item : null;
		})
		.filter(Boolean);
}

function filterNavGroups(groups, role) {
	return groups
		.map((group) => {
			const items = filterNavTree(group.items ?? [], role);
			if (items.length === 0) {
				return null;
			}
			return { ...group, items };
		})
		.filter(Boolean);
}

export function DashboardShell({ user, ...props }) {
	const { settings } = useSettings();
	const layout = settings.dashboardLayout ?? dashboardConfig.layout;
	const LayoutComponent = layout === "horizontal" ? HorizontalLayout : VerticalLayout;
	const role = user?.role ?? "client";
	const navItems = React.useMemo(() => filterNavGroups(dashboardConfig.navItems, role), [role]);

	return (
		<UserProvider value={user}>
			<WorkspaceProvider>
				<CountryProvider>
					<LayoutComponent {...props} navItems={navItems} />
				</CountryProvider>
			</WorkspaceProvider>
		</UserProvider>
	);
}
