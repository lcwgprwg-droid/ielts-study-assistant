#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
target_dir="$HOME/.codex/skills"
mkdir -p "$target_dir"
ln -sfn "$project_dir" "$target_dir/ielts-study-assistant"
echo "Installed: $target_dir/ielts-study-assistant -> $project_dir"
