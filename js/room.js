/**
 * room.js — Room state event handlers.
 *
 * Handles all ftapi events related to room state:
 * - newSong: Load new track, start countdown/progress, Last.fm scrobble timer
 * - newProduce / newHistory: Render discover/history items
 * - editedHistory: Update edited tag in history list
 * - modCheck: Show/hide mod-only edit buttons
 * - newTheme: Display the current room theme
 * - tagUpdate: Update now-playing metadata when tags are edited
 * - screenStateChanged / danceStateChanged: Toggle video screen / dance mode
 * - lightsChanged / colorsChanged: Festive lights CSS + accent color
 * - tableChanged: Render the DJ table (up to 4 spots)
 * - waitlistChanged: Render the waitlist
 * - spotlightStateChanged / playLimitChanged: Highlight active DJ, update limit
 * - banListChanged: Render active suspensions in mod panel
 *
 * BUG FIXES applied in this file:
 * - `firstpart == "sc"` → `firstpart = "sc"` (was comparison, should be assignment)
 *   This caused SoundCloud tracks in history/discover to always get "yt" prefix.
 */

// ─── Festive Lights CSS Generator ────────────────────────────────────────────

/**
 * Build the <style> block for festive lights using the current accent color.
 * Extracted to avoid duplicating this 30+ line CSS string in both
 * lightsChanged and colorsChanged handlers.
 * @param {{r: number, g: number, b: number}} rgb - Accent color as RGB
 * @returns {string} Full <style class="festiveLights"> HTML string
 */
function buildFestiveLightsCSS(rgb) {
  var r = rgb.r, g = rgb.g, b = rgb.b;
  var c = "rgba(" + r + "," + g + "," + b;
  return "<style class='festiveLights'>" +
    ".lightrope { text-align: center; white-space: nowrap; overflow: hidden; position: absolute; z-index: 1; margin: -6px 0 0 0; padding: 0; pointer-events: none; width: 100%; z-index: 55; }" +
    "ul.lightrope li { position: relative; list-style: none; margin: 0; padding: 0; display: block; width: 6px; height: 14px; border-radius: 50%; margin: 10px; display: inline-block; background: #111; }" +
    " .lightrope li span { position: relative; animation-fill-mode: both; animation-iteration-count: infinite; list-style: none; margin: 0; padding: 0; display: block; width: 6px; height: 14px; border-radius: 50%; display: inline-block; background: " + c + ", 1); box-shadow: 0px 2.333px 12px 1.5px " + c + ", 1); animation-name: flash-1; animation-duration: 2s; }" +
    " .lightrope li:nth-child(2n+1) span { background: " + c + ", 1); box-shadow: 0px 2.333px 12px 1.5px " + c + ", 0.5); animation-name: flash-2; animation-duration: 0.4s; }" +
    " .lightrope li:nth-child(4n+2) span { background: " + c + ", 1); box-shadow: 0px 2.333px 12px 1.5px " + c + ", 1); animation-name: flash-3; animation-duration: 1.1s; }" +
    " .lightrope li:nth-child(odd) span { animation-duration: 1.8s; }" +
    " .lightrope li:nth-child(3n+1) span { animation-duration: 1.4s; }" +
    " .lightrope li:before { content: \"\"; position: absolute; background: #4e4e4e; width: 4px; height: 4.667px; border-radius: 3px; top: -2.333px; left: 1px; }" +
    " .lightrope li:after { content: \"\"; top: -7px; left: 3px; position: absolute; width: 32px; height: 9.333px; border-bottom: solid #4e4e4e 2px; border-radius: 50%; }" +
    " .lightrope li:last-child:after { content: none; }" +
    " .lightrope li:first-child { margin-left: -20px; }" +
    " @keyframes flash-1 { 0%, 100% { background: " + c + ", 1); box-shadow: 0px 2.333px 12px 1.5px " + c + ", 1); } 50% { background: " + c + ", 0.4); box-shadow: 0px 2.333px 12px 1.5px " + c + ", 0.2); } }" +
    " @keyframes flash-2 { 0%, 100% { background: " + c + ", 1); box-shadow: 0px 2.333px 12px 1.5px " + c + ", 1); } 50% { background: " + c + ", 0.4); box-shadow: 0px 2.333px 12px 1.5px " + c + ", 0.2); } }" +
    " @keyframes flash-3 { 0%, 100% { background: " + c + ", 1); box-shadow: 0px 2.333px 12px 1.5px " + c + ", 1); } 50% { background: " + c + ", 0.4); box-shadow: 0px 2.333px 12px 1.5px " + c + ", 0.2); } }" +
    "</style>";
}

// ─── History Item Renderer ────────────────────────────────────────────────────

/**
 * Build and attach a history/discover item to the DOM.
 * Extracted from the nearly-identical newProduce / newHistory handlers.
 *
 * @param {Object} data          - Track data from ftapi
 * @param {jQuery} $template     - Cloneable template element
 * @param {string} containerSel  - jQuery selector for the target container
 * @param {string} [artClass]    - CSS class for the album art element ('discart' or 'histart')
 */
function renderHistoryItem(data, $template, containerSel, artClass) {
  if (data.img === "img/idlogo.png" && ftconfigs.defaultAlbumArtUrl.length) {
    data.img = ftconfigs.defaultAlbumArtUrl;
  }

  // BUG FIX: was `firstpart == "sc"` (comparison), now `firstpart = "sc"` (assignment)
  var firstpart = "yt";
  if (data.type == 2) firstpart = "sc";

  var pkey = firstpart + "cid" + data.cid;
  var $histItem = $template.clone();

  $histItem.attr('id', "pvbar" + pkey)
           .attr("data-key", pkey)
           .attr("data-histid", data.histID)
           .attr("data-cid", data.cid)
           .attr("data-type", data.type);

  // Preview button
  $histItem.find('.previewicon').attr('id', "pv" + pkey).on('click', function () {
    firetable.actions.pview(
      $(this).closest('.pvbar').attr('data-key'),
      true,
      $(this).closest('.pvbar').attr('data-type'),
      true
    );
  });

  // Track link
  $histItem.find('.histlink').attr({
    'href': data.url,
    'tabindex': "-1",
    'id': data.histID
  }).text(data.artist + " - " + data.title);

  // Edit tags button (mod only)
  $histItem.find('.edittags').on('click', function () {
    if ($(this).hasClass("editing")) {
      $(this).removeClass("editing");
      $(this).closest('.pvbar').find('.tagPromptBox').remove();
    } else {
      $(this).addClass("editing");
      firetable.actions.editTagsPrompt(
        $(this).closest('.pvbar').attr('data-key'),
        data.artist + " - " + data.title
      );
    }
  });
  try {
    if (!ftapi.isMod) $histItem.find('.edittags').hide();
  } catch (e) {
    console.log(e);
  }

  // Metadata
  $histItem.find('.histdj').text(data.dj);
  $histItem.find('.histdate').text(firetable.utilities.format_date(data.when));
  $histItem.find('.histtime').text(firetable.utilities.format_time(data.when));

  // Add-to-playlist button (shows playlist picker dropdown)
  $histItem.find('.histeal').attr('id', "apv" + data.type + data.cid).on('click', function () {
    var $btn = $(this);
    var btnCid = $(this).closest('.pvbar').attr('data-cid');
    var btnType = $(this).closest('.pvbar').attr('data-type');
    var btnTitle = firetable.utilities.htmlEscape($(this).closest('.pvbar').find('.histlink').text());

    // If this button's picker is already open, close it
    if (firetable.stealSourceBtn && firetable.stealSourceBtn.is($btn) && !$("#stealContain").is(':hidden')) {
      $btn.removeClass('on');
      firetable.stealSourceBtn = null;
      firetable.stealTarget = null;
      $("#stealContain").hide();
      return;
    }

    ftapi.lookup.allLists(function (allPlaylists) {
      $("#stealpicker").html(
        '<option value="-1">Where to?</option>' +
        '<option value="0">Default Queue</option>'
      );
      for (var key in allPlaylists) {
        if (allPlaylists.hasOwnProperty(key)) {
          $("#stealpicker").append(
            '<option value="' + key + '">' + allPlaylists[key].name + '</option>'
          );
        }
      }
      // Mark any previously open source button as off
      if (firetable.stealSourceBtn) firetable.stealSourceBtn.removeClass('on');
      $("#grab").removeClass('on');

      firetable.stealSourceBtn = $btn;
      firetable.stealTarget = { cid: btnCid, type: btnType, title: btnTitle };
      $btn.addClass('on');

      var stealContainEl = document.getElementById('stealContain');
      stealContainEl.style.visibility = 'hidden';
      $("#stealContain").show();
      firetable.ui.positionPopover($btn[0], stealContainEl, document.getElementById('stealArrow'), 'left');
    });
  });

  // Album art
  if (artClass) {
    $histItem.find('.' + artClass).css('background-image', 'url(' + data.img + ')');
  }

  $histItem.prependTo(containerSel);
}

// ─── Room Event Binding ──────────────────────────────────────────────────────

/**
 * Set up all room-state ftapi event handlers.
 * Called once from firetable.ui.init().
 */
firetable.ui.setupRoomEvents = function () {

  // ── Discover (Recently Played by Others) ──
  var $discoverItem = $('#thediscovers .pvbar').remove();
  ftapi.events.on('newProduce', function (data) {
    renderHistoryItem(data, $discoverItem, "#thediscovers", "discart");
  });

  // ── History (Your Play History) ──
  var $historyItem = $('#thehistory .pvbar').remove();

  function applyHistoryFilter() {
    var q = ($("#histFilter").val() || "").toLowerCase().trim();
    $("#thehistory .pvbar").each(function () {
      var text = ($(this).find('.histlink').text() + " " + $(this).find('.histdj').text()).toLowerCase();
      $(this).toggle(q.length === 0 || text.indexOf(q) !== -1);
    });
  }

  $(document).on('input.histfilter', '#histFilter', applyHistoryFilter);

  ftapi.events.on('newHistory', function (data) {
    renderHistoryItem(data, $historyItem, "#thehistory", "histart");
    applyHistoryFilter();
  });

  // ── Edited History (tag correction) ──
  ftapi.events.on('editedHistory', function (data) {
    console.log("HIST EDIT", data);
    $("#" + data.histID).text(data.artist + " - " + data.title);
  });

  // ── Mod Check (show edit buttons for mods) ──
  ftapi.events.on('modCheck', function (data) {
    if (data) $(".edittags").show();
  });

  // ── Theme ──
  function checkThemeTicker() {
    var el = document.getElementById("currentTheme");
    var container = el.parentElement;
    el.classList.remove('is-ticker');
    if (el.scrollWidth > container.offsetWidth) {
      var originalHTML = el.innerHTML;
      el.innerHTML = '<span class="ticker-run"><span class="ticker-copy">' + originalHTML + '</span><span class="ticker-sep"> · </span><span class="ticker-copy">' + originalHTML + '</span><span class="ticker-sep"> · </span></span>';
      el.classList.add('is-ticker');
    }
  }

  ftapi.events.on("newTheme", function (data) {
    if (!data) {
      $("#currentTheme").text("!suggest a theme");
    } else {
      var txtOut = firetable.ui.strip(data);
      txtOut = firetable.ui.textToLinks(txtOut, true);
      txtOut = firetable.utilities.emojiShortnamestoUnicode(txtOut);
      txtOut = txtOut.replace(/\`(.*?)\`/g, function (x) {
        return "<code>" + x.replace(/\`/g, "") + "</code>";
      });
      $("#currentTheme").html(txtOut);
      twemoji.parse(document.getElementById("currentTheme"));
    }
    setTimeout(checkThemeTicker, 50);
  });

  // ── Tag Update (metadata correction while song is playing) ──
  ftapi.events.on("tagUpdate", function (data) {
    firetable.debug && console.log("TAG UPDATE", data);
    firetable.tagUpdate = data;
    if (!firetable.song) return;
    if (firetable.song.cid !== data.cid || !data.adamData.track_name) return;

    $("#track").text(firetable.ui.strip(data.adamData.track_name));
    $("#artist").text(firetable.ui.strip(data.adamData.artist));
    firetable.song.title = firetable.ui.strip(data.adamData.track_name);
    firetable.song.artist = firetable.ui.strip(data.adamData.artist);

    var nicename = firetable.song.djname;
    var showPlaycount = data.adamData.playcount && data.adamData.playcount > 0;

    if (data.adamData.last_play) {
      $("#lastPlay").text("last " + firetable.utilities.format_date(data.adamData.last_play) + " by " + data.adamData.last_play_dj);
    } else {
      $("#lastPlay").text("");
    }
    if (data.adamData.first_play) {
      $("#firstPlay").text("first " + firetable.utilities.format_date(data.adamData.first_play) + " by " + data.adamData.first_play_dj);
    } else {
      $("#firstPlay").text("");
    }

    var doTheScrollThing = firetable.utilities.isChatPrettyMuchAtBottom();
    if (showPlaycount) {
      $("#playCount").text(data.adamData.playcount + " plays");
      $(".npmsg" + data.cid).last().find(".npmsg").html(
        'DJ <strong>' + nicename + '</strong> started playing <strong>' + data.adamData.track_name + '</strong> by <strong>' + data.adamData.artist + '</strong><br/>This song has been played ' + data.adamData.playcount + ' times.'
      );
    } else {
      $("#playCount").text("");
      $(".npmsg" + data.cid).last().find(".npmsg").html(
        'DJ <strong>' + nicename + '</strong> started playing <strong>' + data.adamData.track_name + '</strong> by <strong>' + data.adamData.artist + '</strong>'
      );
    }
    if (doTheScrollThing) firetable.utilities.scrollToBottom();
  });

  // ── New Song ──
  ftapi.events.on('newSong', function (data) {
    $("#playCount, #lastPlay, #firstPlay").text("");
    window.dispatchEvent(new Event('resize'));
    $("#cloud_with_rain, #fire").removeClass("on");
    $("#timr").countdown("destroy");

    if (firetable.moveBar != null) {
      clearInterval(firetable.moveBar);
      firetable.moveBar = null;
    }

    if (data.image === "img/idlogo.png" && ftconfigs.defaultAlbumArtUrl.length) {
      data.image = ftconfigs.defaultAlbumArtUrl;
    }
    $("#prgbar").css("background", "#151515");

    // Check if tagUpdate has pre-corrected metadata for this track
    var showPlaycount = false;
    if (firetable.tagUpdate && data.cid === firetable.tagUpdate.cid && firetable.tagUpdate.adamData.track_name) {
      data.title = firetable.tagUpdate.adamData.track_name;
      data.artist = firetable.tagUpdate.adamData.artist;
      if (firetable.tagUpdate.adamData.last_play) {
        $("#lastPlay").text("last " + firetable.utilities.format_date(firetable.tagUpdate.adamData.last_play) + " by " + firetable.tagUpdate.adamData.last_play_dj);
      }
      if (firetable.tagUpdate.adamData.first_play) {
        $("#firstPlay").text("first " + firetable.utilities.format_date(firetable.tagUpdate.adamData.first_play) + " by " + firetable.tagUpdate.adamData.first_play_dj);
      }
      if (firetable.tagUpdate.adamData.playcount > 0) {
        showPlaycount = true;
        $("#playCount").text(firetable.tagUpdate.adamData.playcount + " plays");
      }
    }

    // Update now-playing UI
    $("#track").text(firetable.ui.strip(data.title));
    $("#artist").text(firetable.ui.strip(data.artist));
    $("#songlink").attr("href", data.url);
    $("#albumArt").css("background-image", "url(" + data.image + ")");

    // Calculate elapsed time
    var nownow = Date.now();
    var timeSince = nownow - data.started;
    if (timeSince <= 0) timeSince = 0;
    var secSince = Math.floor(timeSince / 1000);
    var timeLeft = data.duration - secSince;
    firetable.song = data;
    firetable.debug && console.log("NEW TRACK", data);

    // ── Last.fm scrobble timer ──
    if (firetable.lastfm.timer != null) {
      clearTimeout(firetable.lastfm.timer);
      firetable.lastfm.timer = null;
    }
    if (firetable.lastfm.sk) {
      firetable.lastfm.duration = Math.floor(timeLeft);
      firetable.lastfm.songStart = Math.floor(Date.now() / 1000);
      firetable.lastfm.timer = setTimeout(function () {
        firetable.lastfm.timer = null;
        firetable.lastfm.scrobble();
      }, (timeLeft * 1000) - 3000);
      firetable.lastfm.nowPlaying();
    }

    // ── Platform-specific UI + playback ──
    if (data.type === MEDIA_YOUTUBE) {
      $("#scScreen").hide();
      $("#songlink").html('<svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="youtube" class="svg-inline--fa fa-youtube fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"></path></svg>');

      if (firetable.ytLoaded && !firetable.preview) {
        if (firetable.scLoaded) firetable.scwidget.pause();
        if (!firetable.disableMediaPlayback) player.loadVideoById(data.cid, secSince, "large");
        var thevol = $("#slider").slider("value");
        player.setVolume(thevol);
        firetable.scwidget.setVolume(thevol);
      }

    } else if (data.type === MEDIA_SOUNDCLOUD) {
      $("#scScreen").show();
      $("#songlink").html('<svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="soundcloud" class="svg-inline--fa fa-soundcloud fa-w-20" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M111.4 256.3l5.8 65-5.8 68.3c-.3 2.5-2.2 4.4-4.4 4.4s-4.2-1.9-4.2-4.4l-5.6-68.3 5.6-65c0-2.2 1.9-4.2 4.2-4.2 2.2 0 4.1 2 4.4 4.2zm21.4-45.6c-2.8 0-4.7 2.2-5 5l-5 105.6 5 68.3c.3 2.8 2.2 5 5 5 2.5 0 4.7-2.2 4.7-5l5.8-68.3-5.8-105.6c0-2.8-2.2-5-4.7-5zm25.5-24.1c-3.1 0-5.3 2.2-5.6 5.3l-4.4 130 4.4 67.8c.3 3.1 2.5 5.3 5.6 5.3 2.8 0 5.3-2.2 5.3-5.3l5.3-67.8-5.3-130c0-3.1-2.5-5.3-5.3-5.3zM7.2 283.2c-1.4 0-2.2 1.1-2.5 2.5L0 321.3l4.7 35c.3 1.4 1.1 2.5 2.5 2.5s2.2-1.1 2.5-2.5l5.6-35-5.6-35.6c-.3-1.4-1.1-2.5-2.5-2.5zm23.6-21.9c-1.4 0-2.5 1.1-2.5 2.5l-6.4 57.5 6.4 56.1c0 1.7 1.1 2.8 2.5 2.8s2.5-1.1 2.8-2.5l7.2-56.4-7.2-57.5c-.3-1.4-1.4-2.5-2.8-2.5zm25.3-11.4c-1.7 0-3.1 1.4-3.3 3.3L47 321.3l5.8 65.8c.3 1.7 1.7 3.1 3.3 3.1 1.7 0 3.1-1.4 3.1-3.1l6.9-65.8-6.9-68.1c0-1.9-1.4-3.3-3.1-3.3zm25.3-2.2c-1.9 0-3.6 1.4-3.6 3.6l-5.8 70 5.8 67.8c0 2.2 1.7 3.6 3.6 3.6s3.6-1.4 3.9-3.6l6.4-67.8-6.4-70c-.3-2.2-2-3.6-3.9-3.6zm241.4-110.9c-1.1-.8-2.8-1.4-4.2-1.4-2.2 0-4.2.8-5.6 1.9-1.9 1.7-3.1 4.2-3.3 6.7v.8l-3.3 176.7 1.7 32.5 1.7 31.7c.3 4.7 4.2 8.6 8.9 8.6s8.6-3.9 8.6-8.6l3.9-64.2-3.9-177.5c-.4-3-2-5.8-4.5-7.2zm-26.7 15.3c-1.4-.8-2.8-1.4-4.4-1.4s-3.1.6-4.4 1.4c-2.2 1.4-3.6 3.9-3.6 6.7l-.3 1.7-2.8 160.8s0 .3 3.1 65.6v.3c0 1.7.6 3.3 1.7 4.7 1.7 1.9 3.9 3.1 6.4 3.1 2.2 0 4.2-1.1 5.6-2.5 1.7-1.4 2.5-3.3 2.5-5.6l.3-6.7 3.1-58.6-3.3-162.8c-.3-2.8-1.7-5.3-3.9-6.7zm-111.4 22.5c-3.1 0-5.8 2.8-5.8 6.1l-4.4 140.6 4.4 67.2c.3 3.3 2.8 5.8 5.8 5.8 3.3 0 5.8-2.5 6.1-5.8l5-67.2-5-140.6c-.2-3.3-2.7-6.1-6.1-6.1zm376.7 62.8c-10.8 0-21.1 2.2-30.6 6.1-6.4-70.8-65.8-126.4-138.3-126.4-17.8 0-35 3.3-50.3 9.4-6.1 2.2-7.8 4.4-7.8 9.2v249.7c0 5 3.9 8.6 8.6 9.2h218.3c43.3 0 78.6-35 78.6-78.3.1-43.6-35.2-78.9-78.5-78.9zm-296.7-60.3c-4.2 0-7.5 3.3-7.8 7.8l-3.3 136.7 3.3 65.6c.3 4.2 3.6 7.5 7.8 7.5 4.2 0 7.5-3.3 7.5-7.5l3.9-65.6-3.9-136.7c-.3-4.5-3.3-7.8-7.5-7.8zm-53.6-7.8c-3.3 0-6.4 3.1-6.4 6.7l-3.9 145.3 3.9 66.9c.3 3.6 3.1 6.4 6.4 6.4 3.6 0 6.4-2.8 6.7-6.4l4.4-66.9-4.4-145.3c-.3-3.6-3.1-6.7-6.7-6.7zm26.7 3.4c-3.9 0-6.9 3.1-6.9 6.9L227 321.3l3.9 66.4c.3 3.9 3.1 6.9 6.9 6.9s6.9-3.1 6.9-6.9l4.2-66.4-4.2-141.7c0-3.9-3-6.9-6.9-6.9z"></path></svg>');

      var biggerImg = data.image.replace('-large', '-t500x500');
      firetable.scImg = biggerImg;
      $("#albumArt").css("background-image", "url(" + biggerImg + ")");
      try { setup(biggerImg); } catch (e) {
        firetable.debug && console.log('big image error:', e);
      }

      if (firetable.scLoaded && !firetable.preview) {
        if (firetable.ytLoaded) player.stopVideo();
        firetable.scSeek = timeSince;
        if (!firetable.disableMediaPlayback) {
          firetable.scwidget.load(SC_API_TRACK_URL + data.cid, {
            auto_play: true,
            single_active: false,
            callback: function () {
              var vol = localStorage[STORAGE.volume];
              player.setVolume(vol);
              firetable.scwidget.setVolume(vol);
            }
          });
        }
      }
    }

    // ── Now-playing chat message ──
    if (data.cid !== 0) {
      var nicename = data.djid;
      if (ftapi.users[data.djid] && ftapi.users[data.djid].username) {
        nicename = ftapi.users[data.djid].username;
      }

      if (firetable.nonpmsg) {
        firetable.nonpmsg = false;
      } else {
        var doTheScrollThing = firetable.utilities.isChatPrettyMuchAtBottom();
        var npmsgHTML;
        if (showPlaycount) {
      npmsgHTML = '<div class="newChat nowplayn npmsg' + data.cid + '"><div class="npmsg">DJ <strong>' + nicename + '</strong> started playing <strong>' + data.title + '</strong> by <strong>' + data.artist + '</strong><br/>This song has been played ' + firetable.tagUpdate.adamData.playcount + ' times.</div><span class="npmsg-fires"></span>';
        } else {
          npmsgHTML = '<div class="newChat nowplayn npmsg' + data.cid + '"><div class="npmsg">DJ <strong>' + nicename + '</strong> started playing <strong>' + data.title + '</strong> by <strong>' + data.artist + '</strong></div><span class="npmsg-fires"></span>';
        }
        $("#chats").append(npmsgHTML);
        if (doTheScrollThing) firetable.utilities.scrollToBottom();
        firetable.lastChatPerson = false;
        firetable.lastChatId = false;
      }
    }

    // ── Countdown timer ──
    $("#timr").countdown({
      until: timeLeft,
      compact: true,
      description: "",
      format: "MS"
    });

    // ── Progress bar ──
    firetable.moveBar = setInterval(function () {
      var now = Date.now();
      var sofar = now - firetable.song.started;
      var pcnt = (sofar / (firetable.song.duration * 1000)) * 100;
      $("#prgbar").css("background", "linear-gradient(90deg, " + firetable.color + " " + pcnt + "%, #151515 " + pcnt + "%)");
    }, PROGRESS_BAR_INTERVAL);
  });

  // ── Screen State ──
  ftapi.events.on("screenStateChanged", function (data) {
    firetable.debug && console.log('thescreen:', data);
    firetable.screenSyncPos = data;
    if (firetable.screenControl === "sync") {
      if (data) firetable.utilities.screenDown();
      else firetable.utilities.screenUp();
    }
    firetable.ui.updateScreenBtn(firetable.screenControl);
  });

  // ── Dance Mode ──
  ftapi.events.on("danceStateChanged", function (data) {
    firetable.debug && console.log('dance check:', data);
    if (data) $("#deck").addClass("dance");
    else $("#deck").removeClass("dance");
  });

  // ── Festive Lights ──
  ftapi.events.on("lightsChanged", function (data) {
    firetable.debug && console.log('lights check:', data);
    $('.festiveLights').remove();
    if (data) {
      firetable.lights = true;
      var rgb = firetable.utilities.hexToRGB(firetable.color);
      $("head").append(buildFestiveLightsCSS(rgb));
    } else {
      firetable.lights = false;
    }
  });

  // ── Waitlist ──
  ftapi.events.on("waitlistChanged", function (data) {
    firetable.waitlistData = data;
    var html = "";
    var cnt = "0";
    if (data) {
      var countr = 1;
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          cnt = countr;
          var removeMe = data[key].removeAfter ? "departure_board" : "";
          html += '<div class="prson"><div class="botson" style="background-image:url(' +
            firetable.utilities.avatarURL(data[key].id, data[key].name) +
            ');"></div><span class="prsnName">' + countr + '. ' + data[key].name +
            ' <span class="removemeIcon material-icons"> ' + removeMe + ' </span></span></div>';
          countr++;
        }
      }
    }
    $("#label2 .count").text(" (" + cnt + ")");
    $("#justwaitlist").html(html);
  });

  // ── DJ Table ──
  ftapi.events.on("tableChanged", function (data) {
    firetable.tableData = data;
    var html = "";
    if (data) {
      var countr = 0;
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          var isSelf = data[key].id === ftapi.uid;
          var ownUser = ftapi.uid && ftapi.users && ftapi.users[ftapi.uid];
          var isMod = ownUser && (ownUser.mod || ownUser.supermod);
          var showBtn = isSelf || isMod;
          var btnIcon = isSelf ? 'close' : 'person_remove';
          var btnTitle = isSelf ? 'Step down' : 'Remove from deck';
          var actionBtn = showBtn
            ? '<button class="iconbutt deckRemoveBtn" data-userid="' + data[key].id + '" data-tablekey="' + key + '" title="' + btnTitle + '"><i class="material-icons">' + btnIcon + '</i></button>'
            : '';
          var departureIndicator = data[key].removeAfter
            ? '<span class="removemeIcon material-icons" title="Stepping down after this song">departure_board</span>'
            : '';
          html += '<div id="spt' + countr + '" class="spot">' +
            '<div class="avtr" id="avtr' + countr + '" style="background-image: url(' +
            firetable.utilities.avatarURL(data[key].id, data[key].name) + ');"></div>' +
            '<div id="djthing' + countr + '" class="djplaque">' +
            '<div class="djname">' + data[key].name + '</div>' +
            departureIndicator + actionBtn +
            '<div class="playcount">' + data[key].plays + '/<span id="plimit' + countr + '">' +
            firetable.playlimit + '</span></div></div></div>';
          countr++;
        }
      }
      // Fill empty spots
      if (countr < 4) {
        html += '<div class="spot empty"><div class="djplaque"><button class="butt graybutt small addmeButt" role="button">Step up</button></div></div>';
        countr++;
        for (var i = countr; i < 4; i++) {
          html += '<div class="spot empty"><div class="djplaque">&nbsp;</div></div>';
        }
      }
    } else {
      html += '<div class="spot empty"><div class="djplaque"><button class="butt graybutt small addmeButt" role="button">Step up</button></div></div>';
      for (var i = 0; i < 3; i++) {
        html += '<div class="spot empty"><div class="djplaque">&nbsp;</div></div>';
      }
    }
    $("#deck").html(html);
    $("#deck").off('click.addme').on('click.addme', '.addmeButt', function () {
      ftapi.actions.sendBotCommand("!addme");
    });
    $("#deck").off('click.remove').on('click.remove', '.deckRemoveBtn', function () {
      var userId = $(this).data('userid');
      if (userId === ftapi.uid) {
        ftapi.actions.sendBotCommand("!removeme");
      } else {
        var tableKey = $(this).data('tablekey');
        firebase.app("firetable").database().ref("table/" + tableKey).remove();
        if (firetable.waitlistData) {
          for (var wkey in firetable.waitlistData) {
            if (firetable.waitlistData.hasOwnProperty(wkey) && firetable.waitlistData[wkey].id === userId) {
              firebase.app("firetable").database().ref("waitlist/" + wkey).remove();
              break;
            }
          }
        }
      }
    });

    // Highlight current DJ
    for (var i = 0; i < 4; i++) {
      if (i === firetable.playdex) {
        $("#avtr" + i).addClass("animate");
        $("#djthing" + i).addClass("djActive");
      } else {
        $("#avtr" + i).removeClass("animate");
        $("#djthing" + i).removeClass("djActive");
      }
    }
  });

  // ── Spotlight (Active DJ Index) ──
  ftapi.events.on("spotlightStateChanged", function (data) {
    firetable.playdex = data;
    for (var i = 0; i < 4; i++) {
      if (i === data) {
        $("#avtr" + i).addClass("animate");
        $("#djthing" + i).addClass("djActive");
      } else {
        $("#avtr" + i).removeClass("animate");
        $("#djthing" + i).removeClass("djActive");
      }
    }
  });

  // ── Play Limit ──
  ftapi.events.on("playLimitChanged", function (data) {
    firetable.playlimit = data;
    for (var i = 0; i < 4; i++) {
      $("#plimit" + i).text(data);
    }
  });

  // ── Ban List ──
  ftapi.events.on("banListChanged", function (data) {
    $("#activeSuspentions").html("");
    for (var key in data) {
      if (data[key]) {
        ftapi.lookup.userByName(key, function (person) {
          $("#activeSuspentions").append(
            '<div class="importResult"><div class="imtxt">' + person.username + '</div>' +
            '<i role="button" onclick="firetable.actions.unban(\'' + person.userid + '\')" class="material-icons" title="Unsuspend">&#xE5C9;</i></div>'
          );
        });
      }
    }
  });

  // ── Colors Changed (Accent Color) ──
  ftapi.events.on("colorsChanged", function (data) {
    firetable.debug && console.log("COLOR CHANGE!", data);

    firetable.color = data.color;
    firetable.countcolor = data.txt;
    if (data.color === "#fff" || data.color === "#7f7f7f") {
      firetable.color = firetable.orange;
      firetable.countcolor = "#fff";
    }

    // Update custom color styles
    $('.customColorStyles').remove();
    $("head").append(
      "<style class='customColorStyles'>:root { --color-accent: " + firetable.color + "; } " +
      ":focus-visible { box-shadow: 0 0 0.5rem " + firetable.color + "; } " +
      ".accent:not(#fire), .butt:not(.graybutt):not(#fire), .ui-slider-horizontal .ui-slider-range-min { background-color: " + firetable.color + "; color: " + firetable.countcolor + "; } " +
      "#fire { background-color: " + firetable.color + "; } " +
      ".iconbutt.on { color: " + firetable.color + "; border-bottom: 1px solid " + firetable.color + "66; box-shadow: inset 0 0 1rem " + firetable.color + "33; } " +
      "#themebox { background-color: " + firetable.color + "33; }</style>"
    );

    // Rebuild festive lights with new color
    $('.festiveLights').remove();
    if (firetable.lights) {
      var rgb = firetable.utilities.hexToRGB(firetable.color);
      $("head").append(buildFestiveLightsCSS(rgb));
    }
  });
};
