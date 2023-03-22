/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

import { RedshiftClient, DescribeClustersCommand, Cluster, Endpoint } from '@aws-sdk/client-redshift';
import { getPaginatedResults } from '../../common/paginator';

export interface RedshiftCluster {
  readonly name: string;
  readonly nodeType: string;
  readonly endpoint?: Endpoint;
  readonly status: string;
}

export const describeRedshiftClusters = async (region: string, vpcId: string) => {
  const redshiftClient = new RedshiftClient({ region });

  const records = await getPaginatedResults(async (Marker: any) => {
    const params: DescribeClustersCommand = new DescribeClustersCommand({
      Marker,
    });
    const queryResponse = await redshiftClient.send(params);
    return {
      marker: queryResponse.Marker,
      results: queryResponse.Clusters,
    };
  });
  const clusters: RedshiftCluster[] = [];
  for (let cluster of records as Cluster[]) {
    if (cluster.VpcId === vpcId) {
      clusters.push({
        name: cluster.ClusterIdentifier ?? '',
        nodeType: cluster.NodeType ?? '',
        endpoint: cluster.Endpoint,
        status: cluster.ClusterStatus ?? '',
      });
    }
  }
  return clusters;
};