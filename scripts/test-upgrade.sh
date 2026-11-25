#!/usr/bin/env bash
# Run on an empty, disposable Android emulator. Both app packages and the probe must share a signer.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${OLD_APK:?}" "${NEW_APK:?}" "${TEST_KEYSTORE:?}" "${TEST_STORE_PASS:?}"
bt="${ANDROID_BUILD_TOOLS:-${ANDROID_HOME:?}/build-tools/35.0.0}"
platform="${ANDROID_PLATFORM_JAR:-${ANDROID_HOME}/platforms/android-35/android.jar}"
device="${ANDROID_SERIAL:?Select a dedicated emulator}"
adb=(adb -s "$device")
[[ $("${adb[@]}" shell getprop ro.kernel.qemu 2>/dev/null | tr -d '\r') == 1 ]] || { echo 'A disposable emulator is required'; exit 1; }
if "${adb[@]}" shell pm list packages | tr -d '\r' | grep -qx 'package:com.wordleaf.study';then echo "Use a clean emulator";exit 1;fi
mkdir -p build
stage=$(mktemp -d build/probe.XXXXXX)
trap 'rm -rf "$stage"' EXIT
mkdir "$stage/classes"
javac --release 8 -cp "$platform" -d "$stage/classes" tests/android/UpgradeProbe.java
jar cf "$stage/classes.jar" -C "$stage/classes" .
java -cp "$bt/lib/d8.jar" com.android.tools.r8.D8 --lib "$platform" --min-api 26 --output "$stage" "$stage/classes.jar"
"$bt/aapt2" link --manifest tests/android/AndroidManifest.xml -I "$platform" -o "$stage/probe.apk"
jar uf "$stage/probe.apk" -C "$stage" classes.dex
"$bt/zipalign" -f 4 "$stage/probe.apk" "$stage/probe-aligned.apk"
java -jar "$bt/lib/apksigner.jar" sign --ks "$TEST_KEYSTORE" --ks-pass env:TEST_STORE_PASS --out "$stage/test.apk" "$stage/probe-aligned.apk"
run_probe(){
 "${adb[@]}" shell am instrument -w -e phase "$1" com.wordleaf.probe/.UpgradeProbe | tr -d '\r' > "$stage/$1.txt"
 cat "$stage/$1.txt"
 grep -q 'status=PASS' "$stage/$1.txt"
}
"${adb[@]}" install "$OLD_APK"
"${adb[@]}" install "$stage/test.apk"
run_probe seed
"${adb[@]}" install -r "$NEW_APK"
run_probe verify
diff <(grep 'snapshot=' "$stage/seed.txt") <(grep 'snapshot=' "$stage/verify.txt")
echo 'Upgrade preserved the snapshot and the next flashcard.'
