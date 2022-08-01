import { jvm_args, run_file } from "./utils.ts";

export const writeEULA = () =>
  Deno.writeFile("modpack/eula.txt", new TextEncoder().encode("eula=true"));

const cleanupInstaller = async (name: string) => {
  await Deno.remove(`modpack/${name}`);
  await Deno.remove(`modpack/${name}.log`);
};

export const installForgeServer = async (name: string) => {
  await Deno.run({
    cmd: `java -jar ${name} --installServer`.split(" "),
    cwd: `modpack`,
  }).status();
  await cleanupInstaller(name);
};

export const writeRun = async (name: string) => {
  await Deno.writeFile(
    "modpack/run.sh",
    new TextEncoder().encode(run_file(name)),
    {
      mode: 0o755,
    },
  );
};
