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

export interface Project {
  projectId: string;
  type: string;
  name: string;
  tableName: string;
  description: string;
  emails: string;
  platform: string;
  region: string;
  environment: string;
  status: string;
  createAt: number;
  updateAt: number;
  operator: string;
  deleted: boolean;
}

export interface ProjectList {
  totalCount: number | undefined;
  items: Project[];
}
