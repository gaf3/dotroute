# shellcheck shell=sh
# Shared by the release scripts, source it: . "$(dirname "$0")/lib.sh"
# NPM_URL, WAIT_TRIES and WAIT_DELAY can be set to point at another registry or wait less or longer.

NPM_URL=${NPM_URL:-https://registry.npmjs.org}
WAIT_TRIES=${WAIT_TRIES:-180}
WAIT_DELAY=${WAIT_DELAY:-10}

# the name on npm, and the version being worked on
package() {
    grep -m1 '"name"' package.json | cut -d'"' -f4
}

version() {
    cat VERSION
}

# listed version [name]: whether the registry has the version of the package (or another), it lags
listed() {
    curl -sfL -o /dev/null "$NPM_URL/${2:-$(package)}/$1"
}

# wait_for: waits for the version to show up on the registry, it lags for minutes after a publish
wait_for() {
    tries=0
    while [ "$tries" -lt "$WAIT_TRIES" ]; do
        if listed "$(version)"; then
            echo "$(package) $(version) is on npm"
            return 0
        fi
        tries=$((tries + 1))
        [ "$tries" -lt "$WAIT_TRIES" ] && sleep "$WAIT_DELAY"
    done
    echo "$(package) $(version) is not on npm" >&2
    return 1
}

# guard: makes sure we're on a clean main that's level with origin.
guard() {
    git fetch -q origin
    branch=$(git rev-parse --abbrev-ref HEAD)
    [ "$branch" = main ] || { echo "not on main (on ${branch:-no branch})"; return 1; }
    [ -z "$(git status --porcelain)" ] || { echo "the working tree isn't clean"; return 1; }
    [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || { echo "main isn't level with origin/main"; return 1; }
}

# state: how far the release of this version is: released, tag-pending, publish-pending or unreleased
state() {
    tagged=no
    git ls-remote --exit-code --tags origin "$(version)" > /dev/null 2>&1 && tagged=yes
    live=no
    listed "$(version)" && live=yes
    case "$tagged$live" in
        yesyes) echo released ;;
        noyes) echo tag-pending ;;
        yesno) echo publish-pending ;;
        *) echo unreleased ;;
    esac
}

# problems: everything that would stop a release
problems() {
    grep -Eq "^## \[$(version)\] - [^ ]" CHANGELOG.md || echo "CHANGELOG.md has no ## [$(version)] - <date> section"
    [ "$(grep -m1 '"version"' package.json | cut -d'"' -f4)" = "$(version)" ] || echo "package.json isn't at $(version), make sync does that"
    awk '/"(dependencies|devDependencies|peerDependencies|optionalDependencies)": *\{/ { deps = 1; next } /\}/ { deps = 0 }
        deps && /: *"(git\+|git:|github:|file:|https?:)/ { sub(/^ */, ""); print "package.json has a pin: " $0 }' package.json
}

# check: says where the release is up to and what would stop it
check() {
    current=$(state)
    echo "$(version): $current"

    if [ "$current" = released ]; then
        echo "nothing to release"
        return 0
    fi

    # a published version has already passed these, all that's left is the tag
    if [ "$current" != tag-pending ]; then
        found=$(problems)
        [ -z "$found" ] || { echo "$found"; return 1; }
        make pack || return 1
    fi

    echo "ready to release"
}
