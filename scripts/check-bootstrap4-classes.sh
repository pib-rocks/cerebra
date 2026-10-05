#!/bin/sh
# Fails when a Bootstrap 4 class name reappears under src/. Cerebra runs
# Bootstrap 5; PR-1913 renamed the last Bootstrap 4 names and deleted the
# compat stylesheet that gave them meaning, so any hit here is unstyled markup.
# Bootstrap 5 forms: ms-/me-/ps-/pe-, text-start/end, fw-bold, float-start/end,
# btn-close, mb-3, form-check/form-switch/form-select, text-bg-*, g-0, d-none,
# input-group-text.
pattern='\b(m[lr]|p[lr])-(sm-|md-|lg-|xl-|xxl-)?(n?[0-9]|auto)\b'
pattern="$pattern"'|\btext-(left|right)\b'
pattern="$pattern"'|\bfont-weight-(bold|normal|light|bolder|lighter)\b'
pattern="$pattern"'|\bfloat-(left|right)\b'
pattern="$pattern"'|class="close( |")'
pattern="$pattern"'|\bform-group\b'
pattern="$pattern"'|\bcustom-(control|checkbox|select|file|switch|radio|range)\b'
pattern="$pattern"'|\bbadge-(primary|secondary|success|danger|warning|info|light|dark|pill)\b'
pattern="$pattern"'|\bno-gutters\b'
pattern="$pattern"'|\binput-group-(append|prepend)\b'
pattern="$pattern"'|class="([^"]* )?hidden( [^"]*)?"'

if grep -rnE --include='*.html' --include='*.ts' --include='*.scss' --include='*.css' "$pattern" src/; then
    echo "Bootstrap 4 class names found in src/ (see above)." >&2
    exit 1
fi
echo "No Bootstrap 4 class names in src/."
