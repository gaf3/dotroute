#!/bin/sh
# test-release.sh: tests the release scripts against a throwaway repo, a local bare origin and a fake npm registry.
# Nothing here touches the real repo, git remote or registry. A stub make stands in for build, test, lint, setup, pack,
# sync, publish, verify and tag, it logs what it was asked to do and fakes their effects (a version showing up on the
# registry, a tag, package.json following VERSION).
# Run it with: make test-release

SCRIPTS=$(cd "$(dirname "$0")" && pwd)
T=$(mktemp -d)
PASS=0
FAIL=0

export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.com GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.com
export WAIT_TRIES=2 WAIT_DELAY=0

PORT=$((20000 + $$ % 20000))
export NPM_URL=http://127.0.0.1:$PORT/registry
export FAKE_NPM=$T/index/registry
mkdir -p "$FAKE_NPM" "$T/bin"

(cd "$T/index" && python3 -m http.server "$PORT" --bind 127.0.0.1 > "$T/server.log" 2>&1) &
SERVER=$!

cleanup() {
    kill "$SERVER" 2> /dev/null
    rm -rf "$T"
}
trap cleanup EXIT

# the stub make
cat > "$T/bin/make" << 'EOF'
#!/bin/sh
echo "$*" >> "$MAKE_LOG"
version=$(cat VERSION)
for target in "$@"; do
    [ "$target" = "$MAKE_FAIL" ] && exit 1
    case "$target" in
        sync) sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" package.json package-lock.json ;;
        publish) mkdir -p "$FAKE_NPM/pkg" && : > "$FAKE_NPM/pkg/$version" ;;
        tag) git tag "$version" && git push -q origin "$version" ;;
    esac
done
exit 0
EOF
chmod +x "$T/bin/make"

# the stub docker, for verify: it fails the first DOCKER_FAILS times it's run, and logs each run
cat > "$T/bin/docker" << 'EOF'
#!/bin/sh
echo "docker $*" >> "$DOCKER_LOG"
count=$(wc -l < "$DOCKER_LOG" | tr -d ' ')
[ "$count" -le "${DOCKER_FAILS:-0}" ] && exit 1
exit 0
EOF
chmod +x "$T/bin/docker"
export PATH="$T/bin:$PATH"
export MAKE_LOG=$T/make.log
export DOCKER_LOG=$T/docker.log

# ---- helpers

ok() {
    PASS=$((PASS + 1))
    echo "ok   $1"
}

bad() {
    FAIL=$((FAIL + 1))
    echo "FAIL $1"
    [ -z "$2" ] || echo "$2" | sed 's/^/       /'
}

# eq name expected actual
eq() {
    if [ "$2" = "$3" ]; then ok "$1"; else bad "$1" "expected: $2
actual:   $3"; fi
}

# has name text output / lacks name text output
has() {
    case "$3" in *"$2"*) ok "$1" ;; *) bad "$1" "expected to find: $2
in: $3" ;; esac
}

lacks() {
    case "$3" in *"$2"*) bad "$1" "expected not to find: $2
in: $3" ;; *) ok "$1" ;; esac
}

# run: runs a command, sets OUT and CODE
run() {
    OUT=$("$@" 2>&1)
    CODE=$?
}

passes() {
    name=$1
    shift
    run "$@"
    if [ "$CODE" = 0 ]; then ok "$name"; else bad "$name" "exit $CODE: $OUT"; fi
}

fails() {
    name=$1
    shift
    run "$@"
    if [ "$CODE" != 0 ]; then ok "$name"; else bad "$name" "exit 0: $OUT"; fi
}

publish() { # publish version [name]: the registry answers for the version
    name=${2:-pkg}
    mkdir -p "$FAKE_NPM/$name"
    : > "$FAKE_NPM/$name/$1"
}

unpublish() {
    rm -rf "$FAKE_NPM/pkg"
}

# the version package.json is at
packaged() {
    grep -m1 '"version"' package.json | cut -d'"' -f4
}

# fresh: a clean repo on main, level with a bare origin
fresh() {
    unpublish
    : > "$MAKE_LOG"
    rm -rf "$T/origin.git" "$T/work"
    git init -q --bare "$T/origin.git"
    mkdir "$T/work"
    cd "$T/work" || exit 1
    git init -q -b main
    git remote add origin "$T/origin.git"
    mkdir scripts
    cp "$SCRIPTS"/lib.sh "$SCRIPTS"/new.sh "$SCRIPTS"/version.sh "$SCRIPTS"/release-check.sh "$SCRIPTS"/release.sh "$SCRIPTS"/verify.sh scripts/
    printf '0.6.1\n' > VERSION
    printf '{\n  "name": "pkg",\n  "version": "0.6.1",\n  "repository": {\n    "type": "git",\n    "url": "git+https://github.com/relations-dil/pkg.git"\n  },\n  "devDependencies": {\n    "dep": "^1.0.0"\n  }\n}\n' > package.json
    printf '{\n  "name": "pkg",\n  "version": "0.6.1",\n  "lockfileVersion": 3\n}\n' > package-lock.json
    printf '# Changelog\n\n## [0.6.1] - 2026-01-01\n\n### Added\n- thing\n' > CHANGELOG.md
    git add -A
    git commit -q -m first
    git push -q -u origin main
}

# wait for the fake registry to answer
for _ in 1 2 3 4 5 6 7 8 9 10; do
    curl -sf -o /dev/null "http://127.0.0.1:$PORT/" && break
    sleep 1
done

# ---- version.sh

echo "== version.sh"
fresh

eq "next +0.0.1" "0.6.2" "$(sh scripts/version.sh next +0.0.1)"
eq "next default is +0.0.1" "0.6.2" "$(sh scripts/version.sh next)"
eq "next +0.1 zeroes the patch" "0.7.0" "$(sh scripts/version.sh next +0.1)"
eq "next +1 zeroes minor and patch" "1.0.0" "$(sh scripts/version.sh next +1)"
eq "next +0.0.5" "0.6.6" "$(sh scripts/version.sh next +0.0.5)"
eq "next explicit" "0.9.4" "$(sh scripts/version.sh next 0.9.4)"
eq "next doesn't write" "0.6.1" "$(cat VERSION)"
eq "next doesn't sync" "" "$(cat "$MAKE_LOG")"

run sh scripts/version.sh write +0.1
eq "write prints" "0.7.0" "$OUT"
eq "write writes" "0.7.0" "$(cat VERSION)"
eq "write syncs the package files" "0.7.0" "$(packaged)"
eq "write syncs the lockfile" "0.7.0" "$(grep -m1 '"version"' package-lock.json | cut -d'"' -f4)"
eq "write asked make for sync" "sync" "$(cat "$MAKE_LOG")"
printf '0.6.1\n' > VERSION

fresh
MAKE_FAIL=sync run sh scripts/version.sh write +0.1
eq "write fails when sync does" 1 "$CODE"

fresh

fails "rejects two places" sh scripts/version.sh next +0.1.1
fails "rejects a zero bump" sh scripts/version.sh next +0
fails "rejects garbage bump" sh scripts/version.sh next +x
fails "rejects the same version" sh scripts/version.sh next 0.6.1
fails "rejects a lower version" sh scripts/version.sh next 0.5.9
fails "rejects not x.y.z" sh scripts/version.sh next 1.0
publish 0.6.2
run sh scripts/version.sh next +0.0.1
eq "rejects a published version" 1 "$CODE"
has "says it's published" "already published" "$OUT"
printf 'banana\n' > VERSION
run sh scripts/version.sh next +1
eq "rejects a bad VERSION" 1 "$CODE"
has "says VERSION is bad" "not x.y.z" "$OUT"

# ---- new.sh

echo "== new.sh"
fresh

passes "new on a clean main" sh scripts/new.sh
eq "new branch" "gaf3/0.6.2" "$(git branch --show-current)"
eq "new VERSION" "0.6.2" "$(cat VERSION)"
eq "new syncs package.json" "0.6.2" "$(packaged)"
eq "new commit" "Version 0.6.2" "$(git log -1 --format=%s)"
eq "new commits the package files with VERSION and the changelog" "CHANGELOG.md
VERSION
package-lock.json
package.json" "$(git show --name-only --format= HEAD | sort)"
eq "new changelog section is above the newest" "## [0.6.2] - $(date +%F)" "$(grep -m1 '^## \[' CHANGELOG.md)"
has "new changelog has the section" "## [0.6.2] - $(date +%F)" "$(cat CHANGELOG.md)"
has "new changelog keeps the old" "## [0.6.1] - 2026-01-01" "$(cat CHANGELOG.md)"
eq "new leaves the tree clean" "" "$(git status --porcelain)"

fresh
passes "new with a bump and a name" sh scripts/new.sh +0.1 my-thing
eq "new named branch" "gaf3/my-thing" "$(git branch --show-current)"
eq "new bumped" "0.7.0" "$(cat VERSION)"

fresh
BRANCH_PREFIX=other sh scripts/new.sh +1 > /dev/null 2>&1
eq "new honors BRANCH_PREFIX" "other/1.0.0" "$(git branch --show-current)"

fresh
echo more > extra.txt
git add extra.txt && git commit -q -m extra && git push -q origin main
VERSION_FILES=extra.txt sh scripts/new.sh > /dev/null 2>&1
eq "new adds VERSION_FILES, and only commits what changed" "CHANGELOG.md
VERSION
package-lock.json
package.json" "$(git show --name-only --format= HEAD | sort)"

fresh
printf '# Changelog\n\n## [Unreleased]\n\n### Added\n- soon\n\n## [0.6.1] - 2026-01-01\n' > CHANGELOG.md
git commit -q -am unreleased && git push -q origin main
sh scripts/new.sh > /dev/null 2>&1
has "new turns Unreleased into the section" "## [0.6.2] - $(date +%F)" "$(cat CHANGELOG.md)"
lacks "new drops the Unreleased heading" "[Unreleased]" "$(cat CHANGELOG.md)"
has "new keeps what was in Unreleased" "- soon" "$(cat CHANGELOG.md)"

fresh
printf '# Changelog\n' > CHANGELOG.md
git commit -q -am empty && git push -q origin main
sh scripts/new.sh > /dev/null 2>&1
has "new appends to a changelog with no sections" "## [0.6.2] - $(date +%F)" "$(cat CHANGELOG.md)"

fresh
printf '# Changelog\n\n## [0.6.2] - 2026-02-02\n\n## [0.6.1] - 2026-01-01\n' > CHANGELOG.md
git commit -q -am has-it && git push -q origin main
sh scripts/new.sh > /dev/null 2>&1
eq "new doesn't duplicate a section" "1" "$(grep -c '^## \[0.6.2\]' CHANGELOG.md)"

fresh
git switch -q -c elsewhere
run sh scripts/new.sh
eq "new refuses off main" 1 "$CODE"
has "new says not on main" "not on main" "$OUT"

fresh
echo dirty >> VERSION
run sh scripts/new.sh
eq "new refuses a dirty tree" 1 "$CODE"
has "new says dirty" "isn't clean" "$OUT"

fresh
echo more > more.txt && git add more.txt && git commit -q -m local
run sh scripts/new.sh
eq "new refuses ahead of origin" 1 "$CODE"
has "new says not level" "isn't level" "$OUT"

fresh
publish 0.6.2
run sh scripts/new.sh
eq "new refuses a published next version" 1 "$CODE"
eq "new leaves no branch behind" "main" "$(git branch --show-current)"

# ---- state

echo "== state"
fresh
. scripts/lib.sh
eq "state unreleased" "unreleased" "$(state)"
publish 0.6.1
eq "state tag-pending" "tag-pending" "$(state)"
git tag 0.6.1 && git push -q origin 0.6.1
eq "state released" "released" "$(state)"
unpublish
eq "state publish-pending" "publish-pending" "$(state)"

# ---- release-check.sh

echo "== release-check.sh"
fresh
run sh scripts/release-check.sh
eq "check ready" 0 "$CODE"
has "check says ready" "ready to release" "$OUT"
eq "check runs the pack" "pack" "$(cat "$MAKE_LOG")"

fresh
printf '# Changelog\n\n## [0.6.0] - 2026-01-01\n' > CHANGELOG.md
run sh scripts/release-check.sh
eq "check fails with no changelog section" 1 "$CODE"
has "check names the changelog" "CHANGELOG.md has no ## [0.6.1]" "$OUT"

fresh
sed -i 's/"version": "0.6.1"/"version": "0.6.0"/' package.json
run sh scripts/release-check.sh
eq "check fails when package.json is behind" 1 "$CODE"
has "check names package.json" "package.json isn't at 0.6.1" "$OUT"

fresh
sed -i 's|"dep": "^1.0.0"|"dep": "git+https://github.com/relations-dil/dep.git#abc"|' package.json
run sh scripts/release-check.sh
eq "check fails on a git pin" 1 "$CODE"
has "check names the pin" "package.json has a pin" "$OUT"

fresh
sed -i 's|"dep": "^1.0.0"|"dep": "file:../dep"|' package.json
run sh scripts/release-check.sh
eq "check fails on a file pin" 1 "$CODE"

fresh
sed -i 's|"dep": "^1.0.0"|"dep": "github:relations-dil/dep"|' package.json
run sh scripts/release-check.sh
eq "check fails on a github pin" 1 "$CODE"

fresh
run sh scripts/release-check.sh
lacks "check doesn't mistake the repository url for a pin" "has a pin" "$OUT"

fresh
publish 0.6.1
run sh scripts/release-check.sh
eq "check at tag-pending skips the problems" 0 "$CODE"
has "check says tag-pending" "0.6.1: tag-pending" "$OUT"
eq "check at tag-pending runs no make" "" "$(cat "$MAKE_LOG")"

fresh
git tag 0.6.1 && git push -q origin 0.6.1
publish 0.6.1
run sh scripts/release-check.sh
has "check says nothing to release" "nothing to release" "$OUT"

fresh
MAKE_FAIL=pack run sh scripts/release-check.sh
eq "check fails when pack does" 1 "$CODE"


# ---- release.sh

echo "== release.sh"
fresh
run sh scripts/release.sh
eq "release runs" 0 "$CODE"
eq "release order" "pack
publish
verify
tag" "$(cat "$MAKE_LOG")"
eq "release tags" "0.6.1" "$(git ls-remote --tags origin | sed 's|.*refs/tags/||')"
has "release says released" "pkg 0.6.1 released" "$OUT"
eq "state is released after" "released" "$(state)"

: > "$MAKE_LOG"
run sh scripts/release.sh
has "release again does nothing" "nothing to release" "$OUT"
eq "release again runs no make" "" "$(cat "$MAKE_LOG")"

fresh
publish 0.6.1
run sh scripts/release.sh
eq "release at tag-pending only tags" "tag" "$(cat "$MAKE_LOG")"

fresh
MAKE_FAIL=publish run sh scripts/release.sh
eq "release stops when the publish fails" 1 "$CODE"
eq "release leaves no tag after a failed publish" "" "$(git ls-remote --tags origin)"

fresh
MAKE_FAIL=verify run sh scripts/release.sh
eq "release stops when the install check fails" 1 "$CODE"
eq "release doesn't reach the tag" "pack
publish
verify" "$(cat "$MAKE_LOG")"
eq "release leaves no tag" "" "$(git ls-remote --tags origin)"
eq "state is publish-pending after" "tag-pending" "$(state)"

fresh
MAKE_FAIL=tag run sh scripts/release.sh
eq "release fails when the tag does" 1 "$CODE"
eq "state is tag-pending after" "tag-pending" "$(state)"
unset MAKE_FAIL
run sh scripts/release.sh
eq "release resumes at the tag" 0 "$CODE"
eq "release resumed to released" "released" "$(state)"

fresh
git switch -q -c elsewhere
run sh scripts/release.sh
eq "release refuses off main" 1 "$CODE"
eq "release off main runs no make" "" "$(cat "$MAKE_LOG")"

# ---- verify.sh

echo "== verify.sh"
fresh
: > "$DOCKER_LOG"
run sh scripts/verify.sh
eq "verify passes when the install does" 0 "$CODE"
eq "verify runs the install once" "1" "$(wc -l < "$DOCKER_LOG" | tr -d ' ')"
has "verify installs the package at the version" "pkg@0.6.1" "$(cat "$DOCKER_LOG")"

: > "$DOCKER_LOG"
DOCKER_FAILS=1 run sh scripts/verify.sh
eq "verify tries again while the registry catches up" 0 "$CODE"
eq "verify ran the install twice" "2" "$(wc -l < "$DOCKER_LOG" | tr -d ' ')"

: > "$DOCKER_LOG"
DOCKER_FAILS=9 run sh scripts/verify.sh
eq "verify gives up" 1 "$CODE"
eq "verify gave up after WAIT_TRIES" "2" "$(wc -l < "$DOCKER_LOG" | tr -d ' ')"
has "verify says why" "pkg 0.6.1 could not be installed from npm" "$OUT"

# ---- lib.sh

echo "== lib.sh"
fresh
eq "package" "pkg" "$(package)"
eq "version" "0.6.1" "$(version)"

# the defaults wait 30 minutes, the registry lags for minutes

eq "default wait" "180 10" "$(env -u WAIT_TRIES -u WAIT_DELAY sh -c '. scripts/lib.sh; echo "$WAIT_TRIES $WAIT_DELAY"')"

# listed: whether the registry has the version

fails "listed says no when it isn't" listed 0.6.1
publish 0.6.1
passes "listed says yes when it is" listed 0.6.1
fails "listed doesn't match a longer version" listed 0.6
fails "listed doesn't match a shorter version" listed 0.6.10
publish 1.0.0 dep
passes "listed takes another package's name" listed 1.0.0 dep
fails "listed says no for a package that isn't there" listed 1.0.0 nope
publish 2.0.0 @scope/dep
passes "listed takes a scoped name" listed 2.0.0 @scope/dep
printf '{\n  "name": "@scope/pkg",\n  "version": "0.6.1"\n}\n' > package.json
eq "package keeps the scope" "@scope/pkg" "$(package)"
publish 0.6.1 @scope/pkg
passes "listed finds the scoped package" listed 0.6.1

# wait_for waits for it

fresh
fails "wait_for gives up" wait_for
has "wait_for says why" "pkg 0.6.1 is not on npm" "$OUT"
publish 0.6.1
passes "wait_for finds it" wait_for

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" = 0 ]
