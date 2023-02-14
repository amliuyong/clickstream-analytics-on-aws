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

import { Aspects, CfnResource, Duration, IAspect, Stack } from 'aws-cdk-lib';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import {
  Cluster,
  AsgCapacityProvider,
  ContainerImage,
  Ec2TaskDefinition,
  LogDriver,
  NetworkMode,
  Ec2Service,
  PropagatedTagSource,
  CfnClusterCapacityProviderAssociations,
} from 'aws-cdk-lib/aws-ecs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct, IConstruct } from 'constructs';
import { addCfnNagSuppressRules } from '../../common/cfn-nag';
import { DefaultFleetProps, RESOURCE_ID_PREFIX } from '../ingestion-server';

import { ECSClusterProps, EcsServiceResult } from './ecs-cluster';

export interface ServiceProps extends ECSClusterProps {
  ecsCluster: Cluster;
  capacityProvider: AsgCapacityProvider;
  autoScalingGroup: AutoScalingGroup;
  proxyImage: ContainerImage;
  workerImage: ContainerImage;
}

export function crateECSService(
  scope: Construct,
  props: ServiceProps,
): EcsServiceResult {
  const ecsAsgSetting = props.fleetProps;
  const taskDefinition = new Ec2TaskDefinition(scope, `${RESOURCE_ID_PREFIX}ecs-task-def`, {
    networkMode: NetworkMode.AWS_VPC,
  });

  let workerConnections = DefaultFleetProps.proxyMaxConnections;
  if (props.fleetProps.proxyMaxConnections) {
    workerConnections = props.fleetProps.proxyMaxConnections;
  }

  const proxyLogGroup = new LogGroup(scope, 'proxy-log', {
    retention: RetentionDays.ONE_MONTH,
  });

  const workerLogGroup = new LogGroup(scope, 'worker-log', {
    retention: RetentionDays.ONE_MONTH,
  });

  addCfnNagSuppressRules(proxyLogGroup.node.defaultChild as CfnResource, [{
    id: 'W84',
    reason: 'By default, log group data is always encrypted in CloudWatch Logs',
  }]);

  addCfnNagSuppressRules(workerLogGroup.node.defaultChild as CfnResource, [{
    id: 'W84',
    reason: 'By default, log group data is always encrypted in CloudWatch Logs',
  }]);

  const proxyContainer = taskDefinition.addContainer('proxy', {
    image: props.proxyImage,
    memoryReservationMiB:
      ecsAsgSetting.proxyReservedMemory,
    cpu: ecsAsgSetting.proxyCpu,
    portMappings: [
      {
        containerPort: 8088,
      },
    ],
    environment: {
      NGINX_WORKER_CONNECTIONS: `${workerConnections}`,
      SERVER_ENDPOINT_PATH: props.serverEndpointPath,
      SERVER_CORS_ORIGIN: props.serverCorsOrigin,
    },
    logging: LogDriver.awsLogs({
      streamPrefix: 'proxy',
      logGroup: proxyLogGroup,
    }),
  });

  taskDefinition.addContainer('worker', {
    image: props.workerImage,
    memoryReservationMiB:
      ecsAsgSetting.workerReservedMemory,
    cpu: ecsAsgSetting.workerCpu,
    portMappings: getVectorPortMappings(),
    environment: getVectorEnvs(scope, props),
    logging: LogDriver.awsLogs({
      streamPrefix: 'worker',
      logGroup: workerLogGroup,
    }),
  });

  const minHealthyPercent = ecsAsgSetting.taskMax == 1 ? 0 : 50;

  const ecsService = new Ec2Service(scope, `${RESOURCE_ID_PREFIX}ecs-service`, {
    cluster: props.ecsCluster,
    taskDefinition,
    securityGroups: [props.ecsSecurityGroup],
    assignPublicIp: false,
    healthCheckGracePeriod: Duration.seconds(60),
    minHealthyPercent,
    propagateTags: PropagatedTagSource.SERVICE,
    capacityProviderStrategies: [
      {
        capacityProvider: props.capacityProvider.capacityProviderName,
        weight: 1,
      },
    ],
  });
  addScalingPolicy(ecsService, ecsAsgSetting);

  Aspects.of(scope).add(new HotfixCapacityProviderDependencies());

  return {
    ecsService,
    taskDefinition,
    httpContainerName: proxyContainer.containerName,
  };
}

function getVectorEnvs(scope: Construct, props: ECSClusterProps) {
  let workerThreads = DefaultFleetProps.workerThreads;
  let streamAckEnable = DefaultFleetProps.workerStreamAckEnable;

  if (props.fleetProps.workerThreads) {
    workerThreads = props.fleetProps.workerThreads;
  }
  if (props.fleetProps?.workerStreamAckEnable) {
    streamAckEnable = props.fleetProps.workerStreamAckEnable;
  }

  return {
    AWS_REGION: Stack.of(scope).region,
    AWS_MSK_BROKERS: props.kafkaSinkConfig?.kafkaBrokers || '__NOT_SET__',
    AWS_MSK_TOPIC: props.kafkaSinkConfig?.kafkaTopic || '__NOT_SET__',
    STREAM_ACK_ENABLE: `${streamAckEnable}`,
    WORKER_THREADS_NUM: `${workerThreads}`,
  };
}

function getVectorPortMappings() {
  return [
    {
      containerPort: 8685,
    },
    {
      containerPort: 8686,
    },
  ];
}

function addScalingPolicy(
  ecsService: Ec2Service,
  asgTaskConfig: {
    taskMax: number;
    taskMin: number;
    scaleOnCpuUtilizationPercent?: number;
  },
) {
  const scaling = ecsService.autoScaleTaskCount({
    maxCapacity: asgTaskConfig.taskMax,
    minCapacity: asgTaskConfig.taskMin,
  });
  scaling.scaleOnCpuUtilization('CpuScaling', {
    targetUtilizationPercent: asgTaskConfig.scaleOnCpuUtilizationPercent || 50,
    scaleInCooldown: Duration.minutes(45),
    scaleOutCooldown: Duration.minutes(1),
  });
}

class HotfixCapacityProviderDependencies implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof Ec2Service) {
      const children = node.cluster.node.findAll();
      for (const child of children) {
        if (child instanceof CfnClusterCapacityProviderAssociations) {
          child.node.addDependency(node.cluster);
          node.node.addDependency(child);
        }
      }
    }
  }
}
