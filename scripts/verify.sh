#!/bin/sh
# verify.sh: installs the version from npm in a clean container and checks it's the one. It tries again while the registry
# catches up: the package page npm install reads can lag behind the version page wait_for checks.

. "$(dirname "$0")/lib.sh"

tries=0

while true; do
    docker run --rm node:22-alpine sh -c "mkdir /opt/consumer && cd /opt/consumer && npm init -y > /dev/null && \
npm install --no-audit --no-fund $(package)@$(version) && \
node -e \"const D = require('$(package)'); if (!D.Application) process.exit(1); console.log('installed', '$(package)', '$(version)', Object.keys(D).length, 'exports')\"" && exit 0
    tries=$((tries + 1))
    if [ "$tries" -ge "$WAIT_TRIES" ]; then
        echo "$(package) $(version) could not be installed from npm" >&2
        exit 1
    fi
    sleep "$WAIT_DELAY"
done
