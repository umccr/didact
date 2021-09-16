import { Construct } from "constructs";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { CfnApi, CfnApiMapping, CfnDomainName } from "aws-cdk-lib/aws-apigatewayv2";
import { Function } from "aws-cdk-lib/aws-lambda";
import {
  ARecord,
  CnameRecord,
  HostedZone,
  RecordTarget,
} from "aws-cdk-lib/aws-route53";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { ApiGatewayv2DomainProperties } from "aws-cdk-lib/aws-route53-targets";

export type MultiTargetLoadBalancerProps = {
  // the ARN for a wildcard (or precise) certificate that matches
  // <nameHost>.<nameDomain>
  certificateArn: string;

  // the first part of the FQDN for the site
  nameHost: string;

  // the rest of the name of the FQDN for the site
  nameDomain: string;

  // the Route 53 zone, matching <nameDomain> in which we will be placing entries
  nameZoneId: string;

  // backend function for site
  targetDefault: Function;
};

/**
 */
export class WebsiteApiGateway extends Construct {
  public readonly apiGateway: CfnApi;
  public readonly fqdn: string;

  constructor(
    parent: Construct,
    name: string,
    props: MultiTargetLoadBalancerProps
  ) {
    super(parent, name);

    this.fqdn = props.nameHost + "." + props.nameDomain;

    this.apiGateway = new CfnApi(this, "Api", {
      name: this.fqdn,
      protocolType: "HTTP",
      target: props.targetDefault.functionArn,
      corsConfiguration: {
        allowOrigins: ["*"],
        allowMethods: ["GET"],
        allowHeaders: ["*"]
      }
    });

    // register a custom domain to overlay the api gw chosen endpoint
    const dn = new CfnDomainName(this, "ApiDomain", {
      domainName: this.fqdn,
      domainNameConfigurations: [
        {
          certificateArn: props.certificateArn,
          endpointType: "REGIONAL",
        },
      ],

    });

    // we always need to add this in or else the domain name stuff can get ahead
    // of the actual API creation
    dn.addDependsOn(this.apiGateway);

    const mappings = new CfnApiMapping(this, "Mapping", {
      apiId: this.apiGateway.ref,
      domainName: dn.domainName,
      stage: '$default',
    });

    const albZone = HostedZone.fromHostedZoneAttributes(this, "AlbZone", {
      hostedZoneId: props.nameZoneId,
      zoneName: props.nameDomain,
    });

    const albDns = new ARecord(this, "AlbAliasRecord", {
      zone: albZone,
      recordName: props.nameHost,
      target: RecordTarget.fromAlias(
        new ApiGatewayv2DomainProperties(
          dn.attrRegionalDomainName,
          dn.attrRegionalHostedZoneId
        )
      ),
    });
  }
}
