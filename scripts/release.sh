#!/bin/sh
# release.sh: from main, does what's left of the release: the checks, npm, waiting for it, a clean install from it, the tag

. "$(dirname "$0")/lib.sh"

# release: does what's left, from main
release() {
    guard || return 1

    if [ "$(state)" = released ]; then
        echo "$(version): released, nothing to release"
        return 0
    fi

    check || return 1

    # npm takes a version once, so publish only what isn't there, and check the install from it before the tag
    if ! listed "$(version)"; then
        make publish || return 1
        wait_for || return 1
        make verify || return 1
    fi

    make tag || return 1

    echo "$(package) $(version) released"
}

release
