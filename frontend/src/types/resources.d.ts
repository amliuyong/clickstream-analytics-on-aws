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

export {};

declare global {
  interface RegionResponse {
    id: string;
    cn_name: string;
    en_name: string;
  }

  interface VPCResponse {
    cidr: string;
    id: string;
    isDefault: boolean;
    name: string;
  }

  interface SubnetResponse {
    id: string;
    name: string;
    cidr: string;
    availabilityZone: string;
    type: string;
  }

  interface SDKResponse {
    data: [{ name: string; value: string }];
    name: 'SDK_Type';
  }

  interface HostedZoneResponse {
    id: string;
    name: string;
  }

  interface S3Response {
    name: string;
  }

  interface MSKResponse {
    arn: string;
    name: string;
    securityGroupId: string;
    state: string;
    type: string;
  }

  interface RedshiftResponse {
    endpoint: {
      Address: string;
      Port: string;
    };
    Address: string;
    Port: string;
    name: string;
    nodeType: string;
    status: string;
  }

  interface QuickSightResponse {
    arn: string;
    id: string;
    name: string;
  }
}