if [[ $# -eq 0 ]] ; then
    echo 'dev-docker-build-publish needs an argument to define a unique parameter for this developer deployment (usually dev name e.g. patto)'
    exit 1
fi

REPO=843407916570.dkr.ecr.ap-southeast-2.amazonaws.com
PROJECT=didact

set -o errexit

source dev-docker-build.sh

aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin $REPO

echo "Docker pushing (needs AWS credentials to the ECR repository)..."

HTML_IMAGE=$REPO/$PROJECT-html-dev:$1

docker tag backend-html:latest $HTML_IMAGE
docker push $HTML_IMAGE

# GRAPHQL_IMAGE=$REPO/$PROJECT-graphql-dev:$1
#docker tag backend-graphql:latest $GRAPHQL_IMAGE
#docker push $GRAPHQL_IMAGE
