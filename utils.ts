export const jvm_args = () =>
  `-Xms\${MODPACK_RAM}G \
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

export const run_file = (jarName: string) => `
java \
${jvm_args()} \
-jar ${jarName} nogui "$@"
`;
