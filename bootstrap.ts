// deno-lint-ignore-file no-explicit-any
const API_URL = "https://api.curseforge.com";
const PREFIX = "modpack";
const USERNAME = "tricked";

function headers() {
  return {
    "x-api-key": "$2a$10$Kf2u9btbptI1/oXuVxZEf.6j/0F03KOR77vwlZc.xES.EXood2wuC",
  };
}

const buildPack = async (id: string, version: string, publish?: boolean) => {
  const res = await fetch(
    `${API_URL}/v1/mods/${id}`,
    {
      headers: headers(),
    },
  ).then(async (res) => await res.json());

  const links: string[] = [];

  const flameLinks = res?.data?.links;

  if (flameLinks?.websiteUrl) {
    links.push(`[Website](${flameLinks.websiteUrl})`);
  }
  if (flameLinks?.issuesUrl) {
    links.push(`[Issues](${flameLinks.issuesUrl})`);
  }
  if (flameLinks?.sourceUrl) {
    links.push(`[Source](${flameLinks.sourceUrl})`);
  }

  await Deno.writeTextFile("out.json", JSON.stringify(res, null, 2));

  const serverVersion = res.data.latestFiles.find((
    x: { serverPackFileId: any },
  ) => x.serverPackFileId);

  if (!serverVersion) {
    throw new Error(`No server version found for ${id}`);
  }
  console.log(`bootstrapping ${serverVersion.fileName}`);
  const dl = await fetch(
    `${API_URL}/v1/mods/${id}/files/${serverVersion.serverPackFileId}/download-url`,
    {
      headers: headers(),
    },
  );
  console.log(`DL status ${dl.status} ${dl.statusText}`);
  const url = await dl.json();
  try {
    await Deno.remove(PREFIX, { recursive: true });
    await Deno.mkdir(PREFIX);
  } catch (_) {
    // pass
  }

  const docker = await Deno.readTextFile("Dockerfile");
  await Deno.writeTextFile(
    `${PREFIX}/Dockerfile`,
    docker.replace("@id", url.data).replace("@version", version),
  );

  await Deno.writeTextFile(
    `${PREFIX}/install.ts`,
    [
      `import { downloadModPack } from "./mod.ts";`,
      `await downloadModPack("${url.data}");`,
    ]
      .join(""),
    {
      mode: 0o755,
    },
  );
  await Deno.copyFile("mod.ts", `${PREFIX}/mod.ts`);
  await Deno.copyFile("utils.ts", `${PREFIX}/utils.ts`);
  await Deno.copyFile("modules.ts", `${PREFIX}/modules.ts`);
  await Deno.writeTextFile(
    `${PREFIX}/start.sh`,
    `#!/bin/bash

mkdir modpack

export DENO_INSTALL="/data/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"

if [ -f "./modpack/run.sh" ]; then
    cd modpack
    ./run.sh
else 
    deno run -A --unstable install.ts
    cd modpack
    ./run.sh
fi
  `,
    {
      mode: 0o755,
    },
  );

  const { summary, slug, name, logo } = res.data;

  const replacers = [
    ["links", links.map((x) => "* " + x).join("\n")],
    ["name", name],
    ["icon", logo.url],
    ["desc", summary],
    ["slug", slug],
    ["date", serverVersion.fileDate],
    ["id", id],
  ];

  let readme = await Deno.readTextFile("README_PACK.md");
  for (const [key, value] of replacers) {
    readme = readme.replaceAll(`@${key}`, value);
  }
  await Deno.writeTextFile(`${PREFIX}/README.md`, readme);
  const publoosh = publish != undefined
    ? publish
    : prompt("Publish? (y/n)") === "y";
  if (publoosh) {
    console.log("BUILDING");
    await Deno.run({
      cmd: `docker build -t ${slug} modpack/`.split(" "),
    }).status();
    console.log("LISTING IMAGES");
    await Deno.run({
      cmd: `docker images`.split(" "),
      pwd: "modpack",
    }).status();
    console.log("PUSHING");
    await Deno.run({
      cmd: [`docker`, `image`, `tag`, slug, `${USERNAME}/${slug}`],
      pwd: "modpack",
    }).status();
    console.log([`docker`, `push`, `${USERNAME}/${slug}`].join(" "));
    await Deno.run({
      cmd: [`docker`, `push`, `${USERNAME}/${slug}`],
      pwd: "modpack",
    }).status();
    console.log("PUSHING README");
    await Deno.run({
      cmd: [
        `docker`,
        `pushrm`,
        `${USERNAME}/${slug}`,
        `-f`,
        `modpack/README.md`,
        `-s`,
        `${summary.slice(0, 100)}`,
      ],
    }).status();
  }
};

if (import.meta.main) {
  const id = Deno.args[0];
  const version = Deno.args[1] == "17" ? "17" : "8";

  await buildPack(id, version);
}
