/**
 * ui.js — Miscellaneous UI bindings, settings, modals, and the LinkGrabber.
 *
 * This module contains:
 * - firetable.ui.hidePlayerControls / showPlayerControls
 * - firetable.ui.LinkGrabber (drag-and-drop link detection)
 * - firetable.ui.usertab1 / usertab2
 * - firetable.ui.loginEventsInit / loginEventsDestroy / loginLinkToggle
 * - firetable.ui.initSettings(): restore settings from localStorage
 * - firetable.ui.setupMiscEvents(): modals, sortable, volume, grab, settings toggles, etc.
 * - firetable.ui.init(): orchestrator that calls all setup*Events functions
 *
 * Depends on: constants.js, state.js, helpers.js, player.js
 */

// ─── Player Controls Visibility ──────────────────────────────────────────────

// ─── Floating UI Popover Positioning ─────────────────────────────────────────
firetable.ui.positionPopover = function (anchorEl, floatingEl, arrowEl, preferredPlacement) {
  var ARROW_SIZE = 8; // px — must match .ft-arrow width/height in CSS

  // Reset to known origin before computePosition measures the element
  floatingEl.style.top  = '0';
  floatingEl.style.left = '0';

  // When a preferred placement is given, use flip() to respect it but fall
  // back to the opposite side if there's no space.
  // Otherwise use autoPlacement() to always pick the side with most space.
  var options = {
    strategy: 'fixed',
    middleware: [
      FloatingUIDOM.offset(ARROW_SIZE),
      preferredPlacement
        ? FloatingUIDOM.flip()
        : FloatingUIDOM.autoPlacement({ padding: 8 }),
      FloatingUIDOM.shift({ padding: 8 }),
      arrowEl ? FloatingUIDOM.arrow({ element: arrowEl, padding: 8 }) : null
    ]
  };
  if (preferredPlacement) {
    options.placement = preferredPlacement;
  }

  return FloatingUIDOM.computePosition(anchorEl, floatingEl, options).then(function (pos) {
    floatingEl.style.left = pos.x + 'px';
    floatingEl.style.top  = pos.y + 'px';

    if (arrowEl && pos.middlewareData.arrow) {
      var ax = pos.middlewareData.arrow.x;
      var ay = pos.middlewareData.arrow.y;
      // staticSide is the edge the arrow pokes out of — opposite the placement side
      var staticSide = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[pos.placement.split('-')[0]];
      Object.assign(arrowEl.style, {
        left:   ax != null ? ax + 'px' : '',
        top:    ay != null ? ay + 'px' : '',
        right:  '',
        bottom: '',
        [staticSide]: -(ARROW_SIZE / 2) + 'px'
      });
    }

    floatingEl.style.visibility = 'visible';
  });
};

/**
 * Hide player/preview controls (when media playback is disabled).
 */
firetable.ui.hidePlayerControls = function () {
  $("head").append(
    "<style class='playerControlsHider'>" +
    ".previewicon { display: none !important; } " +
    "div#playerControls { display: none !important; } " +
    "</style>"
  );
};

/**
 * Show player/preview controls (re-enables media playback UI).
 */
firetable.ui.showPlayerControls = function () {
  $(".playerControlsHider").remove();
};

// ─── User Tabs (All Users / Waitlist) ────────────────────────────────────────

/** Show the "All Users" panel, hide the "Waitlist" panel */
firetable.ui.usertab1 = function () {
  $("#allusersWrap").css("display", "block");
  $("#justwaitWrap").css("display", "none");
  $("#usertabs").find(".on").removeClass("on");
  $("#label1").addClass("on");
};

/** Show the "Waitlist" panel, hide the "All Users" panel */
firetable.ui.usertab2 = function () {
  $("#usertabs").find(".on").removeClass("on");
  $("#label2").addClass("on");
  $("#allusersWrap").css("display", "none");
  $("#justwaitWrap").css("display", "block");
};

// ─── LinkGrabber (Drag-and-Drop Track Detection) ─────────────────────────────

/**
 * Intercepts drag-and-drop events over the queue panel.
 * Creates a transparent <textarea> overlay to capture dropped URLs,
 * then passes them to queueFromLink().
 */
firetable.ui.LinkGrabber = {
  textarea: null,

  /** Create the transparent textarea overlay if inside #queuelist */
  attach_ta: function (event) {
    if (!$.contains(document.getElementById("queuelist"), event.target)) return;
    if (firetable.ui.LinkGrabber.textarea != null) return;

    var textarea = firetable.ui.LinkGrabber.textarea = document.createElement("textarea");
    textarea.setAttribute("style",
      "position: fixed; width: 100%; margin: 0; top: 0; bottom: 0; right: 0; left: 0; z-index: 99999999"
    );
    textarea.style.opacity = "0.000000000000000001";
    document.getElementsByTagName("body")[0].appendChild(textarea);
    textarea.oninput = firetable.ui.LinkGrabber.evt_got_link;
  },

  /** Remove the textarea overlay */
  detach_ta: function () {
    if (firetable.ui.LinkGrabber.textarea == null) return;
    var textarea = firetable.ui.LinkGrabber.textarea;
    textarea.parentNode.removeChild(textarea);
    firetable.ui.LinkGrabber.textarea = null;
  },

  /** Called on dragover/dragenter — creates the overlay */
  evt_drag_over: function (event) {
    firetable.ui.LinkGrabber.attach_ta(event);
  },

  /** Called when a link is dropped into the textarea */
  evt_got_link: function () {
    var link = firetable.ui.LinkGrabber.textarea.value;
    firetable.debug && console.log("NEW LINK RECEIVED VIA THE DRAGON'S DROP. " + link);
    firetable.actions.queueFromLink(link);
    firetable.ui.LinkGrabber.detach_ta();
  },

  /** Called on mouseup/dragleave — removes overlay if target matches */
  evt_drag_out: function (e) {
    if (e.target == firetable.ui.LinkGrabber.textarea) {
      firetable.ui.LinkGrabber.detach_ta();
    }
  },

  /** Attach global drag-and-drop listeners */
  start: function () {
    document.addEventListener("dragover",  firetable.ui.LinkGrabber.evt_drag_over, false);
    document.addEventListener("dragenter", firetable.ui.LinkGrabber.evt_drag_over, false);
    document.addEventListener("mouseup",   firetable.ui.LinkGrabber.evt_drag_out, false);
    document.addEventListener("dragleave", firetable.ui.LinkGrabber.evt_drag_out, false);
  },

  /** Remove global drag-and-drop listeners */
  stop: function () {
    document.removeEventListener("dragover",  firetable.ui.LinkGrabber.evt_drag_over);
    document.removeEventListener("dragenter", firetable.ui.LinkGrabber.evt_drag_over);
    document.removeEventListener("mouseup",   firetable.ui.LinkGrabber.evt_drag_out);
    document.removeEventListener("dragleave", firetable.ui.LinkGrabber.evt_drag_out);
    firetable.ui.LinkGrabber.detach_ta();
  }
};

// ─── Settings Initialization ─────────────────────────────────────────────────

/**
 * Restore user settings from localStorage and apply them to the UI.
 * Called once during firetable.ui.init().
 */
firetable.ui.initSettings = function () {

  // ── Disable Media Playback ──
  var disableMediaPlayback = localStorage[STORAGE.disableMedia];
  if (typeof disableMediaPlayback == "undefined") {
    localStorage[STORAGE.disableMedia] = false;
    firetable.disableMediaPlayback = false;
    $("#mediaDisableToggle").prop("checked", false);
  } else {
    disableMediaPlayback = JSON.parse(disableMediaPlayback);
    firetable.disableMediaPlayback = disableMediaPlayback;
    $("#mediaDisableToggle").prop("checked", disableMediaPlayback);
    if (disableMediaPlayback) firetable.ui.hidePlayerControls();
  }

  // ── Show Inline Images ──
  var showImages = localStorage[STORAGE.showImages];
  if (typeof showImages == "undefined") {
    localStorage[STORAGE.showImages] = false;
    firetable.showImages = false;
    $("#showImagesToggle").prop("checked", false);
  } else {
    showImages = JSON.parse(showImages);
    firetable.showImages = showImages;
    $("#showImagesToggle").prop("checked", showImages);
  }

  // ── Show Avatars ──
  var showAvatars = localStorage[STORAGE.showAvatars];
  if (typeof showAvatars == "undefined") {
    localStorage[STORAGE.showAvatars] = true;
    firetable.showAvatars = true;
    $("#showAvatarsToggle").prop("checked", true);
  } else {
    showAvatars = JSON.parse(showAvatars);
    firetable.showAvatars = showAvatars;
    $("#showAvatarsToggle").prop("checked", showAvatars);
    if (showAvatars == false) {
      document.getElementById("actualChat").classList.add("avatarsOff");
    }
  }

  // ── Chat Sound (Badoop) ──
  var playBadoop = localStorage[STORAGE.badoop];
  if (typeof playBadoop == "undefined") {
    localStorage[STORAGE.badoop] = true;
    firetable.playBadoop = true;
    $("#badoopToggle").prop("checked", true);
  } else {
    playBadoop = JSON.parse(playBadoop);
    firetable.playBadoop = playBadoop;
    $("#badoopToggle").prop("checked", playBadoop);
  }

  // ── Desktop Notifications for Mentions ──
  var dtnmt = localStorage[STORAGE.notifyMentions];
  if (typeof dtnmt == "undefined") {
    localStorage[STORAGE.notifyMentions] = false;
    firetable.desktopNotifyMentions = false;
    $("#desktopNotifyMentionsToggle").prop("checked", false);
  } else {
    dtnmt = JSON.parse(dtnmt);
    firetable.desktopNotifyMentions = dtnmt;
    $("#desktopNotifyMentionsToggle").prop("checked", dtnmt);
  }

  // ── Screen Control (on/off/sync) ──
  var screenControl = localStorage[STORAGE.screenControl];
  if (typeof screenControl == "undefined") {
    localStorage[STORAGE.screenControl] = "sync";
    firetable.screenControl = "sync";
  } else {
    firetable.screenControl = screenControl;
    if (screenControl == "on") {
      firetable.utilities.screenDown();
    } else if (screenControl == "off") {
      firetable.utilities.screenUp();
    } else if (screenControl == "sync") {
      if (firetable.screenSyncPos) firetable.utilities.screenDown();
      else firetable.utilities.screenUp();
    }
  }
  firetable.ui.updateScreenBtn(firetable.screenControl);

  // ── Avatar Style ──
  var savedAvatarStyle = localStorage[STORAGE.avatarStyle];
  if (savedAvatarStyle) {
    firetable.avatarStyle = savedAvatarStyle;
    $("#avatarStylePicker").val(savedAvatarStyle);
  }
};

// ─── Miscellaneous UI Event Bindings ─────────────────────────────────────────

/**
 * Bind all remaining UI events that don't belong in chat/search/playlist/users/room:
 * modals, settings toggles, grab, volume, mini-mode, emoji picker, etc.
 * Called once from firetable.ui.init().
 */

// ─── Navigation State ─────────────────────────────────────────────────────────
// Tracks three independent pieces of state:
//   view         – which content view is active (playlists|history|cards|discover)
//   side         – which side panel is active at medium (chat|people)
//   mobileSection – which group shows on mobile (view|chat|people)
// All three are persisted to localStorage so refresh restores the exact state.

firetable.nav = {
  view: 'playlists',
  side: 'chat',
  mobileSection: 'view',

  _validViews:   ['playlists', 'history', 'cards', 'discover'],
  _validSides:   ['chat', 'people'],
  _validMobile:  ['view', 'chat', 'people'],
  _viewTabMap:   { playlists: 'mm-playlists', history: 'mm-history', cards: 'mm-cards', discover: 'mm-discover' },

  /** Persist current state to localStorage. */
  save: function () {
    localStorage[STORAGE.navView]   = firetable.nav.view;
    localStorage[STORAGE.navSide]   = firetable.nav.side;
    localStorage[STORAGE.navMobile] = firetable.nav.mobileSection;
  },

  /** Restore state from URL path (backward compat) then localStorage. */
  restore: function () {
    var n = firetable.nav;
    // URL path takes priority for viewNav (handles old bookmarks / shared links)
    var pathMatch = location.pathname.match(/\/(playlists|history|cards|discover)\/?$/);
    if (pathMatch) {
      n.view = pathMatch[1];
      n.mobileSection = 'view';
      // Clean up the URL so it doesn't look like we still do path-based routing
      history.replaceState(null, '', location.pathname.replace(/\/(playlists|history|cards|discover)\/?$/, '/'));
    } else {
      var sv = localStorage[STORAGE.navView];
      if (sv && n._validViews.indexOf(sv) !== -1) n.view = sv;
    }
    var ss = localStorage[STORAGE.navSide];
    if (ss && n._validSides.indexOf(ss) !== -1) n.side = ss;

    var sm = localStorage[STORAGE.navMobile];
    if (sm && n._validMobile.indexOf(sm) !== -1) n.mobileSection = sm;

    n.save();
  },

  /** Set the active content view. */
  setView: function (name) {
    firetable.nav.view = name;
    firetable.nav.mobileSection = 'view';
    firetable.nav.save();
    firetable.nav.apply();
  },

  /** Set the active side panel (chat or people). */
  setSide: function (name) {
    firetable.nav.side = name;
    firetable.nav.mobileSection = name; // 'chat' or 'people'
    firetable.nav.save();
    firetable.nav.apply();
  },

  /** Handle a mini-mode tab click by its element ID. */
  setMobileTab: function (tabId) {
    var n = firetable.nav;
    var viewMap = { 'mm-playlists': 'playlists', 'mm-history': 'history', 'mm-cards': 'cards', 'mm-discover': 'discover' };
    if (viewMap[tabId]) {
      n.view = viewMap[tabId];
      n.mobileSection = 'view';
    } else if (tabId === 'mmchat') {
      n.side = 'chat';
      n.mobileSection = 'chat';
    } else if (tabId === 'mmusrs') {
      n.side = 'people';
      n.mobileSection = 'people';
    }
    n.save();
    n.apply();
  },

  /** Apply the current nav state to the DOM based on viewport size. */
  apply: function () {
    var n    = firetable.nav;
    var $g   = $('#mainGrid');
    var isLg = window.matchMedia('(min-width: 1024px)').matches;
    var isMd = window.matchMedia('(min-width: 640px)').matches;

    // ── View class (always) ──
    $g.removeClass('view-playlists view-history view-cards view-discover')
      .addClass('view-' + n.view);

    // ── Header buttons (visible at 640px+) ──
    $('#playlists').toggleClass('on',    n.view === 'playlists');
    $('#history').toggleClass('on',      n.view === 'history');
    $('#cardcase').toggleClass('on',     n.view === 'cards');
    $('#discover-nav').toggleClass('on', n.view === 'discover');

    // ── Layout classes ──
    $g.removeClass('mmqueue mmchat mmusrs');

    if (isLg) {
      // 1024px+: chat AND people always visible (CSS overrides).
      // Still set a layout class so resizing down transitions smoothly.
      $g.addClass(n.side === 'people' ? 'mmusrs' : 'mmchat');
    } else if (isMd) {
      // 640px–1023px: side panel = chat or people
      $g.addClass(n.side === 'people' ? 'mmusrs' : 'mmchat');
      // Mini-mode shows only Chat / People tabs at this size
      $('#minimodeoptions .tab').removeClass('on');
      $('#mmusrs').toggleClass('on', n.side === 'people');
      $('#mmchat').toggleClass('on',  n.side === 'chat');
    } else {
      // Mobile: one panel at a time
      if (n.mobileSection === 'people') {
        $g.addClass('mmusrs');
      } else if (n.mobileSection === 'chat') {
        $g.addClass('mmchat');
      } else {
        $g.addClass('mmqueue');
      }
      // Mini-mode shows all 6 tabs
      $('#minimodeoptions .tab').removeClass('on');
      if (n.mobileSection === 'people') {
        $('#mmusrs').addClass('on');
      } else if (n.mobileSection === 'chat') {
        $('#mmchat').addClass('on');
      } else {
        $('#' + n._viewTabMap[n.view]).addClass('on');
      }
    }

    if (n.view === 'cards') firetable.actions.cardCase();
  }
};

// ── Backward-compat wrapper so any remaining showView calls still work ──
firetable.ui.showView = function (name) {
  firetable.nav.setView(name);
};
firetable.ui.syncNavState = function () {
  firetable.nav.apply();
};
firetable.ui.getViewFromPath = function () {
  return firetable.nav.view;
};

firetable.ui.updateScreenBtn = function (val) {
  var icons  = { on: 'capture', off: 'cancel_presentation', sync: 'microwave' };
  var titles = { on: 'Screen: always on', off: 'Screen: disabled', sync: 'Screen: synced' };
  $('#screenControl').find('.material-symbols-outlined').text(icons[val] || 'microwave');
  $('#screenControl').attr('data-label', titles[val] || 'Screen: synced').attr('aria-label', titles[val] || 'Screen: synced');
  var isOn = (val === 'on') || (val === 'sync' && firetable.screenSyncPos);
  $('#screenControl').toggleClass('on', isOn);
};

// ─── Floating UI Tooltip ─────────────────────────────────────────────────────
firetable.ui.tooltip = (function () {
  var tipEl;

  function show(anchor, text) {
    tipEl.textContent = text;
    tipEl.style.visibility = 'hidden';
    tipEl.classList.add('is-visible');
    FloatingUIDOM.computePosition(anchor, tipEl, {
      placement: 'top',
      strategy: 'fixed',
      middleware: [
        FloatingUIDOM.offset(6),
        FloatingUIDOM.flip(),
        FloatingUIDOM.shift({ padding: 8 })
      ]
    }).then(function (pos) {
      tipEl.style.left = pos.x + 'px';
      tipEl.style.top  = pos.y + 'px';
      tipEl.style.visibility = 'visible';
    });
  }

  function hide() {
    tipEl.classList.remove('is-visible');
  }

  function bind() {
    tipEl = document.getElementById('ft-tooltip');

    // ── Deck: DJ name on plaque hover ──
    $(document).on('mouseenter.ft-tooltip', '#deck .djname', function () {
      var playcount = $(this).siblings('.playcount').text().trim();
      if (playcount) show(this, playcount);
    }).on('mouseleave.ft-tooltip', '#deck .djname', hide);

    // ── Deck icon buttons + departure indicator: title-based ──
    $('#deck').on('mouseenter.ft-tooltip', '[title]', function () {
      var $el = $(this), text = $el.attr('title');
      $el.attr('data-ft-title', text).removeAttr('title');
      show(this, text);
    }).on('mouseleave.ft-tooltip', '[data-ft-title]', function () {
      var $el = $(this);
      $el.attr('title', $el.attr('data-ft-title')).removeAttr('data-ft-title');
      hide();
    });

    // ── Themebox buttons ──
    $('#themebox').on('mouseenter.ft-tooltip', '[title]', function () {
      var $el = $(this), text = $el.attr('title');
      $el.attr('data-ft-title', text).removeAttr('title');
      show(this, text);
    }).on('mouseleave.ft-tooltip', '[data-ft-title]', function () {
      var $el = $(this);
      $el.attr('title', $el.attr('data-ft-title')).removeAttr('data-ft-title');
      hide();
    });

    // ── Queue list: overflow-only title tooltip for track names ──
    $('#queuelist').on('mouseenter.ft-tooltip', '.listwords', function () {
      if (this.scrollWidth > this.offsetWidth) show(this, $(this).text().trim());
    }).on('mouseleave.ft-tooltip', '.listwords', hide);

    // ── Queue list: title-based tooltips for song action buttons ──
    $('#queuelist').on('mouseenter.ft-tooltip', '[title]', function () {
      var $el = $(this), text = $el.attr('title');
      $el.attr('data-ft-title', text).removeAttr('title');
      show(this, text);
    }).on('mouseleave.ft-tooltip', '[data-ft-title]', function () {
      var $el = $(this);
      $el.attr('title', $el.attr('data-ft-title')).removeAttr('data-ft-title');
      hide();
    });

    // ── User list: title-based tooltips ──
    $('#allUsersWrap').on('mouseenter.ft-tooltip', '[title]', function () {
      var $el = $(this), text = $el.attr('title');
      $el.attr('data-ft-title', text).removeAttr('title');
      show(this, text);
    }).on('mouseleave.ft-tooltip', '[data-ft-title]', function () {
      var $el = $(this);
      $el.attr('title', $el.attr('data-ft-title')).removeAttr('data-ft-title');
      hide();
    });
  }

  return { bind: bind, show: show, hide: hide };
})();

firetable.ui.setupMiscEvents = function () {

  // ── Floating UI tooltips ──
  firetable.ui.tooltip.bind();

  // ── Mini mode discover/login tabs (pre-login only) ──
  $("#minidiscover").bind("click", function () {
    firetable.nav.setView('discover');
  });
  $("#minijoin").bind("click", function () {
    firetable.nav.setView('playlists');
  });

  // ── Mini-mode tabs ──
  $("#minimodeoptions .tab").bind("click", function () {
    firetable.nav.setMobileTab($(this).attr('id'));
  });

  // ── Re-apply nav state when crossing breakpoints ──
  window.matchMedia('(min-width: 640px)').addEventListener('change', function () {
    firetable.nav.apply();
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', function () {
    firetable.nav.apply();
  });

  // ── Grab (steal to another playlist) ──
  $("#grab").bind("click", function () {
    var isHidden = $("#stealContain").is(":hidden");
    if (isHidden) {
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
        $('#grab').addClass('on');
        var stealContainEl = document.getElementById('stealContain');
        stealContainEl.style.visibility = 'hidden';
        $("#stealContain").show();
        firetable.ui.positionPopover(document.getElementById('grab'), stealContainEl, document.getElementById('stealArrow'));
      });
    } else {
      $('#grab').removeClass('on');
      $("#stealContain").hide();
    }
  });

  /** Stealpicker — add song to selected playlist (from #grab or histeal) */
  $("#stealpicker").change(function () {
    var dest = $("#stealpicker").val();
    if (dest == "-1") return;
    var src = firetable.stealTarget || (firetable.song && firetable.song.cid != 0 && {
      cid: firetable.song.cid,
      type: firetable.song.type,
      title: firetable.song.artist + " - " + firetable.song.title
    });
    if (src) {
      if (firetable.stealSourceBtn) {
        firetable.stealSourceBtn.removeClass('on');
        firetable.stealSourceBtn = null;
      } else {
        $("#grab").removeClass('on');
      }
      firetable.stealTarget = null;
      ftapi.actions.addToList(src.type, src.title, src.cid, dest);
      $("#stealContain").hide();
    }
  });

  // ── Close steal popover when clicking outside it ──
  $(document).on('click', function (e) {
    if ($("#stealContain").is(':hidden')) return;
    if (!$(e.target).closest('#stealContain, .histeal, #grab').length) {
      if (firetable.stealSourceBtn) {
        firetable.stealSourceBtn.removeClass('on');
        firetable.stealSourceBtn = null;
      } else {
        $("#grab").removeClass('on');
      }
      firetable.stealTarget = null;
      $("#stealContain").hide();
    }
  });

  $(window).on('popstate', function () {
    firetable.nav.restore();
    firetable.nav.apply();
  });

  $("#history").bind("click", function () { firetable.nav.setView('history'); });

  // ── Playlists button toggle ──
  $("#playlists").bind("click", function () { firetable.nav.setView('playlists'); });

  // ── Reload Track ──
  $("#reloadtrack").bind("click", firetable.actions.reloadtrack);

  // ── Volume ──
  $("#volstatus").bind("click", function () {
    firetable.actions.muteToggle();
  });

  // ── Modals ──
  $(".openModal").bind("click", function () {
    var modalContentID = $(this).attr('data-modal');
    var targetTab = $(this).attr('data-tab');
    $(".modalThing").removeClass('show');
    $("#overlay").addClass('show');
    $("#" + modalContentID).addClass('show');
    if (targetTab) {
      var $modal = $("#" + modalContentID);
      $modal.find('.tab').removeClass('on');
      $modal.find('.tabPanel').removeClass('active');
      $modal.find('.tab[data-tab="' + targetTab + '"]').addClass('on');
      $('#' + targetTab).addClass('active');
    }
  });
  // ── Modal tab switching ──
  $('#accountSettingsTabs').on('click', '.tab', function () {
    var targetTab = $(this).attr('data-tab');
    $('#accountSettingsTabs .tab').removeClass('on');
    $(this).addClass('on');
    $('#accountSettingsBox .tabPanel').removeClass('active');
    $('#' + targetTab).addClass('active');
  });
  $(".closeModal").bind("click", function () {
    $("#overlay").removeClass('show');
    $(".modalThing").removeClass('show');
    $("#deletepicker").html("");
    $("#plMachine").val("");
  });
  $("#overlay").bind("click", function () {
    $("#overlay").removeClass('show');
    $(".modalThing").removeClass('show');
    $("#deletepicker").html("");
    $("#plMachine").val("");
  });
  $(".modalThing").bind("click", function (e) {
    e.stopPropagation();
  });

  // ── Card Case panel ──
  $("#cardcase").bind("click", function () { firetable.nav.setView('cards'); });

  // ── Discover / Fresh Produce panel ──
  $("#discover-nav").bind("click", function () { firetable.nav.setView('discover'); });

  // ── Emoji Picker ──
  $("#pickerNav").on("click", "span", function () {
    try {
      firetable.emojis.sec($(this)[0].id);
    } catch (s) { /* ignore */ }
  });
  $("#pickEmoji").bind("click", function () {
    if ($("#emojiPicker").is(":hidden")) {
      $(this).addClass('on');
      $("#emojiPicker").slideDown(function () {
        $('#pickerSearch').focus();
      });
      if (!firetable.pickerInit) {
        (async function () {
          twemoji.parse(document.getElementById("pickerResults"));
          return true;
        })();
      }
    } else {
      $(this).removeClass('on');
      $("#emojiPicker").slideUp(function () {
        $('#pickerSearch').val('').trigger('change');
        $('#newchat').focus();
      });
    }
  });
  $("#pickerSearch").on("change paste keyup", function () {
    firetable.emojis.niceSearch($("#pickerSearch").val());
  });
  $("#pickerResults").on("click", "span", function () {
    try {
      var oldval = $("#newchat").val();
      var newval = oldval + ":" + $(this).attr("title").trim() + ":";
      $("#newchat").focus().val(newval);
    } catch (s) { /* ignore */ }
  });

  // Close picker on Escape or click outside
  function closeEmojiPicker() {
    if (!$("#emojiPicker").is(":hidden")) {
      $("#pickEmoji").removeClass('on');
      $("#emojiPicker").slideUp(function () {
        $('#pickerSearch').val('').trigger('change');
        $('#newchat').focus();
      });
    }
  }
  $(document).on("keydown.emojiPicker", function (e) {
    if (e.key === "Escape") closeEmojiPicker();
  });
  $(document).on("click.emojiPicker", function (e) {
    if (!$(e.target).closest("#emojiPicker, #pickEmoji").length) closeEmojiPicker();
  });

  // ── Settings Toggles ──
  $('#badoopToggle').change(function () {
    firetable.debug && console.log("badoop " + (this.checked ? "on" : "off"));
    localStorage[STORAGE.badoop] = this.checked;
    firetable.playBadoop = this.checked;
  });
  $('#showImagesToggle').change(function () {
    firetable.debug && console.log("show images " + (this.checked ? "on" : "off"));
    localStorage[STORAGE.showImages] = this.checked;
    firetable.showImages = this.checked;
    var imageUrlRegex = /((http(s?):)([/|.|\w|\s|-])*\.(?:jpe?g|gif|png))/g;
    if (this.checked) {
      // Convert plain image links → inline images
      $('#actualChat a[href]').not('.inlineImgLink').each(function () {
        var url = $(this).attr('href');
        if (url && imageUrlRegex.test(url)) {
          var $img = $('<a class="inlineImgLink" target="_blank" tabindex="-1">' +
            '<img src="' + url + '" class="inlineImage" />' +
            '<span role="button" class="hideImage">&times;</span></a>').attr('href', url);
          $(this).replaceWith($img);
        }
        imageUrlRegex.lastIndex = 0;
      });
    } else {
      // Convert inline images → plain links
      $('#actualChat a.inlineImgLink').each(function () {
        var url = $(this).attr('href');
        var $link = $('<a target="_blank" tabindex="-1"></a>').attr('href', url).text(url);
        $(this).replaceWith($link);
      });
    }
    firetable.utilities.scrollToBottom();
  });
  $('#mediaDisableToggle').change(function () {
    firetable.debug && console.log("media disable " + (this.checked ? "on" : "off"));
    localStorage[STORAGE.disableMedia] = this.checked;
    firetable.disableMediaPlayback = this.checked;
    if (this.checked) {
      if (firetable.scLoaded) firetable.scwidget.pause();
      if (firetable.ytLoaded) player.stopVideo();
      firetable.ui.hidePlayerControls();
    } else {
      firetable.ui.showPlayerControls();
      firetable.actions.reloadtrack();
    }
  });
  $('#showAvatarsToggle').change(function () {
    firetable.debug && console.log("show avatars " + (this.checked ? "on" : "off"));
    localStorage[STORAGE.showAvatars] = this.checked;
    firetable.showAvatars = this.checked;
    if (this.checked) {
      document.getElementById("actualChat").classList.remove("avatarsOff");
    } else {
      document.getElementById("actualChat").classList.add("avatarsOff");
    }
  });
  $('#desktopNotifyMentionsToggle').change(function () {
    firetable.debug && console.log("dtnm " + (this.checked ? "on" : "off"));
    localStorage[STORAGE.notifyMentions] = this.checked;
    firetable.desktopNotifyMentions = this.checked;
    if (this.checked && Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  });
  // ── Screen Control button (cycles: sync → on → off) ──
  $('#screenControl').on('click', function () {
    var next = { sync: 'on', on: 'off', off: 'sync' };
    var val = next[firetable.screenControl] || 'sync';
    localStorage[STORAGE.screenControl] = val;
    firetable.screenControl = val;
    firetable.ui.updateScreenBtn(val);
    if (val == 'off') {
      firetable.utilities.screenUp();
    } else if (val == 'on') {
      firetable.utilities.screenDown();
    } else if (val == 'sync') {
      if (firetable.screenSyncPos) firetable.utilities.screenDown();
      else firetable.utilities.screenUp();
    }
  });

  // ── Avatar style picker ──
  $('#avatarStylePicker').on('change', function () {
    var val = $(this).val();
    firetable.avatarStyle = val;
    localStorage[STORAGE.avatarStyle] = val;
    firebase.app("firetable").database().ref("users/" + ftapi.uid + "/avatarStyle").set(val)
      .catch(function (err) { console.error("[firetable] Avatar style save failed:", err); });
    $("#loggedInUser .ft-avatar").css("background-image",
      "url(" + firetable.utilities.avatarURL(ftapi.uid, firetable.uname, null, val) + ")");
  });

  // ── Cancel Search / Return to Queue ──
  $("#cancelqsearch").bind("click", function () {
    $("#mainqueuestuff").css("display", "block");
    $("#filterMachine").css("display", "block");
    $("#cancelqsearch").hide();
    $("#qControlButtons").show();
    $("#addbox").css("display", "none");
    firetable.utilities.cancelSearchPreview();
  });

  // ── Add to Queue button (opens search panel) ──
  $("#addToQueueBttn").bind("click", function () {
    $("#mainqueuestuff").css("display", "none");
    $("#filterMachine").css("display", "none");
    $("#addbox").css("display", "flex");
    $("#cancelqsearch").show();
    $("#qControlButtons").hide();
    $("#plmanager").css("display", "none");
  });
};

// ─── Last.fm Token Check ─────────────────────────────────────────────────────

/**
 * Check for a Last.fm auth token in the URL and exchange it for a session key.
 * Also sets up the scrobble toggle link based on existing session.
 * Called once from firetable.ui.init().
 */
firetable.ui.checkLastfmToken = function () {
  var thingo = localStorage[STORAGE.lastfmSession];
  if (thingo == "false") thingo = false;
  if (thingo) {
    firetable.lastfm.sk = thingo;
    $("#scrobtoggle").html(
      '<a onclick="firetable.lastfm.killSession()" href="#">Disconnect Lastfm Scrobbling</a>'
    );
  } else {
    $("#scrobtoggle").html(
      '<a href="http://www.last.fm/api/auth/?api_key=' + firetable.lastfm.key +
      '&cb=' + window.location.href + '">Set up last.fm scrobbling</a>'
    );
  }

  // Check if URL contains a token param (redirect from Last.fm auth)
  var pattern = /[?&]token=/;
  var URL = location.search;
  if (pattern.test(URL) && !firetable.lastfm.sk) {
    var queries = {};
    $.each(document.location.search.substr(1).split('&'), function (c, q) {
      var i = q.split('=');
      queries[i[0].toString()] = i[1].toString();
    });

    var params = {
      api_key: firetable.lastfm.key,
      token: queries.token,
      method: "auth.getSession"
    };
    var sig = firetable.lastfm.getApiSignature(params);
    params.api_sig = sig;

    var request_url = LASTFM_API_URL + '?' + serialize(params) + "&format=json";
    var xhr = new XMLHttpRequest();
    xhr.open('POST', request_url, true);
    xhr.onload = function () { firetable.lastfm.newSession(xhr); };
    xhr.onerror = firetable.lastfm._onAjaxError;
    xhr.send();
  }

};

// ─── Master UI Initializer ──────────────────────────────────────────────────

/**
 * Main UI initialization — called once after firetable.init() sets up Firebase + APIs.
 * Orchestrates all sub-setup functions and restores persisted settings.
 */
firetable.ui.init = function () {
  // Restore settings from localStorage
  firetable.ui.initSettings();

  // Check for Last.fm auth token / setup scrobble link
  firetable.ui.checkLastfmToken();

  // Initialize all event groups
  firetable.ui.setupChatEvents();
  firetable.ui.setupSearchEvents();
  firetable.ui.setupPlaylistEvents();
  firetable.ui.setupUserEvents();
  firetable.ui.setupRoomEvents();
  firetable.ui.setupMiscEvents();

  // Restore nav state from URL / localStorage and apply to DOM
  firetable.nav.restore();
  firetable.nav.apply();

  // Start drag-and-drop link detection
  firetable.ui.LinkGrabber.start();

  // Login form bindings
  firetable.ui.loginEventsInit();
};
