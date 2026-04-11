/**
 * lastfm.js — Last.fm scrobbling integration.
 *
 * Handles: session management (connect/disconnect), nowPlaying updates,
 * scrobble submissions, and track.love. Uses the MD5 implementation from
 * md5.js to sign API requests.
 *
 * The Last.fm API key and secret are defined here. Session keys are stored
 * in localStorage so scrobbling persists across page reloads.
 */

firetable.lastfm = {

  /** @type {string|false}  Last.fm session key, or false if not connected */
  sk: false,

  /** @type {string}  Last.fm API key */
  key: "e86f3b80e48769c03f2b4e0609e12924",

  /** @type {string}  Last.fm API shared secret (used for signing requests) */
  secret: "838d63e62b556f74176656640b75e33e",

  /** @type {number|null}  Unix timestamp (seconds) when the current song started */
  songStart: null,

  /** @type {number|null}  Duration of the current song in seconds */
  duration: null,

  /** @type {number|null}  setTimeout ID for the scrobble timer */
  timer: null,

  // ─── Session Management ────────────────────────────────────────────────

  /**
   * Disconnect the Last.fm session and clear stored credentials.
   * Re-renders the settings link to allow re-connecting.
   */
  killSession: function () {
    firetable.lastfm.sk = false;
    localStorage[STORAGE.lastfmSession] = firetable.lastfm.sk;
    $("#scrobtoggle").html(
      '<a href="http://www.last.fm/api/auth/?api_key=' + firetable.lastfm.key +
      '&cb=' + window.location.href + '">Set up last.fm scrobbling</a>'
    );
  },

  /**
   * Handle a successful auth.getSession response from Last.fm.
   * Parses the session key from the XHR response and stores it.
   * @param {XMLHttpRequest} xhr - The completed XHR object
   * @returns {Function} onload callback
   */
  newSession: function (xhr) {
    return function () {
      var jsonResponse = JSON.parse(xhr.responseText);
      firetable.lastfm.sk = jsonResponse.session.key;
      localStorage[STORAGE.lastfmSession] = firetable.lastfm.sk;
      $("#scrobtoggle").html(
        '<a onclick="firetable.lastfm.killSession()" href="#">Disconnect Lastfm Scrobbling</a>'
      );
    };
  },

  // ─── API Calls ─────────────────────────────────────────────────────────

  /**
   * Submit a scrobble (track.scrobble) for the current song.
   * Called automatically after ~(duration - 3s) of playback.
   */
  scrobble: function () {
    var song = firetable.song;
    var track = firetable.lastfm._cleanForScrobble(song.title);

    var params = {
      artist:    song.artist,
      track:     track,
      timestamp: firetable.lastfm.songStart,
      api_key:   firetable.lastfm.key,
      sk:        firetable.lastfm.sk,
      method:    "track.scrobble"
    };

    params.api_sig = firetable.lastfm.getApiSignature(params);
    var requestUrl = LASTFM_API_URL + '?' + serialize(params);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', requestUrl, true);
    xhr.onload = function () { console.log("scrobbled"); };
    xhr.onerror = firetable.lastfm._onAjaxError;
    xhr.send();
  },

  /**
   * Send a track.love for the current song.
   */
  love: function () {
    var song = firetable.song;
    var track = firetable.lastfm._cleanForScrobble(song.title);

    var params = {
      artist:  song.artist,
      track:   track,
      api_key: firetable.lastfm.key,
      sk:      firetable.lastfm.sk,
      method:  "track.love"
    };

    params.api_sig = firetable.lastfm.getApiSignature(params);
    var requestUrl = LASTFM_API_URL + '?' + serialize(params);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', requestUrl, true);
    xhr.onload = function () { console.log("loved"); };
    xhr.onerror = firetable.lastfm._onAjaxError;
    xhr.send();
  },

  /**
   * Send a track.updateNowPlaying to Last.fm.
   * Called immediately when a new song starts.
   */
  nowPlaying: function () {
    var song = firetable.song;
    var track = firetable.lastfm._cleanForScrobble(song.title);

    var params = {
      artist:   song.artist,
      track:    track,
      duration: firetable.lastfm.duration,
      api_key:  firetable.lastfm.key,
      sk:       firetable.lastfm.sk,
      method:   "track.updateNowPlaying"
    };

    params.api_sig = firetable.lastfm.getApiSignature(params);
    var requestUrl = LASTFM_API_URL + '?' + serialize(params);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', requestUrl, true);
    xhr.onload = function () { console.log("nowplaying updated"); };
    xhr.onerror = firetable.lastfm._onAjaxError;
    xhr.send();
  },

  // ─── Internal Helpers ──────────────────────────────────────────────────

  /**
   * Build the api_sig parameter for a Last.fm request.
   * Sorts params alphabetically, concatenates key+value pairs,
   * appends the shared secret, and returns the MD5 hash.
   * @param {Object} params - API parameters (excluding api_sig)
   * @returns {string} 32-char hex MD5 signature
   */
  getApiSignature: function (params) {
    var keys = [];
    for (var key in params) {
      if (params.hasOwnProperty(key)) keys.push(key);
    }
    keys.sort();

    var paramString = "";
    for (var i = 0; i < keys.length; i++) {
      paramString += keys[i] + params[keys[i]];
    }
    return calcMD5(paramString + firetable.lastfm.secret);
  },

  /**
   * Strip common YouTube title suffixes that pollute scrobble data.
   * e.g. " (Official Audio)", " (Official Video)"
   * @param {string} title
   * @returns {string} Cleaned title
   */
  _cleanForScrobble: function (title) {
    return title.replace(/ \([oO]fficial (?:[aA]udio|[vV]ideo)\)/, "");
  },

  /**
   * Log Last.fm API errors to the console.
   * @param {XMLHttpRequest} xhr
   * @param {string} status
   * @param {string} error
   */
  _onAjaxError: function (xhr, status, error) {
    console.error("Last.fm API error:", xhr, status, error);
  }
};
