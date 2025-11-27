"use client";

import * as React from "react";

import { useUser } from "@/components/auth/user-context";

const WorkspaceContext = React.createContext({
	scope: "personal",
	setScope: () => {},
	hasHousehold: false,
});

export function WorkspaceProvider({ children }) {
	const user = useUser();
	const hasHousehold = Boolean(user?.householdMemberships?.length);
	const initialScope = hasHousehold ? "household" : "personal";
	const [scope, setScope] = React.useState(initialScope);

	React.useEffect(() => {
		setScope(hasHousehold ? "household" : "personal");
	}, [hasHousehold]);

	const value = React.useMemo(
		() => ({
			scope,
			setScope,
			hasHousehold,
		}),
		[scope, hasHousehold],
	);

	return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
	return React.useContext(WorkspaceContext);
}
