/**
 * search.js — YouTube and SoundCloud track & playlist search.
 *
 * Handles:
 * - Track search via YouTube Data API v3 + SoundCloud API
 * - Direct link detection (youtube.com/watch, soundcloud.com/…)
 * - Playlist/import search via YouTube + SoundCloud
 * - Dubtrack import file parsing + import
 * - Search source toggle buttons (#ytsearchSelect, #scsearchSelect)
 * - Import source toggle tabs
 */

// ─── YouTube API Helper ──────────────────────────────────────────────────────

/**
 * Call the YouTube Data API v3 directly via AJAX.
 * Avoids gapi client entirely — no discovery loading, no Promise conflicts.
 * @param {string}   resource - API resource path (e.g. 'search', 'videos', 'playlistItems')
 * @param {Object}   params   - Query parameters (key is added automatically)
 * @param {Function} callback - Called with the raw API response object
 */
function ytAPI(resource, params, callback) {
  params.key = ftconfigs.youtubeKey;
  $.ajax({
    url: 'https://www.googleapis.com/youtube/v3/' + resource,
    data: params,
    type: 'GET',
    dataType: 'json',
    success: callback,
    error: function (xhr) {
      var msg = (xhr.responseJSON && xhr.responseJSON.error)
        ? xhr.responseJSON.error.code + ' ' + xhr.responseJSON.error.message
        : xhr.status + ' ' + xhr.statusText;
      console.error('YouTube API error:', msg, xhr.responseJSON || xhr.responseText);
      callback({ items: [] });
    }
  });
}

/**
 * Extract a query-string parameter value from a URL string.
 * @param {string} str - Full URL
 * @param {string} key - Parameter name
 * @returns {string} Decoded parameter value (or empty string)
 */
function getQueryStringValue(str, key) {
  return unescape(
    str.replace(
      new RegExp("^(?:.*[&\\?]" + escape(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"),
      "$1"
    )
  );
}

// ─── Track Search Setup ──────────────────────────────────────────────────────

/**
 * Bind the track search (#qsearch) and import search (#plMachine) keyup handlers.
 * Called once from firetable.ui.init().
 */
firetable.ui.setupSearchEvents = function () {
  var $searchItemTemplate = $('#searchResults .pvbar').remove();

  // ── Track Search (Enter in #qsearch) ──
  $("#qsearch").bind("keyup", function (e) {
    if (e.which !== 13) return;
    var txt = $("#qsearch").val();
    if (!txt) return;

    if (firetable.searchSelectsChoice === MEDIA_YOUTUBE) {
      // ── YouTube Track Search ──
      var showYTResults = function (response) {
        firetable.debug && console.log('queue search:', response);
        $('#searchResults').html("");
        firetable.utilities.cancelSearchPreview();

        var srchItems = response.items;
        $.each(srchItems, function (index, item) {
          var thecid = item.kind === "youtube#searchResult" ? item.id.videoId : item.id;
          var parsed = firetable.utilities.parseArtistTitle(
            item.snippet.title,
            item.snippet.channelTitle.replace(" - Topic", "")
          );
          var vidTitle = parsed.artist + " - " + parsed.title;
          var pkey = "ytcid" + thecid;

          var $srli = $searchItemTemplate.clone();
          $srli.attr('id', "pvbar" + pkey)
               .attr("data-key", pkey)
               .attr("data-cid", thecid);
          $srli.find('.previewicon').attr('id', "pv" + pkey).on('click', function () {
            firetable.actions.pview($(this).closest('.pvbar').attr('data-key'), true, MEDIA_YOUTUBE);
          });
          $srli.find('.listwords').html(vidTitle);
          $srli.find('.queuetrack').on('click', function () {
            firetable.actions.queueTrack(
              $(this).closest('.pvbar').attr('data-cid'),
              firetable.utilities.htmlEscape($(this).closest('.pvbar').find('.listwords').text()),
              MEDIA_YOUTUBE
            );
          });
          $("#searchResults").append($srli);
        });
      };

      // Check if it's a direct YouTube URL
      var directLink = false;
      var thecid = false;
      if (txt.match(/youtube.com\/watch/)) {
        thecid = getQueryStringValue(txt, "v");
        if (thecid) directLink = true;
      }

      if (directLink) {
        firetable.debug && console.log("direct yt link found");
        ytAPI('videos', { id: thecid, part: 'snippet', maxResults: 1 }, showYTResults);
      } else {
        $('#searchResults').html("Searching...");
        ytAPI('search', { q: txt, type: 'video', part: 'snippet', maxResults: SEARCH_MAX_RESULTS }, showYTResults);
      }

    } else if (firetable.searchSelectsChoice === MEDIA_SOUNDCLOUD) {
      // ── SoundCloud Track Search ──
      var q = txt;

      var showSCResults = function (tracks) {
        firetable.debug && console.log('sc tracks:', tracks);
        $('#searchResults').html("");
        firetable.utilities.cancelSearchPreview();

        $.each(tracks, function (index, item) {
          var parsed = firetable.utilities.parseArtistTitle(item.title, item.user.username);
          var vidTitle = parsed.artist + " - " + parsed.title;
          var pkey = "sccid" + item.id;

          var $srli = $searchItemTemplate.clone();
          $srli.attr('id', "pvbar" + pkey)
               .attr("data-key", pkey)
               .attr("data-cid", item.id);
          $srli.find('.previewicon').attr('id', "pv" + pkey).on('click', function () {
            firetable.actions.pview($(this).closest('.pvbar').attr('data-key'), true, MEDIA_SOUNDCLOUD);
          });
          $srli.find('.listwords').html(vidTitle);
          $srli.find('.queuetrack').on('click', function () {
            firetable.actions.queueTrack(
              $(this).closest('.pvbar').attr('data-cid'),
              firetable.utilities.htmlEscape($(this).closest('.pvbar').find('.listwords').text()),
              MEDIA_SOUNDCLOUD
            );
          });
          $("#searchResults").append($srli);
        });
      };

      var directLink = false;
      if (q.match(/:\/\/soundcloud\.com\//)) directLink = true;

      $('#searchResults').html("Searching...");
      if (directLink) {
        firetable.debug && console.log("sc direct link found");
        firetable.actions.resolveSCLink(q, function (item) {
          var items = [];
          if (item.kind === "track") items.push(item);
          showSCResults(items);
        });
      } else {
        SC.get('/tracks', { q: q }).then(function (tracks) {
          showSCResults(tracks);
        });
      }
    }
  });

  // ── Search Source Toggle Buttons ──
  $("#ytsearchSelect").bind("click", function () {
    $("#scsearchSelect").removeClass("on");
    $(this).addClass("on");
    firetable.searchSelectsChoice = MEDIA_YOUTUBE;
  });
  $("#scsearchSelect").bind("click", function () {
    $("#ytsearchSelect").removeClass("on");
    $(this).addClass("on");
    firetable.searchSelectsChoice = MEDIA_SOUNDCLOUD;
  });

  // ── Import Source Toggle Tabs ──
  $("#ytimportchoice").bind("click", function () {
    firetable.debug && console.log("yt import");
    firetable.importSelectsChoice = MEDIA_YOUTUBE;
  });
  $("#scimportchoice").bind("click", function () {
    firetable.debug && console.log("sc import");
    firetable.importSelectsChoice = MEDIA_SOUNDCLOUD;
  });
  $("#dtimportchoice").bind("click", function () {
    firetable.debug && console.log("dt import");
    firetable.importSelectsChoice = 3; // Dubtrack
  });
  $("#importSources .tab").bind("click", function () {
    if (firetable.importSelectsChoice === 3) {
      $("#importDubContent").show();
      $("#importContent").hide();
    } else {
      $("#importDubContent").hide();
      $("#importContent").show();
    }
    $(this).siblings().removeClass('on');
    $(this).addClass('on');
  });

  // ── Playlist/Import Search (#plMachine) ──
  $("#plMachine").bind("keyup", function (e) {
    if (e.which !== 13) return;
    var val = $("#plMachine").val();
    if (!val) return;
    $("#importResults").html("");
    $("#plMachine").val("");
    var searchFrom = firetable.importSelectsChoice;

    if (searchFrom === MEDIA_YOUTUBE) {
      // ── YouTube Playlist Search ──
      var listID;
      var directLink = false;

      // Check for direct playlist URL
      if (val.match(/youtube.com\/watch/) || val.match(/youtube.com\/playlist/)) {
        listID = getQueryStringValue(val, "list");
        if (listID) directLink = true;
      }

      if (directLink) {
        ytAPI('playlists', { id: listID, part: 'snippet' }, function (response) {
          if (response.items && response.items.length === 1) {
            var item = response.items[0];
            $("#importResults").append(
              '<div class="importResult"><div class="imtxt">' + item.snippet.title + ' by ' + item.snippet.channelTitle + '</div>' +
              '<a target="_blank" href="https://www.youtube.com/playlist?list=' + listID + '" class="importLinkCheck"><i class="material-icons">&#xE250;</i></a> ' +
              '<i role="button" onclick="firetable.actions.importList(\'' + listID + '\', \'' + firetable.utilities.htmlEscape(item.snippet.title) + '\', 1)" class="material-icons" title="Import">&#xE02E;</i></div>'
            );
          }
        });
      } else {
        ytAPI('search', { q: val, type: 'playlist', part: 'snippet', maxResults: SEARCH_MAX_RESULTS }, function (response) {
          firetable.debug && console.log('import search results:', response);
          $.each(response.items || [], function (index, item) {
            $("#importResults").append(
              '<div class="importResult"><div class="imtxt">' + item.snippet.title + ' by ' + item.snippet.channelTitle + '</div>' +
              '<a target="_blank" href="https://www.youtube.com/playlist?list=' + item.id.playlistId + '" class="importLinkCheck"><i class="material-icons">&#xE250;</i></a> ' +
              '<i role="button" onclick="firetable.actions.importList(\'' + item.id.playlistId + '\', \'' + firetable.utilities.htmlEscape(item.snippet.title) + '\', 1)" class="material-icons" title="Import">&#xE02E;</i></div>'
            );
          });
        });
      }

    } else if (searchFrom === MEDIA_SOUNDCLOUD) {
      // ── SoundCloud Playlist Search ──
      if (val.match(/.*\/\/soundcloud\.com\/.*\/sets\/.*/)) {
        // Direct set URL
        firetable.actions.resolveSCLink(val, function (item) {
          if (item && item.sharing === "public" && item.kind === "playlist") {
            $("#importResults").append(
              '<div class="importResult"><div class="imtxt">' + item.title + ' by ' + item.user.username + ' (' + item.track_count + ' songs)</div>' +
              '<a target="_blank" href="' + item.permalink_url + '" class="importLinkCheck"><i class="material-icons">&#xE250;</i></a> ' +
              '<i role="button" onclick="firetable.actions.importList(\'' + item.id + '\', \'' + firetable.utilities.htmlEscape(item.title) + '\', 2)" class="material-icons" title="Import">&#xE02E;</i></div>'
            );
          }
        });
      } else {
        // Keyword search for playlists
        SC.get('/playlists', { q: val }).then(function (lists) {
          for (var i = 0; i < lists.length; i++) {
            var item = lists[i];
            if (item.sharing === "public") {
              $("#importResults").append(
                '<div class="importResult"><div class="imtxt">' + item.title + ' by ' + item.user.username + ' (' + item.track_count + ' songs)</div>' +
                '<a target="_blank" href="' + item.permalink_url + '" class="importLinkCheck"><i class="material-icons">&#xE250;</i></a> ' +
                '<i role="button" onclick="firetable.actions.importList(\'' + item.id + '\', \'' + firetable.utilities.htmlEscape(item.title) + '\', 2)" class="material-icons" title="Import">&#xE02E;</i></div>'
              );
            }
          }
        });
      }
    }
  });
};
