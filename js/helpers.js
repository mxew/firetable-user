/**
 * helpers.js — General-purpose utility functions for firetable.
 *
 * Contains formatting helpers, HTML escaping, debounce, notification sound,
 * desktop notifications, chat scroll management, avatar URL builder,
 * and the critical `resumeCurrentSong()` helper that replaces 8+ duplicated
 * "calculate elapsed → load YT or SC" blocks from the original code.
 */

firetable.utilities = {

  // ─── Avatar URL ──────────────────────────────────────────────────────────

  /**
   * Build an avatar URL for a user.
   * Supports Robohash (via proxy) and DiceBear (SVG).
   * Style lookup order: explicit `style` param → ftapi.users[uid].avatarStyle
   * → firetable.avatarStyle (own user cache) → "robohash:set1" fallback.
   * @param {string} uid - User ID
   * @param {string} username - Display name
   * @param {string|null} [size="110x110"] - Dimensions (Robohash only)
   * @param {string} [style] - Style key e.g. "robohash:set1" or "dicebear:pixel-art"
   * @returns {string} Full avatar URL
   */
  avatarURL: function (uid, username, size, style) {
    size = size || "110x110";
    if (!style) {
      style = (ftapi.users && ftapi.users[uid] && ftapi.users[uid].avatarStyle)
           || (uid === ftapi.uid ? firetable.avatarStyle : null)
           || "robohash:set1";
    }
    if (style.indexOf("dicebear:") === 0) {
      return "https://api.dicebear.com/9.x/" + style.slice(9) + "/svg?seed=" + encodeURIComponent(uid + username);
    }
    var set = style.indexOf("robohash:") === 0 ? style.slice(9) : firetable.avatarset;
    return AVATAR_BASE_URL + uid + username + ".png?size=" + size + "&set=" + set;
  },

  // ─── Song Title Parsing ──────────────────────────────────────────────────

  /**
   * Split a "Artist - Title" string into { artist, title }.
   * Falls back: if no " - " separator, artist = fallbackArtist, title = the string.
   * @param {string} raw - The raw title string (e.g. "Radiohead - Creep")
   * @param {string} [fallbackArtist=""] - Used when title has no " - " separator
   * @returns {{artist: string, title: string}}
   */
  parseArtistTitle: function (raw, fallbackArtist) {
    var parts = raw.split(" - ");
    var artist = parts[0];
    var title = parts[1];
    if (!title) {
      title = artist;
      artist = fallbackArtist || "";
    }
    return { artist: artist, title: title };
  },

  // ─── Hex ↔ RGB ───────────────────────────────────────────────────────────

  /**
   * Convert a hex colour string to an {r, g, b} object.
   * Handles both 3-char (#abc) and 6-char (#aabbcc) formats.
   * @param {string} hex
   * @returns {{r: number, g: number, b: number}|null}
   */
  hexToRGB: function (hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // ─── Canvas Text Wrapping ────────────────────────────────────────────────

  /**
   * Draw word-wrapped text onto a canvas context.
   * @param {CanvasRenderingContext2D} context
   * @param {string} text
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @param {number} maxWidth - Maximum line width in pixels
   * @param {number} lineHeight - Vertical spacing between lines
   * @returns {number} Number of extra lines drawn (0 if text fit on one line)
   */
  wrapText: function (context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    var lines = 0;
    for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = context.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
        lines++;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
    return lines;
  },

  // ─── Sound / Notifications ───────────────────────────────────────────────

  /**
   * Play an audio notification (the "badoop" sound on @-mentions).
   * Respects the user's playBadoop setting.
   * @param {string} filename - Audio file path without extension (adds .mp3)
   */
  playSound: function (filename) {
    if (firetable.playBadoop) {
      document.getElementById("audilert").setAttribute('src', filename + ".mp3");
    }
  },

  /**
   * Show a browser desktop notification (if permission granted).
   * @param {Object} chatData - Chat message data {id, txt}
   * @param {string} namebo - Display name of the sender
   */
  desktopNotify: function (chatData, namebo) {
    if (Notification) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      } else {
        new Notification(namebo, {
          icon: firetable.utilities.avatarURL(chatData.id, namebo),
          body: chatData.txt
        });
      }
    }
  },

  // ─── Screen (Video Stage) ────────────────────────────────────────────────

  /** Slide the video stage up (hide it) */
  screenUp: function () {
    $('body').removeClass('screen');
  },

  /** Slide the video stage down (show it) */
  screenDown: function () {
    $('body').addClass('screen');
  },

  // ─── Chat Scroll ─────────────────────────────────────────────────────────

  /**
   * Check if the chat is scrolled to (or very near) the bottom.
   * Used to decide whether to auto-scroll on new messages.
   * @returns {boolean}
   */
  isChatPrettyMuchAtBottom: function () {
    if (!chatScroll || !chatScroll.contentWrapperEl) {
      return true;
    }

    var scrollable = chatScroll.contentEl.scrollHeight - chatScroll.el.clientHeight;
    var scrolled = chatScroll.contentWrapperEl.scrollTop;
    return (Math.abs(scrollable - scrolled) <= 25);
  },

  /** Scroll the chat container to the very bottom. */
  scrollToBottom: function () {
    if (!chatScroll || !chatScroll.contentWrapperEl) {
      return;
    }

    chatScroll.contentWrapperEl.scrollTop = chatScroll.contentEl.scrollHeight;
  },

  // ─── HTML / Text Processing ──────────────────────────────────────────────

  /**
   * Escape HTML special characters for safe insertion into the DOM.
   * @param {string} s - Raw string
   * @param {boolean} [preserveCR=false] - If true, preserves carriage returns as &#13;
   * @returns {string} Escaped string
   */
  htmlEscape: function (s, preserveCR) {
    preserveCR = preserveCR ? '&#13;' : '\n';
    return ('' + s)
      .replace(/&/g, '&amp;')
      .replace(/'/g, '\\&apos;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\r\n/g, preserveCR)
      .replace(/[\r\n]/g, preserveCR);
  },

  // ─── Date / Time Formatting ──────────────────────────────────────────────

  /**
   * Format a timestamp as a short date string: M/D/YYYY
   * @param {number|string|Date} d - Timestamp or Date
   * @returns {string}
   */
  format_date: function (d) {
    var date = new Date(d);
    return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
  },

  /**
   * Format a timestamp as a 12-hour time string: H:MMam/pm
   * @param {number|string|Date} d - Timestamp or Date
   * @returns {string}
   */
  format_time: function (d) {
    var date = new Date(d);
    var hours = date.getHours();
    var ampm = hours >= 12 ? "pm" : "am";
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    var minutes = date.getMinutes();
    var min = minutes > 9 ? "" + minutes : "0" + minutes;
    return hours + ":" + min + ampm;
  },

  // ─── Debounce ────────────────────────────────────────────────────────────

  /**
   * Create a debounced version of a function that delays invocation until
   * `wait` ms have elapsed since the last call.
   * @param {Function} func
   * @param {number} wait - Delay in milliseconds
   * @param {boolean} [immediate=false] - Trigger on leading edge instead of trailing
   * @returns {Function}
   */
  debounce: function (func, wait, immediate) {
    var timeout;
    return function () {
      var context = this;
      var args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  },

  // ─── Chat @-Mention Click Handler ────────────────────────────────────────

  /**
   * Attach a click handler to an element that inserts "@username " into the chat input.
   * Works on .prson (user list), .botson (chat avatar), and .chatName elements.
   * @param {jQuery} element - jQuery-wrapped DOM element
   */
  chatAt: function (element) {
    element.bind("click", function () {
      var nameToAt;
      if (element.hasClass("prson")) {
        nameToAt = $(this).find(".prsnName").text();
      } else if (element.hasClass("botson")) {
        nameToAt = $(this).next(".chatContent").find(".chatName").text();
      } else if (element.hasClass("chatName")) {
        nameToAt = $(this).text();
      }
      $("#newchat").val(function (i, val) {
        return val + "@" + nameToAt + " ";
      }).focus();
    });
  },

  // ─── @-Mention Autocomplete ──────────────────────────────────────────────

  /**
   * Enter @-mention mode: populate the list of all usernames + "everyone".
   */
  initAtLand: function () {
    firetable.atLand = true;
    firetable.atString = "";
    firetable.atUsers = ["everyone"];
    for (var user in ftapi.users) {
      firetable.atUsers.push(ftapi.users[user].username);
    }
    firetable.atUsersFiltered = firetable.atUsers.sort();
  },

  /**
   * Filter the @-mention dropdown to match the characters typed so far.
   */
  updateAtLand: function () {
    firetable.atUsersFiltered = firetable.atUsers
      .filter(function (user) {
        return user.toLowerCase().startsWith(firetable.atString.toLowerCase());
      })
      .sort();
    $('#atPicker').html('');
    if (firetable.atUsersFiltered.length) {
      for (var i = 0; i < firetable.atUsersFiltered.length; i++) {
        $('<div class="atPickerThing"><button class="butt graybutt" role="button">@' + firetable.atUsersFiltered[i] + '</button></div>').appendTo('#atPicker');
      }
    } else {
      $('<div class="atPickerThing"><i>No users match</i></div>').appendTo('#atPicker');
    }
  },

  /**
   * Accept an @-mention selection: insert the name, close the picker.
   * @param {string} atPeep - Username to insert (without the @)
   */
  chooseAt: function (atPeep) {
    var $chatText = $('#newchat');
    // Remove the partial string the user typed after @
    if (firetable.atString.length > 0) {
      $chatText.val($chatText.val().slice(0, firetable.atString.length * -1));
    }
    $chatText.val($chatText.val() + atPeep + " ");
    firetable.utilities.exitAtLand();
  },

  /**
   * Exit @-mention mode: reset state and hide the picker.
   */
  exitAtLand: function () {
    firetable.atLand = false;
    firetable.atUsersFiltered = [];
    firetable.atString = "";
    $('#atPicker').removeClass('show').html('');
  },

  // ─── Cancel Search/Queue Preview ───────────────────────────────────────

  /**
   * If a search-result or queue preview is playing, stop it and resume
   * the current room song.  This pattern was duplicated 6+ times across
   * search handlers, cancelqsearch, queueTrack, etc.
   *
   * Returns true if a preview was actually cancelled, false otherwise.
   * @returns {boolean}
   */
  cancelSearchPreview: function () {
    if (!firetable.preview) return false;
    var prefix = String(firetable.preview).slice(0, 5);
    if (prefix !== "ytcid" && prefix !== "sccid") return false;

    $("#pv" + firetable.preview).html("&#xE037;");
    clearTimeout(firetable.ptimeout);
    firetable.ptimeout = null;
    $("#pvbar" + firetable.preview).css("background-image", "none");
    clearInterval(firetable.movePvBar);
    firetable.movePvBar = null;
    firetable.preview = false;
    firetable.utilities.resumeCurrentSong();
    return true;
  },

  // ─── Resume Current Song (Deduplication Helper) ──────────────────────────

  /**
   * Resume playback of the current song at the correct elapsed position.
   *
   * This replaces the identical block of code that was copy-pasted 8+ times
   * across the original codebase (in pview, reloadtrack, queueTrack,
   * cancelqsearch, search handlers, newSong, initialize, SC READY, etc.).
   *
   * Calculates how much time has elapsed since the song started,
   * then loads either the YouTube player or SoundCloud widget at that offset.
   *
   * @param {Object} [opts] - Optional overrides
   * @param {boolean} [opts.forceVolume=false] - Also set volume after loading
   */
  resumeCurrentSong: function (opts) {
    opts = opts || {};
    if (!firetable.song) return;
    if (firetable.preview) return; // don't interrupt a preview

    var data = firetable.song;
    var nownow = Date.now();
    var timeSince = nownow - data.started;
    if (timeSince <= 0) timeSince = 0;

    var secSince = Math.floor(timeSince / 1000);

    if (data.type === MEDIA_YOUTUBE) {
      if (firetable.scLoaded) firetable.scwidget.pause();
      if (!firetable.disableMediaPlayback) {
        player.loadVideoById(data.cid, secSince, "large");
      }
      if (opts.forceVolume) {
        var vol = $("#slider").slider("value");
        player.setVolume(vol);
        firetable.scwidget.setVolume(vol);
      }
    } else if (data.type === MEDIA_SOUNDCLOUD) {
      if (firetable.ytLoaded) player.stopVideo();
      firetable.scSeek = timeSince;
      if (!firetable.disableMediaPlayback) {
        firetable.scwidget.load(SC_API_TRACK_URL + data.cid, { auto_play: true });
      }
      if (opts.forceVolume) {
        var vol = $("#slider").slider("value");
        player.setVolume(vol);
        firetable.scwidget.setVolume(vol);
      }
    }
  }
};
