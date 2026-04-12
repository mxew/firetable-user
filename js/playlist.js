/**
 * playlist.js — Queue and playlist management.
 *
 * Handles:
 * - Adding tracks to queue (queueTrack)
 * - Reordering via drag-and-drop (updateQueue, sortable)
 * - Shuffle, dedup, bump-to-top, move-to-bottom, delete
 * - Queue filtering (#queueFilter)
 * - Merge lists between playlists
 * - Queue from link (YouTube/SoundCloud URL drag-and-drop)
 * - SoundCloud URL resolution (resolveSCLink, scGet)
 * - Import playlist from YouTube/SoundCloud (importList)
 * - Dubtrack import (dubtrackImport, dubtrackImportFileSelect)
 * - List CRUD (create, delete, switch)
 * - playlistChanged event handler
 * - Tag editing (editTagsPrompt)
 */

firetable.actions = firetable.actions || {};

// ─── Queue Track ─────────────────────────────────────────────────────────────

/**
 * Add a track to the current playlist queue.
 * If a search preview is active, cancels it and resumes the room song.
 *
 * @param {string} cid      - Content ID (YouTube video ID or SoundCloud track ID)
 * @param {string} name     - Track display name "Artist - Title"
 * @param {number} type     - MEDIA_YOUTUBE (1) or MEDIA_SOUNDCLOUD (2)
 * @param {boolean} [tobottom] - If true, don't bump to top of queue
 */
firetable.actions.queueTrack = function (cid, name, type, tobottom) {
  var info = { type: type, name: name, cid: cid };

  // Visual feedback: checkmark on the queue button
  $("#apv" + type + cid).find(".material-symbols-outlined").text("check");
  $("#apv" + type + cid).css("color", firetable.orange);
  $("#apv" + type + cid).css("pointer-events", "none");
  setTimeout(function () {
    $("#apv" + type + cid).find(".material-symbols-outlined").text("playlist_add");
    $("#apv" + type + cid).removeAttr("style");
  }, 3000);

  var cuteid = ftapi.actions.addToList(type, name, cid, false, function () {
    firetable.debug && console.log('queue track id:', cuteid);
    if (!tobottom) firetable.actions.bumpSongInQueue(cuteid);
  });

  // Cancel any active search preview
  firetable.utilities.cancelSearchPreview();

  // Switch view back to queue
  $("#mainqueuestuff").css("display", "block");
  $("#filterMachine").css("display", "block");
  $("#addbox").css("display", "none");
  $("#cancelqsearch").hide();
  $("#qControlButtons").show();
};

// ─── Queue Reorder (Sortable) ────────────────────────────────────────────────

/**
 * Called when the user drags a song to a new position in the queue.
 * Reads the new DOM order and pushes it to the server.
 */
firetable.actions.updateQueue = function () {
  var arr = $('#mainqueue > div').map(function () {
    return this.id.slice(5);
  }).get();
  ftapi.actions.reorderList(arr, firetable.preview, function (changePV) {
    if (changePV) firetable.preview = changePV;
  });
};

/** Shuffle the current playlist on the server. */
firetable.actions.shuffleQueue = function () {
  ftapi.actions.shuffleList(firetable.preview, function (changePV) {
    if (changePV) firetable.preview = changePV;
  });
};

/** Remove duplicate tracks from the current playlist. */
firetable.actions.removeDupesFromQueue = function () {
  ftapi.actions.removeDuplicatesFromList();
  $("#mergeCompleted").show();
  $("#mergeHappening").hide();
};

/**
 * Move a track to the top of the queue.
 * @param {string} songid - Track key in the playlist
 */
firetable.actions.bumpSongInQueue = function (songid) {
  ftapi.actions.moveTrackToTop(songid, firetable.preview, function (changePV) {
    if (changePV) firetable.preview = changePV;
  });
};

/**
 * Delete a track from the current playlist.
 * @param {string} id - Track key
 */
firetable.actions.deleteSong = function (id) {
  ftapi.actions.deleteTrack(id);
};

/**
 * Filter visible queue items by a search string.
 * @param {string} val - Filter text (empty string shows all)
 */
firetable.actions.filterQueue = function (val) {
  if (val.length === 0) {
    $("#mainqueue .pvbar").show();
    return;
  }
  val = val.toLowerCase();
  $("#mainqueue .pvbar").each(function (p, q) {
    var txt = $(q).find(".listwords").text();
    if (txt.match(new RegExp(val, 'ig'))) {
      $(q).show();
    } else {
      $(q).hide();
    }
  });
};

// ─── Merge / Copy Lists ──────────────────────────────────────────────────────

/**
 * Merge (copy) tracks from one playlist into another.
 * If source === dest, deduplicates instead.
 * If dest === -1, creates a new playlist copy.
 * @param {string} source     - Source list ID
 * @param {string} dest       - Destination list ID (or -1 for new)
 * @param {string} sourceName - Display name of the source list
 */
firetable.actions.mergeLists = function (source, dest, sourceName) {
  if (source === dest) {
    firetable.actions.removeDupesFromQueue();
    return;
  }
  if (dest == -1) {
    var newname = firetable.utilities.format_date(Date.now()) + " Copy of " + sourceName;
    dest = ftapi.actions.createList(newname);
    $("#listpicker").append('<option id="pdopt' + dest + '" value="' + dest + '">' + newname + '</option>');
  }
  ftapi.actions.mergeLists(source, dest, function () {
    $("#mergeCompleted").show();
    $("#mergeHappening").hide();
  });
};

// ─── Queue From Link (Drag & Drop URLs) ─────────────────────────────────────

/**
 * Parse a YouTube or SoundCloud URL and add the track to the queue.
 * Called by the LinkGrabber when a URL is dragged onto the queue area.
 * @param {string} link - Full URL
 */
firetable.actions.queueFromLink = function (link) {
  if (link.match(/youtube.com\/watch/)) {
    firetable.debug && console.log("yt");
    var therealid = getQueryStringValue(link, "v");
    if (therealid) {
      youtubeAPIReady(function () {
        gapi.client.youtube.videos.list({
          id: therealid,
          part: 'snippet',
          maxResults: 1
        }).execute(function (response) {
          firetable.debug && console.log('queue from link:', response);
          if (response.result && response.result.items && response.result.items.length) {
            var item = response.result.items[0];
            var parsed = firetable.utilities.parseArtistTitle(
              item.snippet.title,
              item.snippet.channelTitle.replace(" - Topic", "")
            );
            firetable.actions.queueTrack(item.id, parsed.artist + " - " + parsed.title, MEDIA_YOUTUBE);
          }
        });
      });
    }
  } else if (link.match(/soundcloud.com/)) {
    firetable.debug && console.log("sc");
    firetable.actions.resolveSCLink(link, function (tracks) {
      if (tracks) {
        var parsed = firetable.utilities.parseArtistTitle(tracks.title, tracks.user.username);
        firetable.actions.queueTrack(tracks.id, parsed.artist + " - " + parsed.title, MEDIA_SOUNDCLOUD);
      }
    });
  }
};

// ─── SoundCloud Resolution ───────────────────────────────────────────────────

/**
 * Resolve a SoundCloud URL to track/playlist metadata via proxy.
 * @param {string} link     - Full SoundCloud URL
 * @param {Function} callback - Called with the resolved response object
 */
firetable.actions.resolveSCLink = function (link, callback) {
  var importantStuff = link.replace("https://soundcloud.com/", "").replace("http://soundcloud.com/", "");
  $.ajax({
    url: SC_RESOLVE_URL + importantStuff,
    type: 'GET',
    dataType: 'json',
    success: function (res) {
      console.log(res);
      callback(res.response);
    }
  });
};

/**
 * Generic SoundCloud API GET request via proxy.
 * @param {string} type     - Resource type (e.g. 'playlists')
 * @param {string} q        - Query/ID
 * @param {Function} callback - Called with the response
 */
firetable.actions.scGet = function (type, q, callback) {
  $.ajax({
    url: SC_PROXY_URL + "?type=" + type + "&q=" + q,
    type: 'GET',
    dataType: 'json',
    success: function (res) {
      console.log(res);
      callback(res.response);
    }
  });
};

// ─── Playlist Import ─────────────────────────────────────────────────────────

/**
 * Import a full playlist from YouTube or SoundCloud into a new local list.
 * YouTube playlists are paginated (50 items per page).
 * @param {string} id   - Playlist/set ID
 * @param {string} name - Display name for the new local list
 * @param {number} type - MEDIA_YOUTUBE (1) or MEDIA_SOUNDCLOUD (2)
 */
firetable.actions.importList = function (id, name, type) {
  $("#overlay").removeClass('show');
  $("#importResults").html("");
  $("#plMachine").val("");

  if (type === MEDIA_YOUTUBE) {
    var finalList = [];

    var fetchPage = function (pageToken) {
      youtubeAPIReady(function () {
        var params = {
          playlistId: id,
          maxResults: IMPORT_PAGE_SIZE,
          part: "snippet"
        };
        if (pageToken) params.pageToken = pageToken;

        gapi.client.youtube.playlistItems.list(params).execute(function (response) {
          if (response.items && response.items.length) {
            for (var idx = 0; idx < response.items.length; idx++) {
              finalList.push(response.items[idx]);
            }
          }
          if (response.nextPageToken) {
            fetchPage(response.nextPageToken);
          } else {
            // All pages fetched — create the list
            firetable.debug && console.log(finalList);
            var listid = ftapi.actions.createList(name);
            $("#listpicker").append('<option id="pdopt' + listid + '" value="' + listid + '">' + name + '</option>');
            for (var i = 0; i < finalList.length; i++) {
              var goodTitle = finalList[i].snippet.title;
              if (goodTitle !== "Private video" && goodTitle !== "Deleted video") {
                ftapi.actions.addToList(MEDIA_YOUTUBE, goodTitle, finalList[i].snippet.resourceId.videoId, listid);
              }
            }
          }
        });
      });
    };
    fetchPage(); // start with first page

  } else if (type === MEDIA_SOUNDCLOUD) {
    firetable.actions.scGet('playlists', id, function (listinfo) {
      firetable.debug && console.log('sc tracks:', listinfo.tracks);
      var listid = ftapi.actions.createList(name);
      $("#listpicker").append('<option id="pdopt' + listid + '" value="' + listid + '">' + name + '</option>');
      for (var i = 0; i < listinfo.tracks.length; i++) {
        var goodTitle;
        if (listinfo.tracks[i].title) {
          var parsed = firetable.utilities.parseArtistTitle(listinfo.tracks[i].title, listinfo.tracks[i].user.username);
          goodTitle = parsed.artist + " - " + parsed.title;
        } else {
          goodTitle = "Unknown";
        }
        ftapi.actions.addToList(MEDIA_SOUNDCLOUD, goodTitle, listinfo.tracks[i].id, listid);
      }
    });
  }
};

// ─── Dubtrack Import ─────────────────────────────────────────────────────────

/**
 * Import tracks from the parsed Dubtrack export file.
 * Expects firetable.dtImportList and firetable.dtImportName to be populated
 * by dubtrackImportFileSelect().
 */
firetable.actions.dubtrackImport = function () {
  $("#importDubResults").html("importing (0/" + firetable.dtImportList.length + ")...");
  $("#dubimportButton").hide();
  var listid = ftapi.actions.createList(firetable.dtImportName);
  var name = firetable.dtImportName;
  $("#listpicker").append('<option id="pdopt' + listid + '" value="' + listid + '">' + name + '</option>');

  var trackarray = firetable.dtImportList;
  for (var e = 0; e < trackarray.length; e++) {
    var thetype = trackarray[e].type === "soundcloud" ? MEDIA_SOUNDCLOUD : MEDIA_YOUTUBE;
    var numbo = e + 1;
    $("#importDubResults").html("importing (" + numbo + "/" + firetable.dtImportList.length + ")...");
    if (numbo === firetable.dtImportList.length) {
      $("#importDubResults").html("Import complete! You can now select another file if you'd like to do another!");
    }
    ftapi.actions.addToList(thetype, trackarray[e].name, trackarray[e].cid, listid);
  }
};

/**
 * Parse a Dubtrack HTML export file and prepare it for import.
 * Populates firetable.dtImportName and firetable.dtImportList.
 * @param {Event} evt - File input change event
 */
firetable.ui.dubtrackImportFileSelect = function (evt) {
  var file = evt.target.files[0];
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function (event) {
    try {
      var allthestuff = event.currentTarget.result;
      firetable.dtImportName = firetable.ui.strip(allthestuff.split('<h4>')[1].split('</h4>')[0]);
      var hams = allthestuff.split('<li class="list-group-item list-group-item-dark" ');
      hams.shift();
      firetable.dtImportList = [];
      for (var i = 0; i < hams.length; i++) {
        var thingsRegex = /(type\=\"(.*))(" id\=\"(.*)\")>(.*)<\/li>/gm;
        var matches = thingsRegex.exec(hams[i]);
        firetable.dtImportList.push({
          type: matches[2],
          cid: matches[4],
          name: firetable.ui.strip(matches[5])
        });
      }
      if (firetable.dtImportList.length) {
        $("#importDubResults").text("Ok... import " + firetable.dtImportName + " (" + firetable.utilities.pluralize(firetable.dtImportList.length, "track") + ")?");
        $("#dubimportButton").show();
      } else {
        $("#importDubResults").text("ERROR... NO TRAX?");
        $("#dubimportButton").hide();
      }
    } catch (e) {
      console.log(e);
      $("#importDubResults").text("ERROR");
      $("#dubimportButton").hide();
    }
  };
};

// ─── Tag Editing ─────────────────────────────────────────────────────────────

/**
 * Show the tag editor prompt on a history item.
 * @param {string} songid - data-key of the history item
 * @param {string} tag    - Current "Artist - Title" string
 */
firetable.actions.editTagsPrompt = function (songid, tag, anchorEl) {
  var popoverEl = document.getElementById('tagEditorPopover');
  if (popoverEl.matches(':popover-open')) popoverEl.hidePopover();
  $('.pvbar.editing').removeClass('editing');
  var $pvbar = $('.pvbar[data-key="' + songid + '"]').first();
  $pvbar.addClass('editing');
  firetable.editingPvbar = $pvbar;
  $(popoverEl).find('.tagMachine').val(tag);
  popoverEl.style.visibility = 'hidden';
  popoverEl.showPopover();
  firetable.ui.positionPopover(anchorEl || $pvbar.find('.edittags')[0], popoverEl, document.getElementById('tagEditorArrow'), 'bottom').then(function () {
    $(popoverEl).find('.tagMachine')[0].focus();
  });
  firetable.debug && console.log('edit tags song id:', songid);
};

// ─── Playlist Event Binding ──────────────────────────────────────────────────

/**
 * Set up the playlistChanged event handler and queue-related UI bindings.
 * Called once from firetable.ui.init().
 */
firetable.ui.setupPlaylistEvents = function () {

  // ── Sortable drag-and-drop queue ──
  $('#mainqueue').sortable({
    start: function (event, ui) {
      ui.item.data('start_pos', ui.item.index());
    },
    update: function () {
      firetable.debug && console.log("UPDATE");
      firetable.actions.updateQueue();
    }
  });

  // ── Playlist changed: re-render the queue ──
  ftapi.events.on("playlistChanged", function (okdata, listID) {
    firetable.queue = okdata;
    $('#mainqueue').html("");

    for (var key in okdata) {
      if (!okdata.hasOwnProperty(key)) continue;
      var thisone = okdata[key];
      var $newli = $playlistItemTemplate.clone();
      var psign = (key === firetable.preview) ? "&#xE034;" : "&#xE037;";

      $newli.attr('id', "pvbar" + key)
            .attr("data-key", key)
            .attr("data-type", thisone.type)
            .attr("data-cid", thisone.cid);

      // Album art thumbnail
      var artUrl = thisone.type === MEDIA_YOUTUBE
        ? 'https://i.ytimg.com/vi/' + thisone.cid + '/mqdefault.jpg'
        : '';
      if (artUrl) $newli.find('.q-art').css('background-image', 'url(' + artUrl + ')');

      // Preview button
      $newli.find('.previewicon').attr('id', "pv" + key).on('click', function () {
        firetable.actions.pview(
          $(this).closest('.pvbar').attr('data-key'),
          false,
          $(this).closest('.pvbar').attr('data-type')
        );
      }).html(psign);

      // Track title
      $newli.find('.listwords').html(thisone.name);

      // Bump to top
      $newli.find('.bumpsongs').on('click', function () {
        firetable.actions.bumpSongInQueue($(this).closest('.pvbar').attr('data-key'));
      });

      // Move to bottom
      $newli.find('.bottomsongs').on('click', function () {
        var oldID = $(this).closest('.pvbar').attr('data-key');
        ftapi.actions.moveTrackToBottom(oldID, function (newID) {
          if (firetable.preview && firetable.preview === oldID) {
            firetable.preview = newID;
            $("#pv" + newID).html("&#xE034;");
          }
        });
      });

      // Flagged track warning icon
      if (thisone.flagged) {
        var flagLabel = "broken";
        var flagIcon = "warning";
        if (thisone.flagged.code === 7) {
          flagLabel = "age restricted";
        } else if (thisone.flagged.code === 8) {
          flagLabel = "broken (manual)";
        } else if (thisone.flagged.code === 9) {
          flagLabel = "low audio quality";
          flagIcon = "disc_full";
        } else if (thisone.flagged.code === 10) {
          flagLabel = "offtheme";
          flagIcon = "flag";
        }
        $newli.find('.track-warning')
          .html('<span class="material-symbols-outlined"> ' + flagIcon + ' </span>')
          .prop('title', 'Flagged as ' + flagLabel + ' on ' + firetable.utilities.format_date(thisone.flagged.date) + '. Click to remove flag.')
          .on('click', function () {
            ftapi.actions.unflagTrack($(this).closest('.pvbar').attr('data-key'));
            $(this).html("");
          });
      }

      // Delete button
      $newli.find('.deletesong').on('click', function () {
        firetable.actions.deleteSong($(this).closest('.pvbar').attr('data-key'));
      });

      // Edit tags button
      $newli.find('.edittags').on('click', function () {
        var popoverEl = document.getElementById('tagEditorPopover');
        var $pvbar = $(this).closest('.pvbar');
        if (popoverEl.matches(':popover-open') && firetable.editingPvbar && firetable.editingPvbar.is($pvbar)) {
          popoverEl.hidePopover();
        } else {
          firetable.actions.editTagsPrompt(
            $pvbar.attr('data-key'),
            $pvbar.find('.listwords').text(),
            this
          );
        }
      });

      // Close editor button
      $newli.find('.closeeditor').on('click', function () {
        document.getElementById('tagEditorPopover').hidePopover();
      });

      if (!ftapi.isMod) $newli.find('.edittags, .closeeditor').hide();

      // Add-to-playlist button
      $newli.find('.histeal').on('click', function () {
        var $btn = $(this);
        var $pvbar = $btn.closest('.pvbar');
        var btnCid = $pvbar.attr('data-cid');
        var btnType = $pvbar.attr('data-type');
        var btnTitle = firetable.utilities.htmlEscape($pvbar.find('.listwords').text());

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

      $('#mainqueue').append($newli);
    }
  });

  // ── Queue filter input ──
  $("#queueFilter").on("change paste keyup", function () {
    firetable.actions.filterQueue($(this).val());
  });

  // ── Shuffle button ──
  $("#shuffleQueue").bind("click", firetable.actions.shuffleQueue);

  // ── Add-to-queue toggle ──
  $("#addToQueueBttn").bind("click", function () {
    $("#mainqueuestuff").css("display", "none");
    $("#filterMachine").css("display", "none");
    $("#addbox").css("display", "flex");
    $("#cancelqsearch").show();
    $("#qControlButtons").hide();
    $("#plmanager").css("display", "none");
  });

  // ── Cancel search / back to queue ──
  $("#cancelqsearch").bind("click", function () {
    $("#mainqueuestuff").css("display", "block");
    $("#filterMachine").css("display", "block");
    $("#cancelqsearch").hide();
    $("#qControlButtons").show();
    $("#addbox").css("display", "none");
    firetable.utilities.cancelSearchPreview();
  });

  // ── Create new playlist ──
  $("#plmaker").bind("keyup", function (e) {
    if (e.which !== 13) return;
    var val = $(this).val();
    if (val) {
      var listid = ftapi.actions.createList(val);
      $("#listpicker").append('<option id="pdopt' + listid + '" value="' + listid + '">' + val + '</option>');
      $("#listpicker").val(listid).change();
      ftapi.actions.switchList(listid);
    }
  });

  // ── Delete playlist ──
  $("#pldeleteButton").bind("click", function () {
    var val = $("#deletepicker").val();
    firetable.debug && console.log('playlist delete:', val);
    if (ftapi.users[ftapi.uid] && ftapi.users[ftapi.uid].selectedList === val) {
      $("#listpicker").val("0").change();
    }
    ftapi.actions.deleteList(val);
    $("#pdopt" + val).remove();
    $("#overlay").removeClass('show');
  });

  // ── Import launcher ──
  $("#plimportLauncher").bind("click", function () {
    $("#overlay").addClass('show');
    $(".modalThing").removeClass('show');
    $('#importPromptBox').addClass('show');
  });

  // ── Delete launcher ──
  $("#pldeleteLauncher").bind("click", function () {
    ftapi.lookup.allLists(function (allPlaylists) {
      $("#deletepicker").html("");
      for (var key in allPlaylists) {
        if (allPlaylists.hasOwnProperty(key)) {
          $("#deletepicker").append('<option value="' + key + '">' + allPlaylists[key].name + '</option>');
        }
      }
      $("#overlay").addClass('show');
      $(".modalThing").removeClass('show');
      $('#deletePromptBox').addClass('show');
    });
  });

  // ── Dubtrack import file select ──
  $('#dubtrackimportfile').bind('change', firetable.ui.dubtrackImportFileSelect);
  $("#importDubGo").bind("click", firetable.actions.dubtrackImport);

  // ── Merge lists UI ──
  $("#mergeLists").bind("click", function () {
    var $this = $(this);
    var isHidden = $("#mergeContain").is(":hidden");
    if (isHidden) {
      ftapi.lookup.allLists(function (allPlaylists) {
        $("#mergepicker").html('<option value="0">Default Queue</option>');
        $("#mergepicker2").html('<option value="-1">Create New Copy</option><option value="0">Default Queue</option>');
        for (var key in allPlaylists) {
          if (allPlaylists.hasOwnProperty(key)) {
            $("#mergepicker").append('<option value="' + key + '">' + allPlaylists[key].name + '</option>');
            $("#mergepicker2").append('<option value="' + key + '">' + allPlaylists[key].name + '</option>');
          }
        }
        if (ftapi.users[ftapi.uid] && ftapi.users[ftapi.uid].selectedList) {
          $("#mergepicker").val(ftapi.users[ftapi.uid].selectedList).change();
          $("#mergepicker2").val(-1).change();
        }
        $("#mergeContain").show();
        $this.addClass('on');
      });
    } else {
      $("#mergeContain").hide();
      $this.removeClass('on');
    }
  });
  $("#startMerge").bind("click", function () {
    var source = $("#mergepicker").val();
    var sourceName = $("#mergepicker option:selected").text();
    var dest = $("#mergepicker2").val();
    $("#mergeSetup").hide();
    $("#mergeHappening").show();
    firetable.debug && console.log(sourceName + " -> " + $("#mergepicker2 option:selected").text());
    firetable.actions.mergeLists(source, dest, sourceName);
  });
  $("#mergeOK").bind("click", function () {
    $("#mergeSetup").show();
    $("#mergeCompleted").hide();
    $("#mergeHappening").hide();
    $("#mergeContain").hide();
  });

  // ── Tag editing (Enter in .tagMachine) ──
  $(document).on("keyup", ".tagMachine", function (e) {
    if (e.which !== 13) return;
    var $pvbar = firetable.editingPvbar;
    if (!$pvbar || !$pvbar.length) return;
    var val = $(this).val();
    if (!val) return;
    var yargo = val.split(" - ");
    if (!yargo[0] || !yargo[1]) {
      alert("check yr tags");
    } else {
      ftapi.actions.editTag(
        $pvbar.attr('data-type'),
        $pvbar.attr('data-cid'),
        val,
        $pvbar.attr('data-histid')
      );
      document.getElementById('tagEditorPopover').hidePopover();
    }
  });

  // ── Tag editor popover cleanup on auto-dismiss ──
  document.getElementById('tagEditorPopover').addEventListener('toggle', function (e) {
    if (e.newState === 'closed' && firetable.editingPvbar) {
      firetable.editingPvbar.removeClass('editing');
      firetable.editingPvbar = null;
    }
  });
};
