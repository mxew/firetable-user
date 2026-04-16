/**
 * constants.js — Named constants used across the firetable application.
 *
 * Replaces magic numbers and hardcoded strings scattered throughout the
 * codebase with a single, documented source of truth.
 */

// ─── Media Types ─────────────────────────────────────────────────────────────
/** YouTube video */
var MEDIA_YOUTUBE = 1;
/** SoundCloud track */
var MEDIA_SOUNDCLOUD = 2;

// ─── Defaults ────────────────────────────────────────────────────────────────
/** Default player volume (0–100) */
var DEFAULT_VOLUME = 80;
/** How long before a user is marked idle (ms) — 5 minutes */
var IDLE_TIMEOUT = 5 * 60000;
/** How long a track preview plays before auto-stopping (ms) — 30 seconds */
var PREVIEW_DURATION = 30 * 1000;
/** 16:9 aspect ratio used for the YouTube player sizing */
var ASPECT_RATIO = 16 / 9;
/** Default brand colour (firetable orange) */
var COLOR_ORANGE = "#F4810B";

// ─── localStorage Keys ──────────────────────────────────────────────────────
/**
 * All localStorage key strings in one place.
 * Usage: localStorage[STORAGE.volume] instead of localStorage["firetableVol"]
 */
var STORAGE = {
  volume:             "firetableVol",
  mute:               "firetableMute",
  disableMedia:       "firetableDisableMedia",
  showImages:         "firetableShowImages",
  showAvatars:        "firetableShowAvatars",
  badoop:             "firetableBadoop",
  desktopNotify:      "firetableDTNM",
  screenControl:      "firetableScreenControl",
  avatarStyle:        "firetableAvatarStyle",
  lastfmSession:      "ftLastfmSession"
};

// ─── External Service URLs ──────────────────────────────────────────────────
/** Avatar / Robohash image base URL */
var AVATAR_BASE_URL = "https://indiediscotheque.com/robots/";
/** SoundCloud link resolver proxy */
var SC_RESOLVE_URL = "https://thompsn.com/resolvesc/";
/** SoundCloud general proxy */
var SC_PROXY_URL = "https://thompsn.com/soundcloud/";
/** SoundCloud API track base URL */
var SC_API_TRACK_URL = "https://api.soundcloud.com/tracks/";
/** Last.fm API base URL */
var LASTFM_API_URL = "https://ws.audioscrobbler.com/2.0/";

// ─── Emoji Data Sources ─────────────────────────────────────────────────────
var EMOJI_URLS = [
  "https://unpkg.com/unicode-emoji-json@0.3.0/data-by-group.json",
  "https://unpkg.com/emojilib@2.4.0/emojis.json",
  "https://unpkg.com/emojilib@3.0.4/dist/emoji-en-US.json"
];

// ─── Search Result Limits ───────────────────────────────────────────────────
/** Max results returned from YouTube / SoundCloud searches */
var SEARCH_MAX_RESULTS = 15;
/** Max results per page for YouTube playlist import pagination */
var IMPORT_PAGE_SIZE = 50;

// ─── Preview Bar Update Interval ────────────────────────────────────────────
/** How often the preview progress bar updates (ms) */
var PREVIEW_BAR_INTERVAL = 200;
/** How often the song progress bar updates (ms) */
var PROGRESS_BAR_INTERVAL = 500;
