# WIP - do not use yet..

SYNTAX ERROR FAIL SO DONT USE

FRONTEND_SOURCES = $(sort $(notdir $(wildcard frontend/src/**/*)))

BACKEND_HTML_FOLDER = backend-html

BACKEND_HTML_SOURCES = $(sort $(notdir $(wildcard $(BACKEND_HTML_FOLDER)/src/**/*.ts)))
BACKEND_HTML_BUILDS = $(BACKEND_HTML_SOURCES:$(BACKEND_HTML_FOLDER)/src/%.ts=$(BACKEND_HTML_FOLDER)/build/%.js)))

all: backendhtmldocker

# stamps folder is used for timestamping the artifacts that don't naturally fit that pattern (docker images)
.stamps: Makefile
	@mkdir -p $@

$(BACKEND_HTML_BUILDS): $(BACKEND_HTML_SOURCES) $(BACKEND_HTML_FOLDER)/package.json
	(cd $(BACKEND_HTML_FOLDER) || exit; npm run build)


backendhtmldocker: .stamps/backendhtmldocker.stamp
.stamps/backendhtmldocker.stamp: .stamps backend-html/Dockerfile $(BACKEND_HTML_BUILDS)
	(cd backend-html || exit; docker build -t backend-html .)
	@touch $@



#.PHONY: all webapp
#
#.stamps/webapp_pushed.stamp: .stamps/webapp.stamp
#        docker push example/webapp
#        @touch $@

#infrastructure: $(INFRASTRUCTURE_SOURCES)
#        cd deployment/terraform && terraform apply

#deploy: all infrastructure
#        cd deployment && ansible-playbook -i inventories/hosts deploy.yml

#.PHONY: infrastructure deploy

#frontend: frontend/src/*#
#	(cd frontend || exit; npm run build)
