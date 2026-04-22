/**
 * instagram.js — Type definitions (JSDoc) for Instagram analytics data.
 *
 * This file documents the shape of all Instagram-related data objects
 * used across the app. When the project migrates to TypeScript, rename
 * to instagram.ts and convert @typedef blocks to `interface` declarations.
 *
 * Nothing is exported at runtime — this file is documentation only.
 */

/**
 * @typedef {Object} InstagramAudienceAgeRange
 * @property {string} range   - e.g. "18-24"
 * @property {number} percent - 0–100
 */

/**
 * @typedef {Object} InstagramAudienceGender
 * @property {number} male   - percentage 0–100
 * @property {number} female - percentage 0–100
 * @property {number} other  - percentage 0–100
 */

/**
 * @typedef {Object} InstagramAudienceCity
 * @property {string} city    - City name (e.g. "Lagos, Nigeria")
 * @property {number} percent - 0–100
 */

/**
 * @typedef {Object} InstagramAgeGenderBucket
 * @property {string} range  - e.g. '18-24'
 * @property {number} female - percent
 * @property {number} male   - percent
 */

/**
 * @typedef {Object} InstagramAudienceDemographics
 * @property {InstagramAudienceAgeRange[]}  ageRanges
 * @property {InstagramAudienceGender}      gender
 * @property {InstagramAudienceCity[]}      topCities
 * @property {InstagramAgeGenderBucket[]}   ageGender
 */

/**
 * @typedef {Object} InstagramPost
 * @property {string} id           - Unique post identifier
 * @property {string} thumbnailUrl - URL or placeholder path
 * @property {string} caption      - Post caption (may be truncated)
 * @property {number} likes
 * @property {number} comments
 * @property {number} reach
 * @property {number} impressions
 * @property {string} postedAt     - ISO 8601 date string
 * @property {'image'|'video'|'carousel'} mediaType
 */

/**
 * @typedef {Object} InstagramProfile
 * @property {string} username
 * @property {string} displayName
 * @property {string} profilePictureUrl
 * @property {number} followerCount
 * @property {number} followingCount
 * @property {number} mediaCount        - Total posts published
 * @property {number} engagementRate    - Percentage, e.g. 4.2 means 4.2%
 */

/**
 * @typedef {Object} InstagramInsights
 * @property {number} reach        - Unique accounts reached (last 30 days)
 * @property {number} impressions  - Total impressions (last 30 days)
 * @property {number} profileViews - Profile visits (last 30 days)
 */

/**
 * @typedef {Object} InstagramData
 * @property {InstagramProfile}           profile
 * @property {InstagramInsights}          insights
 * @property {InstagramAudienceDemographics} audience
 * @property {InstagramPost[]}            recentPosts
 * @property {string}                     fetchedAt    - ISO 8601 timestamp
 * @property {'mock'|'live'}              source       - Data origin flag
 */
