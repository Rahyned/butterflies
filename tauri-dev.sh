#!/usr/bin/env bash
export PATH="$HOME/.cargo/bin:/c/msys64/mingw64/bin:/c/msys64/usr/bin:$PATH"
export TMP="$HOME/tmp"
export TEMP="$HOME/tmp"
exec npx tauri dev "$@"
