"use client";

import * as React from "react";

const UserContext = React.createContext(null);

export function UserProvider({ value, children }) {
	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
	return React.useContext(UserContext);
}
