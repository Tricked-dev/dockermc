// some code is forked from https://github.com/ScuroGuardiano/curse-modpack-downloader/blob/master/cli.js
import { writableStreamFromWriter } from "https://deno.land/std@0.149.0/streams/mod.ts";
import {
  installForgeServer,
  writeEULA,
  writeRun,
  writeRunJVMArgs,
} from "./modules.ts";
const API_URL = "https://api.curseforge.com";

function headers() {
  return {
    "x-api-key": "$2a$10$Kf2u9btbptI1/oXuVxZEf.6j/0F03KOR77vwlZc.xES.EXood2wuC",
  };
}

async function getProjectBySlug(projectSlug: string) {
  const res = await fetch(
    `${API_URL}/v1/mods/${projectSlug}`,
    {
      headers: headers(),
    },
  ).then(async (res) => await res.json());
  const serverVersion = res.data.latestFiles.find((
    x: { serverPackFileId: any },
  ) => x.serverPackFileId);
  if (!serverVersion) {
    throw new Error(`No server version found for ${projectSlug}`);
  }
  console.log(`Downloading file ${serverVersion.fileName}`);
  const dl = await fetch(
    `${API_URL}/v1/mods/${projectSlug}/files/${serverVersion.serverPackFileId}/download-url`,
    {
      headers: headers(),
    },
  );
  console.log(`DL status ${dl.status} ${dl.statusText}`);
  const url = await dl.json();
  if (Deno.args[1] != "no") {
    await fetch(`${url.data}`).then(async (res) => {
      const file = await Deno.open("modpack.zip", {
        write: true,
        create: true,
      });
      const writableStream = writableStreamFromWriter(file);
      await res.body!.pipeTo(writableStream);
    });
  }
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
  // await Deno.chmod("modpack/run.sh", 0o755);
}
await getProjectBySlug(Deno.args[0]);
