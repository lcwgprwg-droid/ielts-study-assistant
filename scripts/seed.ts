import { ensureSeed, dashboard } from "../src/lib/study";

ensureSeed();
console.log(JSON.stringify(dashboard().metrics, null, 2));
