import { CfnParameter, Duration, RemovalPolicy } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { EcrBasedLambdaFunction } from "./ecr-based-lambda-function";
import { MultiTargetLoadBalancer } from "./multi-target-load-balancer";
import { AppEnvName } from "../../shared-src/app-env-name";
import { WebsiteApiGateway } from "./website-api-gateway";

export interface StaticSiteProps {
  vpcParam: CfnParameter;
  azsParam: CfnParameter;
  publicSubnetsParam: CfnParameter;

  semanticVersionParam: CfnParameter;
  deployedEnvironmentParam: CfnParameter;
  lambdaRepoNameParam: CfnParameter;

  albCertificateArnParam: CfnParameter;
  albNameHostParam: CfnParameter;
  albNameDomainParam: CfnParameter;
  albNameZoneIdParam: CfnParameter;

  oidcLoginHostParam: CfnParameter;
  oidcLoginClientIdParam: CfnParameter;
  oidcLoginClientSecretParam: CfnParameter;

  build: string;
}

/**
 * A website for Didact. Built as a ALB wrapping a lambda.
 */
export class DidactWebSite extends Construct {
  constructor(parent: Construct, name: string, props: StaticSiteProps) {
    super(parent, name);

    // we do not create a new VPC - we are assuming there is one already for us and we are just using
    // the attributes to find it
    const vpc = Vpc.fromVpcAttributes(this, "Vpc", {
      vpcId: props.vpcParam.valueAsString,
      availabilityZones: props.azsParam.valueAsList,
      publicSubnetIds: props.publicSubnetsParam.valueAsList,
    });

    const table = this.addDataStorage();

    const htmlFunctionRole = EcrBasedLambdaFunction.generateLambdaRole(
      this,
      "HtmlFunctionRole",
      ["AmazonS3ReadOnlyAccess"]
    );

    table.grantReadWriteData(htmlFunctionRole);

    // because it is vital that the names we use here for env variables are consistent into the backends
    // we use a shared type definition AppEnvName
    const envs: { [name in AppEnvName]: string } = {
      BUILD_VERSION: props.build,
      SEMANTIC_VERSION: props.semanticVersionParam.valueAsString,
      NODE_ENV: props.deployedEnvironmentParam.valueAsString,
      TABLE_ARN: table.tableArn,
      TABLE_NAME: table.tableName,
      LOGIN_HOST: props.oidcLoginHostParam.valueAsString,
      LOGIN_CLIENT_ID: props.oidcLoginClientIdParam.valueAsString,
      LOGIN_CLIENT_SECRET: props.oidcLoginClientSecretParam.valueAsString,
      LDAP_HOST: "",
      LDAP_PASSWORD: ""
    };

    const functionConstruct = new EcrBasedLambdaFunction(this, "HtmlFunction", {
      lambdaRole: htmlFunctionRole,
      lambdaRepoNameParam: props.lambdaRepoNameParam.valueAsString,
      lambdaRepoTag: props.build,
      environmentVariables: envs,
      duration: Duration.minutes(1)
    });

    /*const albConstruct = new MultiTargetLoadBalancer(this, "LoadBalancer", {
      vpc: vpc,
      certificateArn: props.albCertificateArnParam.valueAsString,
      nameHost: props.albNameHostParam.valueAsString,
      nameDomain: props.albNameDomainParam.valueAsString,
      nameZoneId: props.albNameZoneIdParam.valueAsString,
      targetDefault: functionConstruct.functionAsLambdaTarget(),
      targetPaths: {},
    }); */

    const apiGateway = new WebsiteApiGateway(this, "ApiGateway", {
      certificateArn: props.albCertificateArnParam.valueAsString,
      nameHost: props.albNameHostParam.valueAsString,
      nameDomain: props.albNameDomainParam.valueAsString,
      nameZoneId: props.albNameZoneIdParam.valueAsString,
      targetDefault: functionConstruct.function
    })
  }

  /**
   * Add in any dynamodb table or other data storage.
   *
   * @private
   */
  private addDataStorage(): Table {
    // our one-table design means that we define a single table for
    // all our data, using just the pk and sk

    const t = new Table(this, "Table", {
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "pk", type: AttributeType.STRING },
      sortKey: { name: "sk", type: AttributeType.STRING },
    });

    // our one-table design means we use a variety of indexes of
    // a common pattern (gs1, ...)

    t.addGlobalSecondaryIndex({
      indexName: "gs1",
      partitionKey: { name: "gs1pk", type: AttributeType.STRING },
      sortKey: { name: "gs1sk", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    t.addGlobalSecondaryIndex({
      indexName: "gs2",
      partitionKey: { name: "gs2pk", type: AttributeType.STRING },
      sortKey: { name: "gs2sk", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    t.addGlobalSecondaryIndex({
      indexName: "gs3",
      partitionKey: { name: "gs3pk", type: AttributeType.STRING },
      sortKey: { name: "gs3sk", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    return t;
  }
}
