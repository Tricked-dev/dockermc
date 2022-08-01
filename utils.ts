export const jvm_args = () =>
  `-Xms\${RAM} \
-Xmx\${RAM} \
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
const HEADER = `#!/bin/bash

RAM="\${MODPACK_RAM:=2g}"
FLAGS="\${OPTS:="${jvm_args()}"}"

if ! [[ "$EULA" = "false" ]]; then
	echo "eula=true" > eula.txt
fi
`;

export const run_file = (jarName: string) =>
  `${HEADER}

java $FLAGS -jar ${jarName} nogui "$@"`;

export const java18 = async () => {
  const run = await Deno.readTextFile("modpack/run.sh");
  const res = run.match(/@libraries.*txt/g)?.[0];
  if (!res) return;

  await Deno.writeTextFile(
    "modpack/run.sh",
    `${HEADER}

java $FLAGS ${res} "$@"`,
    { mode: 0o755 },
  );

  await Deno.remove("modpack/user_jvm_args.txt");
};
