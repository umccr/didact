# WIP - do not use yet..

SYNTAX ERROR FAIL SO DONT USE

# settings for the organisation of the project
BACKEND_HTML_FOLDER = backend-html
FRONTEND_FOLDER = frontend

# derived variables for proper build process (should not need editing below here)
FRONTEND_SOURCES = $(sort $(notdir $(wildcard frontend/src/**/*)))


BACKEND_HTML_SOURCES = $(sort $(notdir $(wildcard $(BACKEND_HTML_FOLDER)/src/**/*.ts)))
BACKEND_HTML_BUILDS = $(BACKEND_HTML_SOURCES:$(BACKEND_HTML_FOLDER)/src/%.ts=$(BACKEND_HTML_FOLDER)/build/%.js)))

all: backendhtmldocker

# stamps folder is used for timestamping the artifacts that don't naturally fit standard Makefile pattern (docker images)
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
