// some code is forked from https://github.com/ScuroGuardiano/curse-modpack-downloader/blob/master/cli.js
import { writableStreamFromWriter } from "https://deno.land/std@0.149.0/streams/mod.ts";
import {
  installForgeServer,
  writeEULA,
  writeRun,
  writeRunJVMArgs,
} from "./modules.ts";

export async function downloadModPack(url: string) {
  await fetch(`${url}`).then(async (res) => {
    const file = await Deno.open("modpack.zip", {
      write: true,
      create: true,
    });
    const writableStream = writableStreamFromWriter(file);
    await res.body!.pipeTo(writableStream);
  });

  console.log("Download complete");
  try {
    console.log("removing modpack folder");
    await Deno.remove("./modpack", { recursive: true });
  } catch (e) {
    console.log("No modpack folder ");
  }
  await Deno.run({
    cmd: ["unzip", "modpack.zip", "-d", "modpack"],
  }).status();
  console.log("Unzip complete");

  // flatten the folder structure
  if ([...Deno.readDirSync("modpack")].length == 1) {
    const dir = [...Deno.readDirSync("modpack")][0];
    for (const file of [...Deno.readDirSync(`modpack/${dir.name}`)]) {
      await Deno.rename(
        `modpack/${dir.name}/${file.name}`,
        `modpack/${file.name}`,
      );
    }
    await Deno.remove(`modpack/${dir.name}`);
  }

  for (const file of Deno.readDirSync("modpack")) {
    if (
      file.name.toLowerCase().startsWith("forge") &&
      file.name.includes("-installer") && file.name.endsWith(".jar") &&
      file.name.includes("1.18")
    ) {
      await installForgeServer(file.name);
      await writeRunJVMArgs();
      // remove folder Server-Files
      await Deno.remove(`modpack/${file.name}`);
      break;
    }
    if (
      (
        file.name.toLowerCase().startsWith("forge") ||
        file.name.startsWith("fabric-server")
      ) &&
      !file.name.includes("-installer") && file.name.endsWith(".jar")
    ) {
      const jarName = file.name;
      await writeRun(jarName);
      break;
    }
    if (
      file.name.toLowerCase().startsWith("forge") &&
      file.name.includes("-installer") && file.name.endsWith(".jar") &&
      !file.name.includes("1.18")
    ) {
      const jarName = file.name.replace("-installer", "");
      await installForgeServer(file.name);
      await writeRun(jarName);
      break;
    }
  }
  await writeEULA();
  await Deno.copyFile("Dockerfile", "modpack/Dockerfile");
}
if (import.meta.main) {
  await downloadModPack(Deno.args[0]);
}
