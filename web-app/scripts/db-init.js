import {
	ensureCountriesSeeded,
	ensureUsersSeeded,
	ensureHouseholdsSeeded,
	ensureBudgetsSeeded,
	ensureTicketsSeeded,
} from "../src/lib/db.js";

function main() {
	ensureCountriesSeeded();
	ensureUsersSeeded();
	ensureHouseholdsSeeded();
	ensureBudgetsSeeded();
	ensureTicketsSeeded();
	console.log("Base de datos SQLite inicializada en var/data/budgetapp.sqlite");
}

main();
