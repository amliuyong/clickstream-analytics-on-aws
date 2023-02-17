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

function isEmpty(a: any): boolean {
  if (a === '') return true; //Verify empty string
  if (a === 'null') return true; //Verify null string
  if (a === 'undefined') return true; //Verify undefined string
  if (!a && a !== 0 && a !== '') return true; //Verify undefined and null
  if (Array.prototype.isPrototypeOf(a) && a.length === 0) return true; //Verify empty array
  if (Object.prototype.isPrototypeOf(a) && Object.keys(a).length === 0) return true; //Verify empty objects
  return false;
}

function tryToJson(s: string): any {
  try {
    return JSON.parse(s);
  } catch (error) {
    return s;
  }
}

export {
  isEmpty,
  tryToJson,
};