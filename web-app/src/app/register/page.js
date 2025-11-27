import * as React from "react";

import { appConfig } from "@/config/app";
import { RegisterForm } from "./register-form";

export const metadata = { title: `Crear cuenta | ${appConfig.name}` };

export default async function Page() {
	return <RegisterForm />;
}
