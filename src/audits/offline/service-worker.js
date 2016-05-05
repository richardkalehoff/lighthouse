/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const Audit = require('../audit');

class ServiceWorker extends Audit {
  /**
   * @override
   */
  static get tags() {
    return ['Offline'];
  }

  /**
   * @override
   */
  static get name() {
    return 'service-worker';
  }

  /**
   * @override
   */
  static get description() {
    return 'Has a registered Service Worker';
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const registrations = artifacts.serviceWorkers.versions;
    const activatedRegistrations = registrations.filter(reg => {
      return reg.status === 'activated' &&
          reg.scriptURL.startsWith(artifacts.url);
    });

    return ServiceWorker.generateAuditResult({
      value: activatedRegistrations.length > 0
    });
  }
}

module.exports = ServiceWorker;