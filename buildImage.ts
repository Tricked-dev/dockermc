import { config } from "https://deno.land/std@0.149.0/dotenv/mod.ts";

console.log(await config({ export: true }));
