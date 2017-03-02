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

const Gatherer = require('./gatherer');

/* global window */

/* istanbul ignore next */
function getViewportDimensions() {
  // window.innerWidth to get the scrollable size of the window (irrespective of zoom)
  // window.outerWidth to get the size of the visible area
  // window.devicePixelRatio to get ratio of logical pixels to physical pixels
  return Promise.resolve({
    scrollPosition: {x: window.scrollX, y: window.scrollY},
    scrollWidth: window.innerWidth,
    scrollHeight: window.innerHeight,
    viewportWidth: window.outerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
  });
}

class ViewportDimensions extends Gatherer {

  /**
   * @param {!Object} options
   * @return {!Promise<{scrollWidth: number, viewportWidth: number, devicePixelRatio: number}>}
   */
  afterPass(options) {
    const driver = options.driver;

    return driver.evaluateAsync(`(${getViewportDimensions.toString()}())`)

    .then(returnedValue => {
      if (!Number.isFinite(returnedValue.scrollWidth) ||
          !Number.isFinite(returnedValue.scrollHeight) ||
          !Number.isFinite(returnedValue.viewportWidth) ||
          !Number.isFinite(returnedValue.viewportHeight) ||
          !Number.isFinite(returnedValue.devicePixelRatio)) {
        const results = JSON.stringify(returnedValue);
        throw new Error(`ViewportDimensions results were not numeric: ${results}`);
      }

      return returnedValue;
    });
  }
}

module.exports = ViewportDimensions;
