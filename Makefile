ACCOUNT=gaf3
IMAGE=dotroute
VERSION?=$(shell cat VERSION)
TTY=$(shell if tty -s; then echo "-it"; fi)
VOLUMES=-v ${PWD}/src:/opt/service/src \
		-v ${PWD}/package.json:/opt/service/package.json \
		-v ${PWD}/package-lock.json:/opt/service/package-lock.json

.PHONY: build shell test

build:
	docker build . -t $(ACCOUNT)/$(IMAGE):$(VERSION)

shell:
	docker run $(TTY) $(VOLUMES) $(ACCOUNT)/$(IMAGE):$(VERSION) sh

test:
	docker run $(TTY) $(VOLUMES) $(ACCOUNT)/$(IMAGE):$(VERSION) npm test
