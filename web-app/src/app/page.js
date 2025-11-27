import * as React from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import MarketingLayout from "./(marketing)/layout";
import MarketingHome, { metadata as marketingMetadata } from "./(marketing)/page";

export const metadata = marketingMetadata;

export default async function Page() {
	const user = await getCurrentUser();
	if (user) {
		redirect("/dashboard");
	}

	return (
		<MarketingLayout>
			<MarketingHome />
		</MarketingLayout>
	);
}
