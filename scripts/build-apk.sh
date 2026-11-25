#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
tools="${ANDROID_BUILD_TOOLS:-${ANDROID_HOME:?Set ANDROID_HOME}/build-tools/35.0.0}"
platform="${ANDROID_PLATFORM_JAR:-${ANDROID_HOME}/platforms/android-35/android.jar}"
mkdir -p build
stage=$(mktemp -d build/apk.XXXXXX)
trap 'rm -rf "$stage"' EXIT
mkdir "$stage/classes"
"$tools/aapt2" compile --dir android/res -o "$stage/resources.zip"
"$tools/aapt2" link -o "$stage/base.apk" --manifest android/AndroidManifest.xml -I "$platform" -A web "$stage/resources.zip"
javac --release 8 -classpath "$platform" -d "$stage/classes" android/src/com/wordleaf/study/*.java
jar cf "$stage/classes.jar" -C "$stage/classes" .
java -cp "$tools/lib/d8.jar" com.android.tools.r8.D8 --min-api 26 --lib "$platform" --output "$stage" "$stage/classes.jar"
python3 - "$stage" <<'PY'
import pathlib, sys, zipfile
stage = pathlib.Path(sys.argv[1])
with zipfile.ZipFile(stage / "base.apk", "a") as apk:
    apk.write(stage / "classes.dex", "classes.dex", compress_type=zipfile.ZIP_DEFLATED)
PY
"$tools/zipalign" -f 4 "$stage/base.apk" build/wordleaf-unsigned.apk
