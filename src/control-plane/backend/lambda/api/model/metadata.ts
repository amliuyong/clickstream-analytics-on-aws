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

import { MetadataEventType } from '../common/types';

export interface IMetadataEvent {
  readonly id: string;
  readonly type: string;
  readonly prefix: string;

  readonly projectId: string;
  readonly appId: string;

  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly eventType: MetadataEventType;
  readonly hasData: boolean;
  readonly platform: string;
  readonly dataVolumeLastDay: number;
  attributes? : IMetadataEventAttribute[];

  readonly createAt: number;
  readonly updateAt: number;
  readonly operator: string;
  readonly deleted: boolean;
}

export interface IMetadataAttributeValue {
  readonly value: string;
  readonly displayValue: string;
}

export interface IMetadataEventAttribute {
  readonly id: string;
  readonly type: string;
  readonly prefix: string;

  readonly projectId: string;
  readonly appId: string;

  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly valueType: string;
  readonly valueEnum: IMetadataAttributeValue[];

  readonly createAt: number;
  readonly updateAt: number;
  readonly operator: string;
  readonly deleted: boolean;
}

export interface IMetadataUserAttribute {
  readonly id: string;
  readonly type: string;
  readonly prefix: string;

  readonly projectId: string;
  readonly appId: string;

  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly eventType: string;

  readonly createAt: number;
  readonly updateAt: number;
  readonly operator: string;
  readonly deleted: boolean;
}