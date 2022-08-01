import {
  parse,
  stringify,
} from "https://deno.land/std@0.150.0/encoding/toml.ts";
import { buildPack } from "./bootstrap.ts";
await Deno.readTextFile("packs.toml");

//@ts-ignore -
const packs: Record<string, { id: string; jvm: string; date: string }> = parse(
  await Deno.readTextFile("packs.toml"),
);

for (const [k, v] of Object.entries(packs)) {
  const res = await buildPack(v.id, v.jvm, true, v.date);
  if (typeof res == "string") {
    packs[k] = {
      ...v,
      date: res,
    };
  }
}
await Deno.writeTextFile("packs.toml", stringify(packs));
