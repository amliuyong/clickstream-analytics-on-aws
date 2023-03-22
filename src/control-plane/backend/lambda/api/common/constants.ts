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

// Get the DynamoDB table name from environment variables
const clickStreamTableName = process.env.CLICK_STREAM_TABLE_NAME;
const dictionaryTableName = process.env.DICTIONARY_TABLE_NAME;
const stackActionStateMachineArn = process.env.STACK_ACTION_SATE_MACHINE;
const prefixTimeGSIName = process.env.PREFIX_TIME_GSI_NAME;
const serviceName = process.env.POWERTOOLS_SERVICE_NAME;
const awsRegion = process.env.AWS_REGION;
const awsAccountId = process.env.AWS_ACCOUNT_ID;
const awsUrlSuffix = process.env.AWS_URL_SUFFIX;
const s3MainRegion = process.env.S3_MAIN_REGION;

export {
  clickStreamTableName,
  dictionaryTableName,
  stackActionStateMachineArn,
  prefixTimeGSIName,
  serviceName,
  awsRegion,
  awsAccountId,
  awsUrlSuffix,
  s3MainRegion,
};