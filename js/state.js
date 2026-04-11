/**
 * state.js — Central application state object for firetable.
 *
 * This is the single source of truth for all runtime state. Every property
 * is documented with its type and purpose. Other modules read/write these
 * properties directly via the global `firetable` object.
 *
 * Also sets up the chat scroll container, idle-detection, and throws early
 * if config.js is missing.
 */

// ─── Config Guard ────────────────────────────────────────────────────────────
if (typeof ftconfigs === "undefined") {
  throw "config.js is missing! Copy config.js.example and rename to config.js. Edit this file and add your own app's information.";
}

// ─── Application State ──────────────────────────────────────────────────────
var firetable = {

  // ── Session ──
  /** @type {boolean}  Has firetable.init() been called? */
  started: false,
  /** @type {boolean}  Is the current user authenticated? */
  loggedIn: false,
  /** @type {string|null}  Current user's UID (set after login) */
  uid: null,
  /** @type {string|null}  Current user's display name */
  uname: null,

  // ── Avatars ──
  /** @type {string}  Robohash set name (e.g. "set1", "set2") */
  avatarset: "set1",
  /** @type {string}  Active avatar style key e.g. "robohash:set1" or "dicebear:pixel-art" */
  avatarStyle: "robohash:set1",

  // ── Preview State ──
  /** @type {number}  Elapsed preview bar counter (seconds, in 0.2 increments) */
  pvCount: 0,
  /** @type {string|false}  Song key currently being previewed, or false */
  preview: false,
  /** @type {number|null}  setInterval ID for the preview progress bar */
  movePvBar: null,
  /** @type {number|null}  setTimeout ID for auto-stopping preview after 30s */
  ptimeout: null,

  // ── Playback ──
  /** @type {number}  Index of the currently-active DJ seat (0-3) */
  playdex: 0,
  /** @type {number|null}  setInterval ID for the song progress bar */
  moveBar: null,
  /** @type {Object|null}  Current song data {cid, type, artist, title, started, duration, …} */
  song: null,
  /** @type {boolean}  Play notification sound on @-mentions? */
  playBadoop: true,

  // ── Idle ──
  /** @type {boolean}  Is the current user idle / tab hidden? */
  idle: false,
  /** @type {number|null}  Timestamp of last idle-state change */
  idleChanged: null,

  // ── Display Preferences ──
  /** @type {boolean}  Show inline images in chat? (typo preserved: "sbhowImages" in original) */
  showImages: false,
  /** @type {string}  Screen control mode: "sync" | "on" | "off" */
  screenControl: "sync",
  /** @type {boolean}  Are festive lights enabled? */
  lights: false,
  /** @type {boolean}  Server-side screen-up/down position (used when screenControl == "sync") */
  screenSyncPos: false,
  /** @type {boolean}  Should media playback be completely disabled? */
  disableMediaPlayback: false,
  /** @type {boolean}  Show avatar images in chat? */
  showAvatars: true,

  // ── SoundCloud ──
  /** @type {number|false}  Seek position (ms) to set when SC widget starts playing */
  scSeek: false,
  /** @type {Object|null}  SoundCloud Widget API instance */
  scwidget: null,
  /** @type {string}  URL of the current SoundCloud track's large artwork */
  scImg: "",
  /** @type {boolean|null}  Has the SoundCloud widget finished loading? */
  scLoaded: null,

  // ── YouTube ──
  /** @type {boolean|null}  Has the YouTube IFrame API finished loading? */
  ytLoaded: null,

  // ── Desktop Notifications ──
  /** @type {boolean}  Send desktop notifications on @-mentions? */
  desktopNotifyMentions: false,

  // ── Theme / Colours ──
  /** @type {string}  The default brand orange (never changes) */
  orange: COLOR_ORANGE,
  /** @type {string}  Current room accent colour (hex) — set by colorsChanged event */
  color: COLOR_ORANGE,
  /** @type {string}  Current text colour for accent backgrounds */
  countcolor: "#fff",

  // ── Playlist / Queue ──
  /** @type {Object|false}  Current playlist data keyed by song ID */
  queue: false,
  /** @type {string|null}  Which playlist panel is currently visible */
  listShowing: null,
  /** @type {number}  Play limit per DJ turn */
  playlimit: 2,

  // ── DOM / Parser ──
  /** @type {DOMParser|null}  Shared DOMParser for stripping HTML */
  parser: null,

  // ── Tag Editing ──
  /** @type {string|null}  Song ID currently being tag-edited */
  songToEdit: null,
  /** @type {Object|null}  Latest tag update data from server */
  tagUpdate: null,

  // ── Search Source Toggle ──
  /** @type {number}  1 = YouTube, 2 = SoundCloud — tracks the "Add" search toggle */
  searchSelectsChoice: MEDIA_YOUTUBE,
  /** @type {number}  1 = YouTube, 2 = SoundCloud, 3 = Dubtrack — tracks the "Import" toggle */
  importSelectsChoice: MEDIA_YOUTUBE,

  // ── Dubtrack Import ──
  /** @type {string|null}  Name parsed from Dubtrack export file */
  dtImportName: null,
  /** @type {Array}  Track list parsed from Dubtrack export file */
  dtImportList: [],

  // ── Chat State ──
  /** @type {string|false}  UID of the last person who sent a chat (for message grouping) */
  lastChatPerson: false,
  /** @type {string|false}  Chat ID of the last grouped message block */
  lastChatId: false,
  /** @type {boolean}  Suppress the first "now playing" chat message on page load */
  nonpmsg: true,

  // ── Mod Tools ──
  /** @type {Object|null}  Ban update subscription data */
  superCopBanUpdates: null,

  // ── Login ──
  /** @type {string|null}  Cached login form HTML (preserved across auth state changes) */
  loginForm: null,

  // ── Emoji ──
  /** @type {Object|null}  Map of shortname → unicode emoji character */
  emojiMap: null,
  /** @type {boolean}  Has the emoji picker been twemoji-parsed? */
  pickerInit: false,

  // ── @-Mention Autocomplete ──
  /** @type {boolean}  Is the user currently in @-mention mode? */
  atLand: false,
  /** @type {Array<string>}  All usernames available for @-mention */
  atUsers: [],
  /** @type {Array<string>}  Filtered usernames matching current @-string */
  atUsersFiltered: [],
  /** @type {string}  Characters typed after the @ symbol so far */
  atString: "",

  // ── Debug ──
  /** @type {boolean}  Enable verbose console logging */
  debug: false
};

// ─── Version ─────────────────────────────────────────────────────────────────
firetable.version = "01.10.8";

// ─── Chat Scroll Container ──────────────────────────────────────────────────
/** Native scroll container wrapper preserving the legacy chatScroll API shape. */
var chatScrollElement = document.getElementById('chatsWrap');
var chatScroll = chatScrollElement ? {
  el: chatScrollElement,
  contentEl: chatScrollElement,
  contentWrapperEl: chatScrollElement,
  getScrollElement: function () {
    return chatScrollElement;
  }
} : null;

if (chatScroll) {
  chatScroll.getScrollElement().addEventListener('scroll', function () {
    if (firetable.utilities.isChatPrettyMuchAtBottom()) {
      $('#morechats').removeClass('show');
    }
  }, { passive: true });
}

// ─── Global Player Reference ────────────────────────────────────────────────
/** @type {YT.Player}  YouTube IFrame Player instance (set in onYouTubeIframeAPIReady) */
var player;
/** @type {jQuery}  Cloned template element for playlist queue items */
var $playlistItemTemplate;
/** @type {jQuery}  Cloned template element for the tag editor */
var $tagEditorTemplate;

// ─── Idle Detection ─────────────────────────────────────────────────────────
/**
 * Tracks mouse/keyboard activity and fires idle/active events.
 * Sends idle status to the server via ftapi so other users see you as away.
 */
var idlejs = new IdleJs({
  idle: IDLE_TIMEOUT,
  events: ['mousemove', 'keydown', 'mousedown', 'touchstart'],
  onIdle: function () {
    ftapi.actions.changeIdleStatus(true, 1);
  },
  onActive: function () {
    ftapi.actions.changeIdleStatus(false, 1);
  },
  onHide: function () {
    ftapi.actions.changeIdleStatus(true, 1);
    firetable.debug && console.log("Tab hidden — marking idle");
  },
  onShow: function () {
    ftapi.actions.changeIdleStatus(false, 1);
  },
  keepTracking: true,
  startAtIdle: false
});
idlejs.start();
