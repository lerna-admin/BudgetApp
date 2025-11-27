"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CaretUpDownIcon } from "@phosphor-icons/react/dist/ssr/CaretUpDown";

import { usePopover } from "@/hooks/use-popover";
import { useUser } from "@/components/auth/user-context";
import { useWorkspace } from "@/components/workspace/workspace-context";

import { WorkspacesPopover } from "./workspaces-popover";

const PERSONAL_WORKSPACE = { value: "personal", name: "Personal", avatar: "/assets/workspace-avatar-1.png" };
const HOUSEHOLD_WORKSPACE = { value: "household", name: "Familiar", avatar: "/assets/workspace-avatar-2.png" };

export function WorkspacesSwitch() {
	const user = useUser();
	const { scope, setScope, hasHousehold } = useWorkspace();
	const popover = usePopover();

	if (!user || user.role !== "client") {
		return null;
	}

	const options = hasHousehold ? [PERSONAL_WORKSPACE, HOUSEHOLD_WORKSPACE] : [PERSONAL_WORKSPACE];
	const workspace = options.find((option) => option.value === scope) ?? options[0];

	return (
		<React.Fragment>
			<Stack
				direction="row"
				onClick={popover.handleOpen}
				ref={popover.anchorRef}
				spacing={2}
				sx={{
					alignItems: "center",
					border: "1px solid var(--Workspaces-border-color)",
					borderRadius: "12px",
					cursor: "pointer",
					p: "4px 8px",
				}}
			>
				<Avatar src={workspace.avatar} variant="rounded" />
				<Box sx={{ flex: "1 1 auto" }}>
					<Typography color="var(--Workspaces-title-color)" variant="caption">
						Modo
					</Typography>
					<Typography color="var(--Workspaces-name-color)" variant="subtitle2">
						{workspace.name}
					</Typography>
				</Box>
				<CaretUpDownIcon color="var(--Workspaces-expand-color)" fontSize="var(--icon-fontSize-sm)" />
			</Stack>
			<WorkspacesPopover
				anchorEl={popover.anchorRef.current}
				onChange={(workspaceValue) => {
					setScope(workspaceValue);
					popover.handleClose();
				}}
				onClose={popover.handleClose}
				open={popover.open}
				workspaces={options}
			/>
		</React.Fragment>
	);
}
