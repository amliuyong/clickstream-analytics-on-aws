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

import {
  ACMClient,
  ListCertificatesCommand,
  CertificateStatus,
  CertificateSummary,
} from '@aws-sdk/client-acm';

import { getPaginatedResults } from '../../common/paginator';

export interface CertificateInfo {
  readonly arn: string;
  readonly domain?: string;
  readonly id?: string;
  readonly name?: string;
}

export const ListCertificates = async (region: string) => {
  const certificates: CertificateInfo[] = [];
  const acmClient = new ACMClient({ region });
  const records = await getPaginatedResults(async (Marker: any) => {
    const params: ListCertificatesCommand = new ListCertificatesCommand({
      NextToken: Marker,
      CertificateStatuses: [CertificateStatus.ISSUED],
    });
    const queryResponse = await acmClient.send(params);
    return {
      marker: queryResponse.NextToken,
      results: queryResponse.CertificateSummaryList,
    };
  });
  for (let cert of records as CertificateSummary[]) {
    if (cert.CertificateArn) {
      certificates.push({
        arn: cert.CertificateArn,
        domain: cert.DomainName ?? '',
      });
    }
  }
  return certificates;
};