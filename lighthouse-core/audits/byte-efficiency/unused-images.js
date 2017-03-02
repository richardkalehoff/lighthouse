/**
 * @license
 * Copyright 2017 Google Inc. All rights reserved.
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
 /**
  * @fileoverview Checks to see if images are displayed only outside of the viewport.
  */
'use strict';

const Audit = require('./byte-efficiency-audit');
const URL = require('../../lib/url-shim');

const ALLOWABLE_OFFSCREEN_X = 100;
const ALLOWABLE_OFFSCREEN_Y = 200;

const IGNORE_THRESHOLD_IN_BYTES = 2048;

class UnusedImages extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'Images',
      name: 'unused-images',
      description: 'Unused images',
      helpText: 'Images that are not above the fold should be lazy loaded on interaction',
      requiredArtifacts: ['ImageUsage', 'ViewportDimensions', 'networkRecords']
    };
  }

  /**
   * @param {{top: number, right: number, bottom: number, left: number}} imageRect
   * @param {{scrollWidth: number, scrollHeight: number}} viewportDimensions
   * @return {number}
   */
  static computeVisiblePixels(imageRect, viewportDimensions) {
    const scrollWidth = viewportDimensions.scrollWidth;
    const scrollHeight = viewportDimensions.scrollHeight;

    const top = Math.max(imageRect.top, -1 * ALLOWABLE_OFFSCREEN_Y);
    const right = Math.min(imageRect.right, scrollWidth + ALLOWABLE_OFFSCREEN_X);
    const bottom = Math.min(imageRect.bottom, scrollHeight + ALLOWABLE_OFFSCREEN_Y);
    const left = Math.max(imageRect.left, -1 * ALLOWABLE_OFFSCREEN_X);

    return Math.max(right - left, 0) * Math.max(bottom - top, 0);
  }

  /**
   * @param {!Object} image
   * @param {{scrollWidth: number, scrollHeight: number}} viewportDimensions
   * @return {?Object}
   */
  static computeWaste(image, viewportDimensions) {
    const url = URL.getDisplayName(image.src, {preserveQuery: true});
    const totalPixels = image.clientWidth * image.clientHeight;
    const visiblePixels = this.computeVisiblePixels(image.clientRect, viewportDimensions);
    const wastedRatio = 1 - visiblePixels / totalPixels;
    const totalBytes = image.networkRecord.resourceSize;
    const wastedBytes = Math.round(totalBytes * wastedRatio);

    if (!Number.isFinite(wastedRatio)) {
      return new Error(`Invalid image sizing information ${url}`);
    }

    return {
      url,
      preview: {
        url: image.networkRecord.url,
        mimeType: image.networkRecord.mimeType
      },
      totalBytes,
      wastedBytes,
      wastedPercent: 100 * wastedRatio,
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {{results: !Array<Object>, tableHeadings: Object,
   *     passes: boolean=, debugString: string=}}
   */
  static audit_(artifacts) {
    const images = artifacts.ImageUsage;
    const viewportDimensions = artifacts.ViewportDimensions;

    let debugString;
    const resultsMap = images.reduce((results, image) => {
      if (!image.networkRecord) {
        return results;
      }

      const processed = UnusedImages.computeWaste(image, viewportDimensions);
      if (processed instanceof Error) {
        debugString = processed.message;
        return results;
      }

      // Don't warn about an image that was also used appropriately
      const existing = results.get(processed.preview.url);
      if (!existing || existing.wastedBytes > processed.wastedBytes) {
        results.set(processed.preview.url, processed);
      }

      return results;
    }, new Map());

    const results = Array.from(resultsMap.values())
        .filter(item => item.wastedBytes > IGNORE_THRESHOLD_IN_BYTES);
    return {
      debugString,
      results,
      tableHeadings: {
        preview: '',
        url: 'URL',
        totalKb: 'Original',
        potentialSavings: 'Potential Savings',
      }
    };
  }
}

module.exports = UnusedImages;
