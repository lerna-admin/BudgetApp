import * as React from "react";

import { appConfig } from "@/config/app";
import { AdminOverview } from "@/components/dashboard/admin/admin-overview";

export const metadata = { title: `Overview | Admin | ${appConfig.name}` };

export default function Page() {
	return <AdminOverview />;
}
