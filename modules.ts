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

export const writeRunJVMArgs = async () => {
  let run = await Deno.readTextFile("modpack/run.sh");
  run = run.replace("@user_jvm_args.txt", jvm_args());
  await Deno.writeTextFile("modpack/run.sh", run, { mode: 0o755 });
  await Deno.remove("modpack/user_jvm_args.txt");
};
