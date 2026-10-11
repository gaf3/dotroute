ACCOUNT=gaf3
IMAGE=dotroute
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

.PHONY: build shell test lint setup version pack publish tag untag

build:
	docker build . -t $(ACCOUNT)/$(IMAGE):$(VERSION)

shell:
	docker run $(TTY) $(VOLUMES) $(NPM) $(NPMRC) $(ACCOUNT)/$(IMAGE):$(VERSION) sh

test:
	docker run $(TTY) $(VOLUMES) $(ACCOUNT)/$(IMAGE):$(VERSION) npm test

lint:
	docker run $(TTY) $(VOLUMES) $(ACCOUNT)/$(IMAGE):$(VERSION) npm run lint

# Pack it, install the tarball into an empty project, and use it the way a consumer would.
setup:
	docker run $(TTY) $(VOLUMES) $(NPM) $(ACCOUNT)/$(IMAGE):$(VERSION) sh -c "cp -r /opt/service /opt/install && cd /opt/install && \
	npm pack >/dev/null && \
	mkdir /opt/consumer && cd /opt/consumer && npm init -y >/dev/null && npm install /opt/install/dotroute-*.tgz dot >/dev/null && \
	test -f node_modules/dotroute/src/doTRoute.d.ts && \
	node -e \"const D = require('dotroute'); if (!D.Application) process.exit(1); console.log('ok', Object.keys(D).join(' '))\""

# Make package.json and the lockfile say what VERSION says.
version:
	docker run $(TTY) $(VOLUMES) $(ACCOUNT)/$(IMAGE):$(VERSION) npm version $(VERSION) --no-git-tag-version --allow-same-version

pack:
	docker run $(TTY) $(VOLUMES) $(NPM) $(ACCOUNT)/$(IMAGE):$(VERSION) sh -c "npm version $(VERSION) --no-git-tag-version --allow-same-version >/dev/null && npm pack --dry-run"

publish:
	@test -f ${HOME}/.npmrc || (echo "no ${HOME}/.npmrc to publish with" && exit 1)
	docker run $(TTY) $(VOLUMES) $(NPM) $(NPMRC) $(ACCOUNT)/$(IMAGE):$(VERSION) sh -c "npm version $(VERSION) --no-git-tag-version --allow-same-version >/dev/null && npm publish"

tag:
	-git tag -a $(VERSION) -m "Version $(VERSION)"
	git push origin --tags

untag:
	-git tag -d $(VERSION)
	git push origin ":refs/tags/$(VERSION)"
