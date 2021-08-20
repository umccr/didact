#!/bin/zsh

if [[ $# -eq 0 ]] ; then
    echo 'dev-undeploy needs an argument to define a unique parameter for this dev (usually name e.g. patto)'
    exit 1
fi

set -o errexit

UMCCR_DEVELOPER=$1 npx cdk destroy
