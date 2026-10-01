#!/usr/bin/env bash
# Verifies the mechanically checkable rules from AGENTS.md. Run locally and in CI.
set -u
fail=0

# check <description> <extended-regex> <grep args...>
check() {
    local desc="$1" pattern="$2"
    shift 2
    local out
    out=$(grep -rnE "$pattern" "$@" --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null || true)
    if [ -n "$out" ]; then
        echo "✗ $desc"
        echo "$out"
        echo
        fail=1
    fi
}

check "active: boolean must not be reintroduced" 'active\??:\s*boolean' src --include='*.ts' --include='*.tsx'
check "Placeholders must be placeholder:text-gray-400" 'placeholder:text-gray-[5-9]00' src --include='*.ts' --include='*.tsx'
check "'Faith Forge' must not appear in user-facing locale strings" 'Faith Forge' src/locales
check "DaisyUI / React-Vant are forbidden" 'daisyui|react-vant' package.json

# New createAsyncThunk in staged changes (skipped when nothing is staged / not a git repo)
if git rev-parse --git-dir >/dev/null 2>&1; then
    added=$(git diff --cached -U0 -- 'src/*.ts' 'src/*.tsx' 2>/dev/null | grep -E '^\+.*createAsyncThunk' || true)
    if [ -n "$added" ]; then
        echo "✗ New createAsyncThunk detected in staged changes; use RTK Query instead"
        echo "$added"
        echo
        fail=1
    fi
fi

[ "$fail" -eq 0 ] && echo "✓ All AI rule checks passed"
exit $fail
