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
  for (const file of Deno.readDirSync("modpack")) {
    // RAD
    if (file.name.includes("RAD")) {
      let forgeName = "";
      for (const f of Deno.readDirSync(`modpack/${file.name}`)) {
        if (f.name.includes("forge") && f.name.endsWith(".jar")) {
          forgeName = f.name;
        }
        await Deno.rename(
          `modpack/${file.name}/${f.name}`,
          `modpack/${f.name}`,
        );
      }

      await writeRun(forgeName);
      break;
    }
    // pixelmon
    if (file.name == "serverpack" || file.name.includes("StoneBlock")) {
      let installerName = "";
      for (const f of Deno.readDirSync(`modpack/${file.name}`)) {
        if (f.name.includes("installer") && f.name.endsWith(".jar")) {
          installerName = f.name;
        }
        await Deno.rename(
          `modpack/${file.name}/${f.name}`,
          `modpack/${f.name}`,
        );
      }
      const name = installerName.replace("-installer", "");

      await installForgeServer(installerName);
      await writeRun(name);
      break;
    }
    // ATM7 does it this way
    if (file.name.includes("Server-Files")) {
      let installerName = "";
      for (const f of Deno.readDirSync(`modpack/${file.name}`)) {
        if (f.name.includes("installer") && f.name.endsWith(".jar")) {
          installerName = f.name;
        }
        await Deno.rename(
          `modpack/${file.name}/${f.name}`,
          `modpack/${f.name}`,
        );
      }
      await installForgeServer(installerName);
      await writeRunJVMArgs();
      // remove folder Server-Files
      await Deno.remove(`modpack/${file.name}`);
      break;
    }
    // NTC2/ATM6
    if (
      file.name.toLowerCase().startsWith("forge") &&
      !file.name.includes("-installer") && file.name.endsWith(".jar")
    ) {
      const jarName = file.name;
      await writeRun(jarName);
      break;
    }
    // VH
    if (
      file.name.toLowerCase().startsWith("forge") &&
      file.name.includes("-installer") && file.name.endsWith(".jar")
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
