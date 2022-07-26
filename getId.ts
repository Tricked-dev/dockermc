// some code is forked from https://github.com/ScuroGuardiano/curse-modpack-downloader/blob/master/cli.js
import { writableStreamFromWriter } from "https://deno.land/std@0.149.0/streams/mod.ts";
const API_URL = "https://api.curseforge.com";

const jvm_args = () => `
-Xms\${MODPACK_RAM}G \
-Xmx\${MODPACK_RAM}G \
-Xmn96M \
-XX:UseSSE=3 \
-Dsun.rmi.dgc.server.gcInterval=2147483646 \
-XX:MaxGCPauseMillis=50 \
-XX:G1HeapRegionSize=32M \
-XX:SurvivorRatio=16 \
-Xnoclassgc \
-XX:+UseG1GC \
-XX:+ParallelRefProcEnabled \
-XX:+UnlockExperimentalVMOptions \
-XX:+DisableExplicitGC \
-XX:+AlwaysPreTouch \
-XX:G1NewSizePercent=30 \
-XX:G1MaxNewSizePercent=40 \
-XX:G1ReservePercent=20 \
-XX:G1HeapWastePercent=5 \
-XX:G1MixedGCCountTarget=4 \
-XX:InitiatingHeapOccupancyPercent=15 \
-XX:G1MixedGCLiveThresholdPercent=90 \
-XX:G1RSetUpdatingPauseTimePercent=5 \
-XX:+PerfDisableSharedMem \
-XX:MaxTenuringThreshold=1 \
`;

const run_file = (jarName: string) => `
java \
${jvm_args()}
-jar ${jarName} nogui "$@"
`;

async function getProjectBySlug(projectSlug: string) {
  const res = await fetch(
    `${API_URL}/v1/mods/${projectSlug}`,
    {
      headers: {
        "x-api-key":
          "$2a$10$Kf2u9btbptI1/oXuVxZEf.6j/0F03KOR77vwlZc.xES.EXood2wuC",
      },
    },
  ).then(async (res) => await res.json());
  const serverVersion = res.data.latestFiles.find((x) => x.serverPackFileId);
  if (!serverVersion) {
    throw new Error(`No server version found for ${projectSlug}`);
  }
  console.log(`Downloading file ${serverVersion.fileName}`);
  const dl = await fetch(
    `${API_URL}/v1/mods/${projectSlug}/files/${serverVersion.serverPackFileId}/download-url`,
    {
      headers: {
        "x-api-key":
          "$2a$10$Kf2u9btbptI1/oXuVxZEf.6j/0F03KOR77vwlZc.xES.EXood2wuC",
      },
    },
  );
  const url = await dl.json();
  // await fetch(`${url.data}`).then(async (res) => {
  // const file = await Deno.open("modpack.zip", { write: true, create: true });
  // const writableStream = writableStreamFromWriter(file);
  // await res.body!.pipeTo(writableStream);
  // });
  console.log("Download complete");
  try {
    console.log("removing modpack folder");
    await Deno.remove("./modpack", { recursive: true });
  } catch (e) {
    console.log("No modpack folder ");
  }
  // await Deno.run({
  // cmd: ["unzip", "modpack.zip", "-d", "modpack"],
  // }).status();
  console.log("Unzip complete");
  let jarName = "";
  for (const file of Deno.readDirSync("modpack")) {
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
      await Deno.run({
        cmd: `java -jar ${installerName} --installServer`.split(" "),
        cwd: `modpack`,
      }).status();
      await Deno.writeTextFile(
        `modpack/user_jvm_args.txt`,
        jvm_args(),
      );
      await Deno.remove(`modpack/${file.name}`);
    }
    if (
      file.name.toLowerCase().startsWith("forge") && file.name.endsWith(".jar")
    ) {
      jarName = file.name;
      console.log("Forge detected renaming file");
      Deno.writeFile("modpack/eula.txt", new TextEncoder().encode("eula=true"));
      console.log("Added eula=true to eula.txt");
      await Deno.writeFile(
        "modpack/run.sh",
        new TextEncoder().encode(run_file(jarName)),
        {
          mode: 0o755,
        },
      );
      break;
    }
  }

  // await Deno.chmod("modpack/run.sh", 0o755);
}
await getProjectBySlug(Deno.args[0]);
