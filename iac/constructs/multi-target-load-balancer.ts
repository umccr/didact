import { CfnCondition, CfnOutput, Fn } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  ApplicationLoadBalancer,
  IApplicationLoadBalancerTarget,
  ListenerAction,
  ListenerCondition,
  SslPolicy,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { CfnDistribution } from "aws-cdk-lib/aws-cloudfront";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";

export type MultiTargetLoadBalancerProps = {
  // the ARN for a wildcard (or precise) certificate that matches
  // <nameHost>.<nameDomain>
  certificateArn: string;

  // the first part of the FQDN for the ALB
  nameHost: string;

  // the rest of the name of the FQDN for the ALB
  nameDomain: string;

  // the Route 53 zone, matching <nameDomain> in which we will be placing entries
  nameZoneId: string;

  // the VPC that the load balancer will be installed into
  vpc: IVpc;

  // ALB default target if not otherwise matched
  targetDefault: IApplicationLoadBalancerTarget;

  // dictionary of ALB paths and the corresponding triggered target
  targetPaths: { [id: string]: IApplicationLoadBalancerTarget };

  // a header/value pair that can be specified to enforce the presence of this is every HTTP request
  // used to limit ALB traffic to a known CloudFront source
  enforceMagicHeaderPair?: [string, string];
}

/**
 * A construct that wraps an Application Load Balancer, with SSL certificate
 * and Route 53 entry, targeting a set of targets with different paths. Can handle being given an empty ZoneId in
 * which case no Route 53 entry will be made and the CNAME will need to be added
 * manually.
 */
export class MultiTargetLoadBalancer extends Construct {
  public readonly loadBalancer: ApplicationLoadBalancer;
  public readonly fqdn: string;

  constructor(
    parent: Construct,
    name: string,
    props: MultiTargetLoadBalancerProps
  ) {
    super(parent, name);

    this.loadBalancer = new ApplicationLoadBalancer(this, "ALB", {
      vpc: props.vpc,
      internetFacing: true,
    });

    this.fqdn = props.nameHost + "." + props.nameDomain;

    this.addLoadBalancerDetails(props);
    this.makeDns(props);
  }

  /**
     * Make the load balancer listeners to sit on the load balancer and redirect traffic
     * to the given lambda, or if the traffic does not match the expected host, return 404.

     * @param props
     * @private
     */
  private addLoadBalancerDetails(props: MultiTargetLoadBalancerProps) {
    const cert = Certificate.fromCertificateArn(
      this,
      "AlbCertificate",
      props.certificateArn
    );

    // add a listener to SSL traffic
    const listener = this.loadBalancer.addListener("Listener", {
      port: 443,
      certificates: [cert],
      sslPolicy: SslPolicy.RECOMMENDED,
      open: true,
    });

    // we want the catch all to be as if there is nothing here - depending on some of our other
    // props we may actually get here - or something we will always catch another listener rules
    listener.addAction("ListenerCatchAll", {
      action: ListenerAction.fixedResponse(404),
    });

    // Rule priority
    // Each rule has a priority. Rules are evaluated in priority order,
    // from the lowest value to the highest value.
    // The default rule is evaluated last.
    // You can change the priority of a nondefault rule at any time.
    // You cannot change the priority of the default rule. For more information, see Reorder rules.

    const makeConditions = (path: string) => {
      let conds = [ListenerCondition.pathPatterns([path])];

      if (props.enforceMagicHeaderPair)
        conds.push(
          ListenerCondition.httpHeader(props.enforceMagicHeaderPair[0], [
            props.enforceMagicHeaderPair[1],
          ])
        );

      return conds;
    };

    listener.addTargets("ListenerDefault", {
      priority: 20,
      conditions: makeConditions("/*"),
      targets: [props.targetDefault],
    });

    for (let [key, value] of Object.entries(props.targetPaths)) {
      // we need a safe version of the key purely for cloudformation ids
      const safeKey = key.replace(/[^a-z]+/gi, "");

      listener.addTargets(`ListenerPath${safeKey}`, {
        priority: 10,
        conditions: makeConditions(key),
        targets: [value],
      });
    }
  }

  /**
   * Construct any relevant DNS entries needed to point to the load balancer.
   *
   * @param props
   * @private
   */
  private makeDns(props: MultiTargetLoadBalancerProps) {

    const albZone = HostedZone.fromHostedZoneAttributes(this, "AlbZone", {
      hostedZoneId: props.nameZoneId,
      zoneName: props.nameDomain,
    });

    const albDns = new ARecord(this, "AlbAliasRecord", {
      zone: albZone,
      recordName: props.nameHost,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(this.loadBalancer)),
    });
  }
}
