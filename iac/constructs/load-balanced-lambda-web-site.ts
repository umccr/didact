import {CfnParameter, RemovalPolicy} from "aws-cdk-lib";
import {Construct} from "constructs";

import {Vpc} from "aws-cdk-lib/aws-ec2";
import {AttributeType, BillingMode, ProjectionType, Table,} from "aws-cdk-lib/aws-dynamodb";
import {EcrBasedLambdaFunction} from "./ecr-based-lambda-function";
import {MultiTargetLoadBalancer} from "./multi-target-load-balancer";
import {AppEnvName} from '../../shared-src/app-env-name';

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

  build: string;
}

/**
 *
 *
 */
export class LoadBalancedLambdaWebSite extends Construct {
  constructor(parent: Construct, name: string, props: StaticSiteProps) {
    super(parent, name);

    // we do not create a new VPC - we are assuming there is one already for us and we are just using
    // the attributes to find it
    const vpc = Vpc.fromVpcAttributes(this, "Vpc", {
      vpcId: props.vpcParam.valueAsString,
      availabilityZones: props.azsParam.valueAsList,
      publicSubnetIds: props.publicSubnetsParam.valueAsList,
    });

    const table = new Table(this, "Table", {
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "pk", type: AttributeType.STRING },
      sortKey: { name: "sk", type: AttributeType.STRING },
    });

    table.addGlobalSecondaryIndex({
      indexName: "gs1",
      partitionKey: { name: "gs1pk", type: AttributeType.STRING },
      sortKey: { name: "gs1sk", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    table.addGlobalSecondaryIndex({
      indexName: "gs2",
      partitionKey: { name: "gs2pk", type: AttributeType.STRING },
      sortKey: { name: "gs2sk", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    table.addGlobalSecondaryIndex({
      indexName: "gs3",
      partitionKey: { name: "gs3pk", type: AttributeType.STRING },
      sortKey: { name: "gs3sk", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    const htmlFunctionRole = EcrBasedLambdaFunction.generateLambdaRole(this, "HtmlFunctionRole", [
      "AmazonS3ReadOnlyAccess",
    ]);

    table.grantReadWriteData(htmlFunctionRole);

    // because it is vital that the names we use here for env variables are consistent into the backends
    // we use a shared type definition
    const envs: { [name in AppEnvName] : string; } = {
      BUILD_VERSION: props.build,
      SEMANTIC_VERSION: props.semanticVersionParam.valueAsString,
      NODE_ENV: props.deployedEnvironmentParam.valueAsString,
      TABLE_ARN: table.tableArn,
      TABLE_NAME: table.tableName
    }

    const functionConstruct = new EcrBasedLambdaFunction(this, "HtmlFunction", {
      lambdaRole: htmlFunctionRole,
      lambdaRepoNameParam: props.lambdaRepoNameParam.valueAsString,
      lambdaRepoTag: props.build,
      environmentVariables: envs,
    });

    const albConstruct = new MultiTargetLoadBalancer(this, "LoadBalancer", {
      vpc: vpc,
      certificateArn: props.albCertificateArnParam.valueAsString,
      nameHost: props.albNameHostParam.valueAsString,
      nameDomain: props.albNameDomainParam.valueAsString,
      nameZoneId: props.albNameZoneIdParam.valueAsString,
      targetDefault: functionConstruct.functionAsLambdaTarget(),
      targetPaths: {},
    });
  }
}
