/**
 * emoji.js — Emoji picker, search, and shortname-to-unicode conversion.
 *
 * Loads emoji data from unpkg CDN (unicode-emoji-json + emojilib),
 * builds the picker DOM, and converts :shortname: strings to unicode
 * characters in chat messages.
 */

firetable.emojis = {

  /**
   * Show all emoji results and section headers (resets any active search filter).
   */
  h: function () {
    $(".pickerResult").show();
    $("#pickerResults h3").show();
  },

  /**
   * Test whether a picker emoji element matches a search query.
   * Checks both the visible text (the emoji itself) and the data-alternative-name attribute.
   * @param {jQuery} $el - The emoji span element
   * @param {string} query - Lowercase search term
   * @returns {boolean}
   */
  n: function ($el, query) {
    var altName = $el.attr("data-alternative-name");
    return ($el.text().toLowerCase().indexOf(query) >= 0) ||
           (altName != null && altName.toLowerCase().indexOf(query) >= 0);
  },

  /**
   * Toggle an emoji category section in the picker.
   * Clicking the same section twice resets to showing all sections.
   * @param {string} sec - The section button's element ID (e.g. "bpickersmileys_emotion")
   */
  sec: function (sec) {
    var selectedSec = $("#pickerNav > .on");
    var contentId = sec.substr(1); // strip the "b" prefix to get the content div ID

    if (selectedSec.length) {
      if (selectedSec[0].id === sec) {
        // Toggle off — back to full list
        $("#" + selectedSec[0].id).removeClass("on");
        $("#pickerContents div").show();
      } else {
        // Switch to new section
        $("#" + selectedSec[0].id).removeClass("on");
        $("#" + selectedSec[0].id.substr(1)).hide();
        $("#" + sec).addClass("on");
        $("#" + contentId).show();
      }
    } else {
      // First selection
      $("#" + sec).addClass("on");
      $("#pickerContents div").hide();
      $("#" + contentId).show();
    }
  },

  /**
   * Filter the emoji picker results by search text.
   * Hides section headers during search, shows all when cleared.
   * @param {string} val - Search text
   */
  niceSearch: function (val) {
    if (val.length === 0) {
      firetable.emojis.h();
      return;
    }
    // Hide headers during filtered search
    if ($("#pickerResults h3").is(":visible")) {
      $("#pickerResults h3").hide();
    }
    val = val.toLowerCase();
    $(".pickerResult").each(function (i, el) {
      if (firetable.emojis.n($(el), val)) {
        $(el).show();
      } else {
        $(el).hide();
      }
    });
  }
};

// ─── Emoji Map Loading & Conversion (extends firetable.utilities) ────────────

/**
 * Fetch emoji data from CDN and build:
 * 1. firetable.emojiMap — shortname → unicode lookup
 * 2. Picker DOM — category nav + emoji grid in #pickerNav / #pickerContents
 */
firetable.utilities.getEmojiMap = function () {
  firetable.emojiMap = {};
  (async function () {
    try {
      var requests = EMOJI_URLS.map(function (url) { return fetch(url); });
      var responses = await Promise.all(requests);
      var promises = responses.map(function (response) { return response.json(); });
      var data = await Promise.all(promises);

      // Build a reverse map from emojilib v2: emoji_char → old_shortname
      var oldmojis = {};
      for (var oldSlug in data[1]) {
        if (data[1].hasOwnProperty(oldSlug)) {
          oldmojis[data[1][oldSlug].char] = oldSlug;
        }
      }

      // Walk the grouped emoji data and build picker DOM + emojiMap
      for (var category in data[0]) {
        if (!data[0].hasOwnProperty(category)) continue;
        var emojisArr = data[0][category];
        var catid = category.replace(/[\s&]+/g, '_').toLowerCase();

        // Category nav button (uses first emoji as icon)
        $('#pickerNav').append(
          '<span id="bpicker' + catid + '" title="' + category + '">' + emojisArr[0].emoji + '</span>'
        );
        // Category content section
        $('#pickerContents').append(
          '<div id="picker' + catid + '"><h3>' + category + '</h3></div>'
        );

        for (var i = 0; i < emojisArr.length; i++) {
          firetable.emojiMap[emojisArr[i].slug] = emojisArr[i].emoji;

          // Gather alternative search keywords from emojilib v3 + v2
          var words = "";
          if (data[2][emojisArr[i].emoji] !== undefined) {
            words += data[2][emojisArr[i].emoji].join(',');
          }
          if (oldmojis[emojisArr[i].emoji] !== undefined) {
            words += ',' + oldmojis[emojisArr[i].emoji];
          }
          $("#picker" + catid).append(
            '<span role="button" class="pickerResult" title="' + emojisArr[i].slug +
            '" data-alternative-name="' + words + '">' + emojisArr[i].emoji + '</span>'
          );
        }

        // Also add old emojilib v2 shortnames to the map
        for (var emoji in oldmojis) {
          if (oldmojis.hasOwnProperty(emoji)) {
            firetable.emojiMap[oldmojis[emoji]] = emoji;
          }
        }
      }
      twemoji.parse(document.getElementById("pickerNav"));
    } catch (err) {
      console.error("Failed to load emoji data:", err);
    }
  })();
};

/**
 * Replace :shortname: emoji codes in a string with unicode characters.
 * Special-cases the custom :rohn: emoji.
 * @param {string} str - Text containing :shortname: codes
 * @returns {string} Text with shortnames replaced by unicode or custom HTML
 */
firetable.utilities.emojiShortnamestoUnicode = function (str) {
  return str.replace(/\:(.*?)\:/g, function (match) {
    var shortname = match.replace(/\:/g, "");
    if (firetable.emojiMap[shortname]) {
      return '<span title="' + match + '">' + firetable.emojiMap[shortname] + '</span>';
    } else if (shortname === "rohn") {
      return '<span class="rohnmoji" title=":rohn:"></span>';
    }
    return match; // unknown shortname — leave as-is
  });
};
