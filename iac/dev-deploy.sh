#!/bin/zsh

if [[ $# -eq 0 ]] ; then
    echo 'dev-deploy needs an argument to define a unique parameter for this developer deployment (usually dev name or branch e.g. patto)'
    exit 1
fi

set -o errexit

read SITE_NAME < ../project-name.txt

echo "Deploying site $SITE_NAME ..."

# want to make sure our CDK is compiled before using
#echo Compiling IaC ...
#npx tsc --noEmit

echo Installing stack ...

# for dev work we use the pre-canned settings of the dev account
VPC="vpc-00eafc63c0dfca266"
SUBA="subnet-0fab038b0341872f1"
SUBB="subnet-0e84dd3a07fb770f5"
SUBC="subnet-093aee876a555f218"
SUBNETS="$SUBA, $SUBB, $SUBC"
AZS="ap-southeast-2a, ap-southeast-2b, ap-southeast-2c"
ECRHTML="$SITE_NAME-html-dev"
DOMAIN="dev.umccr.org"
AUSCERT="arn:aws:acm:ap-southeast-2:843407916570:certificate/aa9a1385-7f72-4f1f-98a5-a5da2eff653b"
DOMAINZONE="Z13ZMZH3CGX773"
OIDCHOST="https://test.cilogon.org"
OIDCCLIENTID="{{resolve:secretsmanager:dev/didact/registry-test.biocommons.org.au:SecretString:client_id}}"
OIDCCLIENTSECRET="{{resolve:secretsmanager:dev/didact/registry-test.biocommons.org.au:SecretString:client_secret}}"
LDAPHOST="ldaps://ldap-test.cilogon.org"
LDAPUSER="uid=readonly_user,ou=system,o=NAGIMdev,o=CO,dc=biocommons,dc=org,dc=au"
LDAPSECRET="{{resolve:secretsmanager:dev/didact/registry-test.biocommons.org.au:SecretString:ldap_secret}}"
BROKERAUSCERT="arn:aws:acm:ap-southeast-2:843407916570:certificate/ec89d6f9-5d50-438b-8bdd-b48f953aa1b3"
BROKERDOMAIN="nagim.dev"
BROKERDOMAINZONE="Z0321813PLMQECK916W2"

# note - the use of --no-lookups - even though a dev stack *could* do lookups - because our
# eventual CI built stack cannot do lookups - we want to disable it in dev as well

UMCCR_DEVELOPER=$1 npx cdk deploy \
   --toolkit-stack-name CDKToolkitNew \
   --context \
   build=$1 \
   --parameters "SemanticVersion=0.0.0-$1" \
   --parameters "VPC=$VPC" \
   --parameters "Subnets=$SUBNETS" \
   --parameters "AZs=$AZS" \
   --parameters "ECRName=$ECRHTML" \
   --parameters "OidcLoginHost=$OIDCHOST" \
   --parameters "OidcLoginClientId=$OIDCCLIENTID" \
   --parameters "OidcLoginClientSecret=$OIDCCLIENTSECRET" \
   --parameters "AlbCertArn=$AUSCERT" \
   --parameters "AlbNameHost=$SITE_NAME-$1" \
   --parameters "AlbNameDomain=$DOMAIN" \
   --parameters "AlbNameZoneId=$DOMAINZONE" \
   --parameters "BrokerCertArn=$BROKERAUSCERT" \
   --parameters "BrokerNameHost=broker" \
   --parameters "BrokerNameDomain=$BROKERDOMAIN" \
   --parameters "BrokerNameZoneId=$BROKERDOMAINZONE" \
   --parameters "LdapHost=$LDAPHOST" \
   --parameters "LdapUser=$LDAPUSER" \
   --parameters "LdapSecret=$LDAPSECRET"
