#!/bin/bash
# tests/test_welcome.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5173}"

cleanup() {
    agent-browser close 2>/dev/null || true
}
trap cleanup EXIT

agent-browser open "$BASE_URL"
sleep 1

# Check login page renders
agent-browser snapshot -c | grep -q "Connect with Spotify"

# Verify window state
STATE=$(agent-browser eval "window.appState?.initialized" 2>/dev/null)
[ "$STATE" = "true" ] && echo "  [PASS] App state initialized"

echo "PASS: Login page loads successfully"
