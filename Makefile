ACCOUNT=gaf3
IMAGE=dotroute
INSTALL=node:22.9.0-alpine3.20
VERSION?=$(shell cat VERSION)
TTY=$(shell if tty -s; then echo "-it"; fi)
VOLUMES=-v ${PWD}/src:/opt/service/src \
		-v ${PWD}/eslint.config.js:/opt/service/eslint.config.js \
		-v ${PWD}/tsconfig.json:/opt/service/tsconfig.json \
		-v ${PWD}/package.json:/opt/service/package.json \
		-v ${PWD}/package-lock.json:/opt/service/package-lock.json
NPM=-v ${PWD}/README.md:/opt/service/README.md \
	-v ${PWD}/LICENSE:/opt/service/LICENSE \
	-v ${PWD}/CHANGELOG.md:/opt/service/CHANGELOG.md
# Mount ~/.npmrc only when it exists: a missing mount source gets created as a directory.
NPMRC=$(shell test -f ${HOME}/.npmrc && echo "-v ${HOME}/.npmrc:/root/.npmrc")

.PHONY: build shell test lint setup tag untag pack publish new sync version release-check release verify test-release help
.DEFAULT_GOAL := help

build: ## Builds the docker image
	docker build . -t $(ACCOUNT)/$(IMAGE):$(VERSION)

shell: ## Opens a shell in the container
	docker run $(TTY) $(VOLUMES) $(NPM) $(NPMRC) $(ACCOUNT)/$(IMAGE):$(VERSION) sh

test: ## Runs the tests with coverage
	docker run $(TTY) $(VOLUMES) $(ACCOUNT)/$(IMAGE):$(VERSION) npm test

lint: ## Runs eslint and the typecheck
	docker run $(TTY) $(VOLUMES) $(ACCOUNT)/$(IMAGE):$(VERSION) npm run lint

# Pack it, install the tarball into an empty project, and use it the way a consumer would.
setup: ## Checks the package installs and its module loads
	docker run $(TTY) $(VOLUMES) $(NPM) $(ACCOUNT)/$(IMAGE):$(VERSION) sh -c "cp -r /opt/service /opt/install && cd /opt/install && \
	npm pack >/dev/null && \
	mkdir /opt/consumer && cd /opt/consumer && npm init -y >/dev/null && npm install /opt/install/dotroute-*.tgz dot >/dev/null && \
	test -f node_modules/dotroute/src/doTRoute.d.ts && \
	node -e \"const D = require('dotroute'); if (!D.Application) process.exit(1); console.log('ok', Object.keys(D).join(' '))\""

pack: ## Lists what would be published
	docker run $(TTY) $(VOLUMES) $(NPM) $(ACCOUNT)/$(IMAGE):$(VERSION) sh -c "npm version $(VERSION) --no-git-tag-version --allow-same-version >/dev/null && npm pack --dry-run"

publish: ## Publishes the version to npm
	@test -f ${HOME}/.npmrc || (echo "no ${HOME}/.npmrc to publish with" && exit 1)
	docker run $(TTY) $(VOLUMES) $(NPM) $(NPMRC) $(ACCOUNT)/$(IMAGE):$(VERSION) sh -c "npm version $(VERSION) --no-git-tag-version --allow-same-version >/dev/null && npm publish"

tag: ## Tags the version and pushes the tag
	git rev-parse -q --verify refs/tags/$(VERSION) || git tag -a $(VERSION) -m "Version $(VERSION)"
	git push origin --tags

untag: ## Removes the version's tag
	-git tag -d $(VERSION)
	git push origin ":refs/tags/$(VERSION)"

# Releases: make new starts one, make release-check says where it's up to, make release finishes it.
# V is +0.0.1 (the default), +0.1, +1 or a version outright, and B names the branch. The work is in scripts/.
V?=+0.0.1
B?=

new: ## Starts a release: next version, branch, VERSION, changelog (V=+0.0.1|+0.1|+1|x.y.z, B=name)
	@sh scripts/new.sh "$(V)" "$(B)"

sync: ## Syncs package.json and the lockfile to VERSION
	docker run --rm $(TTY) -v ${PWD}/package.json:/opt/service/package.json -v ${PWD}/package-lock.json:/opt/service/package-lock.json -w /opt/service $(INSTALL) npm version $(VERSION) --no-git-tag-version --allow-same-version

version: ## Sets VERSION and syncs the package files (V=+0.0.1|+0.1|+1|x.y.z)
	@sh scripts/version.sh write "$(V)"

release-check: ## Says where the release is up to and what would stop it
	@sh scripts/release-check.sh

release: ## Does what's left of the release: checks, npm, a clean install, the tag
	@sh scripts/release.sh

verify: ## Installs the version from npm in a clean container
	@sh scripts/verify.sh

# Tests the release scripts against a throwaway repo and a fake registry, nothing real is touched
test-release: ## Tests the release scripts against a throwaway repo and a fake registry
	docker run --rm $(TTY) -v ${PWD}/scripts:/opt/scripts python:3 sh /opt/scripts/test-release.sh

help: ## Lists the targets
	@awk -F ':.*## ' '/^[a-z-]+:.*## /{printf "%-16s %s\n", $$1, $$2}' $(MAKEFILE_LIST)
