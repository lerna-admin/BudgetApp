"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export const defaultWorkspaces = [
	{ name: "Personal", avatar: "/assets/workspace-avatar-1.png", value: "personal" },
	{ name: "Familiar", avatar: "/assets/workspace-avatar-2.png", value: "household" },
];

export function WorkspacesPopover({ anchorEl, onChange, onClose, open = false, workspaces = defaultWorkspaces }) {
	return (
		<Menu
			anchorEl={anchorEl}
			anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			onClose={onClose}
			open={open}
			slotProps={{ paper: { sx: { width: "250px" } } }}
			transformOrigin={{ horizontal: "right", vertical: "top" }}
		>
			{workspaces.map((workspace) => (
				<MenuItem
					key={workspace.value ?? workspace.name}
					onClick={() => {
						onChange?.(workspace.value ?? workspace.name);
					}}
				>
					<ListItemAvatar>
						<Avatar src={workspace.avatar} sx={{ "--Avatar-size": "32px" }} variant="rounded" />
					</ListItemAvatar>
					{workspace.name}
				</MenuItem>
			))}
		</Menu>
	);
}
