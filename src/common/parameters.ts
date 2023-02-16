/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  CfnParameter,
} from 'aws-cdk-lib';

import { Construct, IConstruct } from 'constructs';
import {
  DOMAIN_NAME_PATTERN,
  HOST_ZONE_ID_PATTERN,
  PARAMETER_GROUP_LABEL_DOMAIN,
  PARAMETER_GROUP_LABEL_VPC,
  PARAMETER_LABEL_HOST_ZONE_ID,
  PARAMETER_LABEL_HOST_ZONE_NAME,
  PARAMETER_LABEL_PRIVATE_SUBNETS,
  PARAMETER_LABEL_PUBLIC_SUBNETS,
  PARAMETER_LABEL_RECORD_NAME,
  PARAMETER_LABEL_VPCID,
  RECORD_NAME_PARRERN,
  SUBNETS_PATTERN,
  VPC_ID_PARRERN,
  KAFKA_BROKERS_PATTERN,
  KAFKA_TOPIC_PATTERN,
} from './constant';

export enum SubnetParameterType {
  'List',
  'String'
}

interface ParameterProps {
  type?: string;
  description?: string;
  minLength?: number;
  default?: string;
  allowedPattern?: string;
  constraintDescription?: string;
}

export interface NetworkParameters {
  vpcId: CfnParameter;
  publicSubnets?: CfnParameter;
  privateSubnets: CfnParameter;
  paramLabels: any[];
  paramGroups: any[];
}

export interface DomainParameters {
  hostedZoneId: CfnParameter;
  hostedZoneName: CfnParameter;
  recordName: CfnParameter;
  paramLabels: any[];
  paramGroups: any[];
}

export class Parameters {

  public static createHostedZoneIdParameter(scope: Construct, id?: string) : CfnParameter {
    return new CfnParameter(scope, id ?? 'HostedZoneId', {
      description: 'The hosted zone ID in Route 53.',
      type: 'AWS::Route53::HostedZone::Id',
      allowedPattern: `${HOST_ZONE_ID_PATTERN}`,
      constraintDescription: `Host zone id must match pattern ${HOST_ZONE_ID_PATTERN}`,
    });
  }

  public static createHostedZoneNameParameter(scope: Construct, id?: string) : CfnParameter {
    return new CfnParameter(scope, id ?? 'HostedZoneName', {
      description: 'The hosted zone name in Route 53',
      type: 'String',
      allowedPattern: `^${DOMAIN_NAME_PATTERN}$`,
      constraintDescription: `Host zone name must match pattern ${DOMAIN_NAME_PATTERN}`,
    });
  }

  public static createDomainNameParameter(scope: Construct, id?: string) : CfnParameter {
    return new CfnParameter(scope, id ?? 'DomainName', {
      description: 'The custom domain name.',
      type: 'String',
      allowedPattern: `^${DOMAIN_NAME_PATTERN}$`,
      constraintDescription: `Domain name must match pattern ${DOMAIN_NAME_PATTERN}`,
    });
  }

  public static createRecordNameParameter(scope: Construct, id?: string) : CfnParameter {
    return new CfnParameter(scope, id ?? 'RecordName', {
      description: 'The record name of custom domain.',
      type: 'String',
      allowedPattern: `${RECORD_NAME_PARRERN}`,
      constraintDescription: `Record name must match pattern ${RECORD_NAME_PARRERN}`,
    });
  }

  public static createVpcIdParameter(scope: Construct, id?: string) : CfnParameter {
    return new CfnParameter(scope, id ?? 'VpcId', {
      description: 'Select the virtual private cloud (VPC).',
      type: 'AWS::EC2::VPC::Id',
      allowedPattern: `^${VPC_ID_PARRERN}$`,
      constraintDescription: `VPC id must match pattern ${VPC_ID_PARRERN}`,
    });
  }

  public static createPublicSubnetParameter(scope: Construct, id?: string, type: SubnetParameterType = SubnetParameterType.List) : CfnParameter {

    if (type === SubnetParameterType.List) {
      return new CfnParameter(scope, id ?? 'PublicSubnets', {
        description: 'Select at least one public subnet in each Availability Zone.',
        type: 'List<AWS::EC2::Subnet::Id>',
      });
    } else {
      return new CfnParameter(scope, 'PublicSubnetIds', {
        description: 'Comma delimited public subnet ids.',
        type: 'String',
        allowedPattern: `^${SUBNETS_PATTERN}$`,
        constraintDescription: `Public subnet ids must have at least 2 subnets and match pattern ${SUBNETS_PATTERN}`,
      });
    }
  }

  public static createPrivateSubnetParameter(scope: Construct, id?: string, type: SubnetParameterType = SubnetParameterType.List) : CfnParameter {

    if (type === SubnetParameterType.List) {
      return new CfnParameter(scope, id ?? 'PrivateSubnets', {
        description: 'Select at least one private subnet in each Availability Zone.',
        type: 'List<AWS::EC2::Subnet::Id>',
      });
    } else {
      return new CfnParameter(scope, 'PrivateSubnetIds', {
        description: 'Comma delimited private subnet ids.',
        type: 'String',
        allowedPattern: `^${SUBNETS_PATTERN}$`,
        constraintDescription: `Private subnet ids must have at least 2 subnets and match pattern ${SUBNETS_PATTERN}`,
      });
    }
  }

  public static createNetworkParameters(
    scope: Construct,
    needPublicSubnets: boolean,
    subnetParameterType?: SubnetParameterType,
    paramGroups?: any[],
    paramLabels?: any,
    customId?: string) : NetworkParameters {
    const groups: any[] = paramGroups ?? [];
    const labels: any = paramLabels ?? {};
    const res: any[] = [];

    const vpcId = this.createVpcIdParameter(scope, customId ?? undefined);
    labels[vpcId.logicalId] = {
      default: PARAMETER_LABEL_VPCID,
    };
    res.push(vpcId.logicalId);

    let publicSubnets: CfnParameter | undefined;
    if (needPublicSubnets) {
      publicSubnets = this.createPublicSubnetParameter(scope, customId ?? undefined, subnetParameterType ?? SubnetParameterType.List);
      labels[publicSubnets.logicalId] = {
        default: PARAMETER_LABEL_PUBLIC_SUBNETS,
      };
      res.push(publicSubnets.logicalId);

    }

    const privateSubnets = this.createPrivateSubnetParameter(scope, customId ?? undefined, subnetParameterType ?? SubnetParameterType.List);
    labels[privateSubnets.logicalId] = {
      default: PARAMETER_LABEL_PRIVATE_SUBNETS,
    };
    res.push(privateSubnets.logicalId);

    groups.push({
      Label: { default: PARAMETER_GROUP_LABEL_VPC },
      Parameters: res,
    });

    return {
      vpcId,
      publicSubnets,
      privateSubnets,
      paramLabels: labels,
      paramGroups: groups,
    };
  }

  public static createDomainParameters(scope: Construct, paramGroups?: any[], paramLabels?: any, customId?: string) : DomainParameters {

    const groups: any[] = paramGroups ?? [];
    const labels: any = paramLabels ?? {};

    const hostedZoneId = this.createHostedZoneIdParameter(scope, customId ?? undefined);
    labels[hostedZoneId.logicalId] = {
      default: PARAMETER_LABEL_HOST_ZONE_ID,
    };

    const hostedZoneName = this.createHostedZoneNameParameter(scope, customId ?? undefined);
    labels[hostedZoneName.logicalId] = {
      default: PARAMETER_LABEL_HOST_ZONE_NAME,
    };


    const recordName = this.createRecordNameParameter(scope, customId ?? undefined);
    labels[recordName.logicalId] = {
      default: PARAMETER_LABEL_RECORD_NAME,
    };

    groups.push({
      Label: { default: PARAMETER_GROUP_LABEL_DOMAIN },
      Parameters: [hostedZoneId.logicalId, hostedZoneName.logicalId, recordName.logicalId],
    });

    return {
      hostedZoneId,
      hostedZoneName,
      recordName: recordName ?? undefined,
      paramLabels: labels,
      paramGroups: groups,
    };
  }

  public static createMskClusterNameParameter(
    scope: IConstruct,
    id: string = 'MskClusterName',
    props: ParameterProps = {},
  ) {
    const mskClusterNameParam = new CfnParameter(scope, id, {
      description:
        'Amazon managed streaming for apache kafka (Amazon MSK) cluster name',
      type: 'String',
      ...props,
    });
    return mskClusterNameParam;
  }

  public static createKafkaBrokersParameter(
    scope: IConstruct,
    id: string = 'KafkaBrokers',
    allowEmpty: boolean = false,
    props: ParameterProps = {},
  ) {
    let allowedPattern = `${KAFKA_BROKERS_PATTERN}`;
    if (allowEmpty) {
      allowedPattern = `(${allowedPattern})?`;
    }
    const kafkaBrokersParam = new CfnParameter(scope, id, {
      description: 'Kafka brokers string',
      type: 'String',
      allowedPattern: `^${allowedPattern}$`,
      constraintDescription: `${id} must match pattern ${allowedPattern}`,
      ...props,
    });

    return kafkaBrokersParam;
  }

  public static createKafkaTopicParameter(
    scope: IConstruct,
    id: string = 'KafkaTopic',
    allowEmpty: boolean = false,
    props: ParameterProps = {},
  ) {
    let allowedPattern = `${KAFKA_TOPIC_PATTERN}`;
    if (allowEmpty) {
      allowedPattern = `(${allowedPattern})?`;
    }

    const kafkaTopicParam = new CfnParameter(scope, id, {
      description: 'Kafka topic',
      type: 'String',
      allowedPattern: `^${allowedPattern}$`,
      constraintDescription: `KafkaTopic must match pattern ${allowedPattern}`,
      ...props,
    });
    return kafkaTopicParam;
  }

  public static createMskSecurityGroupIdParameter(
    scope: IConstruct,
    id: string = 'SecurityGroupId',
    allowEmpty: boolean = false,
    props: ParameterProps = {},
  ) {
    let allowedPattern = 'sg-[a-f0-9]+';
    if (allowEmpty) {
      allowedPattern = `(${allowedPattern})?`;
    }
    const securityGroupIdParam = new CfnParameter(scope, id, {
      description:
        'Amazon managed streaming for apache kafka (Amazon MSK) security group id',
      type: 'String',
      allowedPattern: `^${allowedPattern}$`,
      constraintDescription: `KafkaTopic must match pattern ${allowedPattern}`,
      ...props,
    });

    return securityGroupIdParam;
  }
}

