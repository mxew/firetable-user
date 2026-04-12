/**
 * init.js — Application bootstrap.
 *
 * This is the last module loaded. It defines firetable.init() which:
 *  1. Marks the app as started
 *  2. Applies room branding from ftconfigs (title, logo, social links)
 *  3. Sets up the DOMParser for HTML stripping
 *  4. Binds the window resize handler (debounced)
 *  5. Initializes the SoundCloud widget and binds its READY/PLAY events
 *  6. Removes playlist/tag editor DOM templates for later cloning
 *  7. Boots Firebase via ftapi.init()
 *  8. Initializes the SoundCloud SDK
 *  9. Binds auth lifecycle events (login, logout, reconnect, ban)
 *  10. Calls firetable.ui.init() to wire up the rest of the UI
 *
 * The final line auto-starts the app: `if (!firetable.started) firetable.init();`
 *
 * Depends on: All other modules must be loaded before this file.
 */

// ─── Bootstrap ───────────────────────────────────────────────────────────────

firetable.init = function () {
  console.log(
    "\n" +
    " (                           )             )   (\n" +
    " )\\ )   (    (       (    ( /(      )   ( /(   )\\     (\n" +
    "(()/(   )\\   )(     ))\\   )\\())  ( /(   )\\()) (_))   ))\\\n" +
    " /(_)) ((_) (()\\   /((_) (_))/   )(_)) ((_)\\  | |   /((_)\n" +
    "(_) _|  (_)  ((_) (_))   | |_   ((_)_  | |(_) | |  (_))\n" +
    " |  _|  | | | '_| / -_)  |  _|  / _` | | '_ \\ | |  / -_)\n" +
    " |_|    |_| |_|   \\___|   \\__|  \\__,_| |_.__/ |_|  \\___|"
  );

  firetable.started = true;

  // ── Room Branding ──
  $("#idtitle").text(ftconfigs.roomName);
  $("#welcomeName").text(ftconfigs.roomName);

  if (ftconfigs.avatarset) firetable.avatarset = ftconfigs.avatarset;

  // Social links — show each icon only if the URL is configured
  var socialLinks = [
    { cls: "facebook",   url: ftconfigs.facebookURL },
    { cls: "reddit",     url: ftconfigs.redditURL },
    { cls: "lastfm",     url: ftconfigs.lastfmURL },
    { cls: "discord",    url: ftconfigs.discordURL },
    { cls: "soundcloud", url: ftconfigs.soundcloudURL }
  ];
  socialLinks.forEach(function (link) {
    if (link.url) $(".sociallogo." + link.cls).attr("href", link.url);
  });

  // Social popover: position anchored to trigger, swap icon on toggle
  var socialPopoverEl = document.getElementById('socialPopover');
  if (socialPopoverEl) {
    socialPopoverEl.addEventListener('toggle', function (e) {
      var btn = document.getElementById('socialTrigger');
      var icon = btn && btn.querySelector('.material-icons');
      if (e.newState === 'open') {
        if (icon) icon.textContent = 'close';
        socialPopoverEl.style.visibility = 'hidden';
        firetable.ui.positionPopover(btn, socialPopoverEl, document.getElementById('socialArrow'));
      } else {
        if (icon) icon.textContent = 'share';
      }
    });
  }

  if (ftconfigs.logoImage) {
    $("#roomlogo").css("background-image", "url(" + ftconfigs.logoImage + ")");
  }
  document.title = ftconfigs.roomName + " | firetable";
  if (ftconfigs.roomInfoUrl.length) {
    $("#roomInfo").attr("href", ftconfigs.roomInfoUrl);
  }
  $("#version").text("You're running firetable v" + firetable.version + ".");

  // ── Utilities Setup ──
  firetable.utilities.getEmojiMap();
  firetable.parser = new DOMParser();

  // ── Window Resize Handler (debounced) ──
  $(window).resize(firetable.utilities.debounce(function () {
    $("#thehistory").css('top', $('#stage').outerHeight() + $('#topbar').outerHeight());
    $('#playerArea, #scScreen')
      .width($('#djStage').outerWidth())
      .height($('#djStage').outerHeight());
    setup(); // Re-create the p5.js canvas at the new size
  }, 500));

  firetable.utilities.scrollToBottom();

  // ── SoundCloud Widget ──
  var widgetIframe = document.getElementById('sc-widget');
  firetable.scwidget = SC.Widget(widgetIframe);

  firetable.scwidget.bind(SC.Widget.Events.READY, function () {
    // When a SC track starts playing, apply volume + seek
    firetable.scwidget.bind(SC.Widget.Events.PLAY, function () {
      var vol = localStorage[STORAGE.volume];
      if (!vol) {
        vol = DEFAULT_VOLUME;
        localStorage[STORAGE.volume] = DEFAULT_VOLUME;
      }
      firetable.scwidget.setVolume(vol);
      if (firetable.scSeek) firetable.scwidget.seekTo(firetable.scSeek);
    });

    // If a SC song was already loaded before the widget was ready, start it now
    if (firetable.song && firetable.song.type == MEDIA_SOUNDCLOUD) {
      var data = firetable.song;
      var timeSince = Date.now() - data.started;
      if (timeSince <= 0) timeSince = 0;
      if (!firetable.preview) {
        firetable.scSeek = timeSince;
        if (!firetable.disableMediaPlayback) {
          firetable.scwidget.load(SC_API_TRACK_URL + data.cid, { auto_play: true });
        }
      }
    }
    firetable.scLoaded = true;
  });

  // ── DOM Templates ──
  $playlistItemTemplate = $('#mainqueue .pvbar').remove();

  // ── Firebase Init ──
  ftapi.init(ftconfigs.firebase);

  // ── SoundCloud SDK Init ──
  SC.initialize({ client_id: ftconfigs.soundcloudKey });

  // ── Auth Lifecycle Events ──

  /** User successfully logged in */
  ftapi.events.on("loggedIn", function (data) {
    firetable.actions.loggedIn(data);
  });

  /** User logged out */
  ftapi.events.on("loggedOut", firetable.actions.showLoginScreen);

  /** Firebase reconnected after a network drop */
  ftapi.events.on("authReconnected", function () {
    firetable.debug && console.log('reconnected');
    $('body').removeClass('disconnected');
    $('#newchat').prop('disabled', false).focus();
  });

  /** Firebase connection lost */
  ftapi.events.on("authDisconnected", function () {
    firetable.debug && console.log('disconnected');
    $('body').addClass('disconnected');
    $('#newchat').prop('disabled', true).blur();
  });

  /** Current user was banned */
  ftapi.events.on("userBanned", function () {
    firetable.debug && console.log("ban detected.");
    if (document.getElementById("notice") == null) {
      var usrname2use = ftapi.uid;
      if (ftapi.users[ftapi.uid] && ftapi.users[ftapi.uid].username) {
        usrname2use = ftapi.users[ftapi.uid].username;
      }
      $('.notice').attr('id', 'notice');
      $("#troublemaker").text(usrname2use);
    }
  });

  /** Current user was un-banned */
  ftapi.events.on("userUnbanned", function () {
    window.location.reload();
  });

  // ── UI Init (wires everything up) ──
  firetable.ui.init();
};

// ─── Auto-start ──────────────────────────────────────────────────────────────
if (!firetable.started) firetable.init();
