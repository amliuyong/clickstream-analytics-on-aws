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


const emrMock = {
  EMRServerlessClient: jest.fn(() => {
    return {
      send: jest.fn(() => {
        return {
          applicationId: 'testApplicationId',
        };
      }),
    };
  }),
  StartJobRunCommand: jest.fn(() => { return { name: 'StartJobRunCommand' }; }),
  StartJobRunCommandInput: jest.fn(() => { return { name: 'StartJobRunCommandInput' }; }),
};

jest.mock('@aws-sdk/client-emr-serverless', () => {
  return emrMock;
});

jest.mock('../../src/common/s3', () => {
  return {
    readS3ObjectAsJson: jest.fn(() => undefined),
    putStringToS3: jest.fn(() => { }),
  };
});

import { EMRServerlessUtil } from '../../src/data-pipeline/lambda/emr-job-submitter/emr-client-util';

process.env.EMR_SERVERLESS_APPLICATION_ID='testApplicationId',
process.env.PROJECT_ID = 'test_proj_001';
process.env.APP_IDS = 'app1,app2';
process.env.ROLE_ARN = 'arn:aws::role:role1';
process.env.GLUE_CATALOG_ID = 'cid_001';
process.env.GLUE_DB = 'test_db';
process.env.SOURCE_TABLE_NAME = 'source_table';
process.env.SINK_TABLE_NAME = 'sink_table';
process.env.SOURCE_S3_BUCKET_NAME = 'test-bucket-src';
process.env.SOURCE_S3_PREFIX = 'src-prefix/';
process.env.SINK_S3_BUCKET_NAME = 'test-bucket-sink';
process.env.SINK_S3_PREFIX = 'sink-prefix/';
process.env.PIPELINE_S3_BUCKET_NAME = 'test-pipe-line-bucket';
process.env.PIPELINE_S3_PREFIX = 'pipeline-prefix/';
process.env.DATA_FRESHNESS_IN_HOUR = '24';
process.env.SCHEDULE_EXPRESSION = 'rate(1 day)';
process.env.TRANSFORMER_AND_ENRICH_CLASS_NAMES = 'com.test.ClassMain,com.test.ClassMainTest';
process.env.S3_PATH_PLUGIN_JARS = 's3://test/test1.jar,s3://test/test2.jar';
process.env.S3_PATH_PLUGIN_FILES = 's3://test/test1.txt,s3://test/test2.txt';
process.env.S3_PATH_ENTRY_POINT_JAR = 's3://test/main.jar';
process.env.OUTPUT_FORMAT = 'json';


test('start ETL job', async () => {
  await EMRServerlessUtil.start({});
  expect(emrMock.StartJobRunCommand.mock.calls.length).toEqual(1);
});


test('start ETL job with timestamp - string', async () => {
  await EMRServerlessUtil.start({
    startTimestamp: '2023-03-12T09:33:26.572Z',
    endTimestamp: '2023-03-13T09:33:26.572Z',
  });
  expect(emrMock.StartJobRunCommand.mock.calls.length).toEqual(1);

  const expectedStartParam = {
    applicationId: 'testApplicationId',
    executionRoleArn: 'arn:aws::role:role1',
    // "name": "282407d2-3847-479d-8bae-c64e3badc6c5",
    jobDriver: {
      sparkSubmit: {
        entryPoint: 's3://test/main.jar',
        entryPointArguments: [
          'test_db',
          'source_table',
          '1678613606572',
          '1678700006572',
          `s3://test-pipe-line-bucket/pipeline-prefix/test_proj_001/corrupted_records/${(new Date()).toISOString().split('T')[0]}/1678613606572-1678700006572`, // pipeline data path
          'com.test.ClassMain,com.test.ClassMainTest',
          's3://test-bucket-sink/sink-prefix/test_proj_001/sink_table/', // output path
          'test_proj_001',
          'app1,app2',
          '24',
          'json',
        ],
        sparkSubmitParameters: '--class sofeware.aws.solution.clickstream.DataProcessor \
--jars s3://test/main.jar,s3://test/test1.jar,s3://test/test2.jar \
--files s3://test/test1.txt,s3://test/test2.txt \
--conf spark.hadoop.hive.metastore.client.factory.class=com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory \
--conf spark.driver.cores=4 --conf spark.driver.memory=14g \
--conf spark.executor.cores=4 --conf spark.executor.memory=14g',
      },
    },
    configurationOverrides: {
      monitoringConfiguration:
            {
              s3MonitoringConfiguration:
                {
                  logUri: 's3://test-pipe-line-bucket/pipeline-prefix/pipeline-logs/test_proj_001/',
                },
            },
    },
  };
  //@ts-ignore
  const actParam = emrMock.StartJobRunCommand.mock.calls[0][0] as any;
  delete actParam.name;
  expect(actParam).toEqual(expectedStartParam);

});


test('start ETL job with timestamp - number', async () => {
  await EMRServerlessUtil.start({
    startTimestamp: '1678700304279',
  });
  expect(emrMock.StartJobRunCommand.mock.calls.length).toEqual(1);
});

test('start ETL job with timestamp - error', async () => {
  let errMsg = '';
  try {
    await EMRServerlessUtil.start({
      startTimestamp: '2023-03-13T09:33:26.572Z',
      endTimestamp: '2023-03-10T09:33:26.572Z',
    });
  } catch (e: any) {
    errMsg = e.message;
  }
  expect(errMsg).toEqual('endTimestamp less than startTimestamp');

});

