var firetable = {
  started: false,
  loggedIn: false,
  uid: null,
  uname: null,
  avatarset: "set1",
  pvCount: 0,
  playdex: 0,
  users: {},
  queue: false,
  preview: false,
  movePvBar: null,
  moveBar: null,
  song: null,
  playBadoop: true,
  idle: false,
  idleChanged: null,
  sbhowImages: false,
  screenControl: "sync",
  lights: false,
  screenSyncPos: false,
  scSeek: false,
  desktopNotifyMentions: false,
  orange: "#F4810B",
  color: "#F4810B",
  countcolor: "#fff",
  ytLoaded: null,
  scLoaded: null,
  listShowing: null,
  parser: null,
  songToEdit: null,
  scwidget: null,
  searchSelectsChoice: 1,
  importSelectsChoice: 1,
  dtImportName: null,
  dtImportList: [],
  lastChatPerson: false,
  lastChatId: false,
  tagUpdate: null,
  nonpmsg: true,
  playlimit: 2,
  scImg: "",
  superCopBanUpdates: null,
  loginForm: null,
  emojiMap: null,
  pickerInit: false,
  atLand: false,
  atUsers: [],
  atUsersFiltered: [],
  atString: "",
  debug: false
}

if (typeof ftconfigs == "undefined") throw "config.js is missing! Copy config.js.example and rename to config.js. Edit this file and add your own app's information.";

var chatScroll = new SimpleBar(document.getElementById('chatsWrap'));
chatScroll.getScrollElement().addEventListener('scroll', function() {
  if (firetable.utilities.isChatPrettyMuchAtBottom()) $('#morechats').removeClass('show');
});

firetable.version = "01.09.05";

var player, $playlistItemTemplate;

var idlejs = new IdleJs({
  idle: 5 * 60000,
  events: ['mousemove', 'keydown', 'mousedown', 'touchstart'],
  onIdle: function() {
    ftapi.actions.changeIdleStatus(true, 1);
  },
  onActive: function() {
    ftapi.actions.changeIdleStatus(false, 1);
  },
  onHide: function() {
    ftapi.actions.changeIdleStatus(true, 1);
    firetable.debug && console.log("hide");
  },
  onShow: function() {
    ftapi.actions.changeIdleStatus(false, 1);
  },
  keepTracking: true,
  startAtIdle: false
});
idlejs.start();

function onYouTubeIframeAPIReady() {
  player = new YT.Player('playerArea', {
    width: $('#djStage').outerHeight() * 1.7777,
    height: $('#djStage').outerHeight(),
    playerVars: {
      'autoplay': 1,
      'controls': 0
    },
    videoId: '0',
    events: {
      onReady: initialize,
      onStateChange: function() {
        $('#reloadtrack').removeClass('on working');
      }
    }
  });
}

function initialize(event) {
  firetable.ytLoaded = true;
  var vol = localStorage["firetableVol"];
  if (typeof vol == "undefined") {
    vol = 80;
    localStorage["firetableVol"] = 80;
  }
  player.setVolume(vol);

  var muted = localStorage["firetableMute"];
  if (typeof muted == "undefined") {
    localStorage["firetableMute"] = false;
    muted = "false";
    $("#volstatus").removeClass('on');
  }

  if (muted != "false") {
    var icon = "&#xE04E;";
    $("#volstatus i").html(icon);
    $("#volstatus").addClass('on');
  }

  $("#slider").slider({
    orientation: "horizontal",
    range: "min",
    min: 0,
    max: 100,
    value: vol,
    step: 5,
    slide: function(event, ui) {
      player.setVolume(ui.value);
      firetable.scwidget.setVolume(ui.value);
      localStorage["firetableVol"] = ui.value;
      var muted = localStorage["firetableMute"];
      if (muted != "false") {
        localStorage["firetableMute"] = false;
        var icon = "&#xE050;";
        $("#volstatus i").html(icon);
        $("#volstatus").removeClass('on');
      } else if (ui.value == 0) {
        firetable.actions.muteToggle(true);
        $("#volstatus").addClass('on');
      }
    }
  });
  if (firetable.song) {
    var data = firetable.song;
    var nownow = Date.now();
    var timeSince = nownow - data.started;
    if (timeSince <= 0) timeSince = 0;

    var secSince = Math.floor(timeSince / 1000);
    var timeLeft = data.duration - secSince;
    if (data.type == 1) {
      if (!firetable.preview) {
        if (!firetable.disableMediaPlayback) player.loadVideoById(data.cid, secSince, "large")
      }
    }
  }


}

function onPlayerStateChange(event) {
  //state changed thanks
}

firetable.init = function() {
  console.log(`
 (                           )             )   (
 )\\ )   (    (       (    ( /(      )   ( /(   )\\     (
(()/(   )\\   )(     ))\\   )\\())  ( /(   )\\()) (_))   ))\\
 /(_)) ((_) (()\\   /((_) (_))/   )(_)) ((_)\\  | |   /((_)
(_) _|  (_)  ((_) (_))   | |_   ((_)_  | |(_) | |  (_))
 |  _|  | | | '_| / -_)  |  _|  / _' | | '_ \\ | |  / -_)
 |_|    |_| |_|   \\___|   \\__|  \\__,_| |_.__/ |_|  \\___|
`);
  firetable.started = true;

  $("#idtitle").text(ftconfigs.roomName);
  $("#welcomeName").text(ftconfigs.roomName);

if (ftconfigs.avatarset) firetable.avatarset = ftconfigs.avatarset;

if (ftconfigs.facebookURL){
  $(".sociallogo.facebook").attr("href", ftconfigs.facebookURL);
  $(".sociallogo.facebook").css("display", "inline-block");
}

if (ftconfigs.redditURL){
  $(".sociallogo.reddit").attr("href", ftconfigs.redditURL);
  $(".sociallogo.reddit").css("display", "inline-block");
}

if (ftconfigs.lastfmURL){
  $(".sociallogo.lastfm").attr("href", ftconfigs.lastfmURL);
  $(".sociallogo.lastfm").css("display", "inline-block");
}

if (ftconfigs.discordURL){
  $(".sociallogo.discord").attr("href", ftconfigs.discordURL);
  $(".sociallogo.discord").css("display", "inline-block");
}

if (ftconfigs.soundcloudURL){
  $(".sociallogo.soundcloud").attr("href", ftconfigs.soundcloudURL);
  $(".sociallogo.soundcloud").css("display", "inline-block");
}

  if (ftconfigs.logoImage) $("#roomlogo").css("background-image", "url("+ftconfigs.logoImage+")")
  document.title = ftconfigs.roomName + " | firetable";
  if (ftconfigs.roomInfoUrl.length) $("#roomInfo").attr("href", ftconfigs.roomInfoUrl);
  $("#version").text("You're running firetable v" + firetable.version + ".");
  firetable.utilities.getEmojiMap();
  firetable.parser = new DOMParser();
  $(window).resize(firetable.utilities.debounce(function() {
    // This will execute whenever the window is resized
    $("#thehistory").css('top', $('#stage').outerHeight() + $('#topbar').outerHeight());
    $('#playerArea,#scScreen').width($('#djStage').outerWidth()).height($('#djStage').outerHeight());
    $("#stealContain").css({
      'top': $('#grab').offset().top + $('#grab').height(),
      'left': $('#grab').offset().left - 16
    });
    setup();
  }, 500));
  firetable.utilities.scrollToBottom();
  var widgetIframe = document.getElementById('sc-widget');
  firetable.scwidget = SC.Widget(widgetIframe);
  firetable.scwidget.bind(SC.Widget.Events.READY, function() {
    firetable.scwidget.bind(SC.Widget.Events.PLAY, function() {
      var vol = localStorage["firetableVol"];
      if (!vol) {
        vol = 80;
        localStorage["firetableVol"] = 80;
      }
      firetable.scwidget.setVolume(vol);
      if (firetable.scSeek) firetable.scwidget.seekTo(firetable.scSeek);
    });
    if (firetable.song) {
      var data = firetable.song;
      var nownow = Date.now();
      var timeSince = nownow - data.started;
      if (timeSince <= 0) timeSince = 0;

      var secSince = Math.floor(timeSince / 1000);
      var timeLeft = data.duration - secSince;
      if (data.type == 2) {
        if (!firetable.preview) {
          firetable.scSeek = timeSince;
          if (!firetable.disableMediaPlayback) firetable.scwidget.load("http://api.soundcloud.com/tracks/" + data.cid, {
            auto_play: true
          });
        }
      }
    }
    firetable.scLoaded = true;
  });

  $playlistItemTemplate = $('#mainqueue .pvbar').remove();
  $tagEditorTemplate = $('.tagPromptBox').remove();

  ftapi.init(ftconfigs.firebase);

  SC.initialize({
    client_id: ftconfigs.soundcloudKey
  });

  ftapi.events.on("loggedIn", function(data) {
    firetable.actions.loggedIn(data);
  });

  ftapi.events.on("loggedOut", firetable.actions.showLoginScreen);

  ftapi.events.on("authReconnected", function() {
    firetable.debug && console.log('reconnected');
    $('body').removeClass('disconnected');
    $('#newchat').prop('disabled', false).focus();
  });

  ftapi.events.on("authDisconnected", function() {
    firetable.debug && console.log('disconnected');
    $('body').addClass('disconnected');
    $('#newchat').prop('disabled', true).blur();
  });

  ftapi.events.on("userBanned", function() {
    firetable.debug && console.log("ban detected.");
    if (document.getElementById("notice") == null) {
      var usrname2use = ftapi.uid;
      if (ftapi.users[ftapi.uid]) {
        if (ftapi.users[ftapi.uid].username) usrname2use = ftapi.users[ftapi.uid].username;
      }
      $('.notice').attr('id', 'notice');
      $("#troublemaker").text(usrname2use);
    }
  });

  ftapi.events.on("userUnbanned", function() {
    window.location.reload();
  });

  firetable.ui.init();
};

firetable.actions = {
  dubtrackImport: function() {
    $("#importDubResults").html("importing (0/" + firetable.dtImportList.length + ")...");
    $("#dubimportButton").hide();
    var listid = ftapi.actions.createList(firetable.dtImportName);
    var name = firetable.dtImportName;

    $("#listpicker").append("<option id=\"pdopt" + listid + "\" value=\"" + listid + "\">" + name + "</option>");
    var trackarray = firetable.dtImportList;
    for (var e = 0; e < trackarray.length; e++) {
      var thetype = 1;
      if (trackarray[e].type == "soundcloud") thetype = 2;
      var numbo = e + 1;
      $("#importDubResults").html("importing (" + numbo + "/" + firetable.dtImportList.length + ")...");
      if (numbo == firetable.dtImportList.length) $("#importDubResults").html("Import complete! You can now select another file if you'd like to do another!");
      ftapi.actions.addToList(thetype, trackarray[e].name, trackarray[e].cid, listid);

    }
  },
  localChatResponse: function(txt) {
    if (txt.length) {
      $("#chats").append("<div class=\"newChat\"><div class=\"lcrsp\">" + txt + "</div></div>");
      firetable.utilities.scrollToBottom();
    }
  },
  logOut: function() {
    ftapi.actions.logOut();
    firetable.debug && console.log("logout");
  },
  showLoginScreen: function() {
    $("#cardCaseButton").hide();
    $("#loggedInName").hide();
    $("#logOutButton").hide().off();
    $('#mainGrid').removeClass().addClass('login');
    $("#grab").css("display", "none");
    if (firetable.loginForm && !$("#login").html()) {
      $("#mainGrid").append("<div id=\"login\" data-simplebar>" + firetable.loginForm + "</div>");

      firetable.ui.loginEventsInit();
    }
  },
  logIn: function(email, password) {
    firetable.debug && console.log("login");
    ftapi.actions.logIn(email, password, function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      if (errorCode === 'auth/wrong-password') {
        alert('Wrong password.');
      } else {
        alert(errorMessage);
      }
      firetable.debug && console.log("log in error:", error);
    });
  },
  loggedIn: function(user) {
    firetable.debug && console.log("user signed in!");
    if ($("#login").html()) {
      firetable.loginForm = $("#login").html();
      firetable.ui.loginEventsDestroy();
      $("#login").remove();
    }

    if (ftapi.users[ftapi.uid]) {
      if (ftapi.users[ftapi.uid].username) {
        $("#loggedInName").text(ftapi.users[ftapi.uid].username);
      } else {
        $("#loggedInName").text(user.uid);
      }
    } else {
      $("#loggedInName").text(user.uid);
    }

    ftapi.lookup.allLists(function(allPlaylists) {
      $("#listpicker").off("change");
      $("#listpicker").html("<option value=\"1\">Add/Delete Playlist</option><option value=\"0\">Default Queue</option>");
      for (var key in allPlaylists) {
        if (allPlaylists.hasOwnProperty(key)) {
          $("#listpicker").append("<option id=\"pdopt" + key + "\" value=\"" + key + "\">" + allPlaylists[key].name + "</option>");
        }
      }
      ftapi.lookup.selectedList(function(selectedList) {
        $("#listpicker").val(selectedList).change();
        $("#listpicker").change(function() {
          var val = $("#listpicker").val();
          if (val == "1") {
            //ADD PLAYLIST SCREEN
            $("#mainqueuestuff").css("display", "none");
            $("#filterMachine").css("display", "none");
            $("#addbox").css("display", "none");
            $("#cancelqsearch").hide();
            $("#qControlButtons").hide();

            $("#plmanager").css("display", "flex");

          } else if (val != ftapi.selectedListThing) {
            //LOAD SELECTED LIST
            //change selected list in user obj
            $("#mainqueuestuff").css("display", "block");
            $("#filterMachine").css("display", "block");
            $("#addbox").css("display", "none");
            $("#cancelqsearch").hide();
            $("#qControlButtons").show();

            $("#plmanager").css("display", "none");
            ftapi.actions.switchList(val);
          } else {
            //you selected the thing you already had selected.
            $("#mainqueuestuff").css("display", "block");
            $("#filterMachine").css("display", "block");
            $("#addbox").css("display", "none");
            $("#cancelqsearch").hide();
            $("#qControlButtons").show();
            $("#plmanager").css("display", "none");
          }
        });

      });
    });
    $("#cardCaseButton").show();
    $("#loggedInName").show();
    $("#logOutButton").show().on('click', firetable.actions.logOut);
    firetable.debug && console.log('remove login class from mainGrid');
    $('#mainGrid').removeClass().addClass('mmusrs');
    $("#grab").css("display", "inline-block");
  },
  cardCase: function() {
    $("#cardsMain").html("");
    ftapi.lookup.cardCollection(function(data) {
      for (var key in data) {
        var childData = data[key];
        firetable.debug && console.log('card:', childData);
        $("#cardsMain").append("<span id=\"caseCardSpot" + key + "\" class=\"caseCardSpot\"><canvas width=\"225\" height=\"300\" class=\"caseCard\" id=\"cardMaker" + key + "\"></canvas><span role=\"button\" onclick=\"firetable.actions.giftCard('" + key + "')\" class=\"cardGiftChat\">Gift to DJ</span><span role=\"button\" onclick=\"firetable.actions.chatCard('" + key + "')\" class=\"cardShareChat\">Share In Chat</span></span>");
        firetable.actions.displayCard(childData, key);
      }
    });
  },
  chatCard: function(cardid) {
    ftapi.actions.sendChat("Check out my card...", cardid);
  },
  giftCard: function(cardid) {
    ftapi.actions.sendChat("!giftcard :gift:", cardid);
    $("#caseCardSpot" + cardid).remove();
  },
  displayCard: function(data, chatid) {
    firetable.debug && console.log("display card");
    var defaultScheme = false;
    if (data.colors) {
      if (data.colors.color == "#fff" || data.colors.color == "#7f7f7f") {
        data.colors.color = firetable.orange;
        data.colors.txt = "#000";
        defaultScheme = true;
      }
    }

    if (data.image == "img/idlogo.png" && ftconfigs.defaultAlbumArtUrl.length) data.image = ftconfigs.defaultAlbumArtUrl;
    var set = "set1";
    if (data.set) set = data.avatarset;

    var canvas = document.getElementById('cardMaker' + chatid);

    if (canvas.getContext) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 225, 300);

      ctx.fillStyle = data.colors.color;
      if (defaultScheme) ctx.fillStyle = "#fff";
      ctx.fillRect(1, 30, 223, 175);

      var grd = ctx.createLinearGradient(0, 0, 0, 175);
      grd.addColorStop(0, "rgba(0, 0, 0, 0.75)");
      grd.addColorStop(1, "rgba(0, 0, 0, 0.55)");

      // Fill with gradient
      ctx.fillStyle = grd;
      ctx.fillRect(1, 30, 223, 175);

      ctx.fillStyle = data.colors.color;
      ctx.fillRect(1, 205, 223, 10);

      ctx.fillStyle = "#333333";
      //ctx.fillRect(1, 205, 223, 1);
      // ctx.fillRect(1, 215, 223, 1);

      ctx.fillStyle = "#151515";
      ctx.fillRect(1, 216, 223, 75);

      //text go
      ctx.fillStyle = "#eee";
      ctx.font = "700 11px Helvetica, Arial, sans-serif";
      ctx.fillText(data.djname, 10, 20);


      ctx.font = "400 8px Helvetica, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Printed " + firetable.utilities.format_date(data.date) + " | " + ftconfigs.roomNameShort, 112.5, 299);

      ctx.font = "700 10px Helvetica, Arial, sans-serif";
      ctx.textAlign = "left";
      var linez = firetable.utilities.wrapText(ctx, data.title, 66, 240, 160, 15);
      firetable.debug && console.log('linez:', linez);
      ctx.font = "400 8px Helvetica, Arial, sans-serif";
      ctx.textAlign = "left";
      firetable.utilities.wrapText(ctx, data.artist, 66, 253 + (15 * linez), 160, 15);

      ctx.fillStyle = data.colors.txt;
      ctx.font = "400 9px Helvetica, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Card No. " + data.cardnum + " | DJ Card | Max Operating Temp " + data.temp + "°", 112.5, 214);
      ctx.beginPath();
      ctx.arc(205, 15, 12, 0, 2 * Math.PI, false);
      ctx.fillStyle = data.colors.color;
      ctx.fill();

      ctx.fillStyle = data.colors.txt;
      ctx.font = "700 15px Helvetica, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(data.num, 200.5, 20);

      var doImages = function() {
        var picboy = new Image;
        picboy.xvalue = 0;
        picboy.onload = function() {
          ctx.drawImage(this, 20, 30, 175, 175);
          var picboy2 = new Image;
          picboy2.xvalue = 0;
          picboy2.onload = function() {
            var heighta = 50;
            if (data.image.match(/ytimg.com/g)) heighta = 28;
            ctx.drawImage(this, 10, 230, 50, heighta);
            ctx = null;
          };
          picboy2.src = data.image;
        };
        picboy.src = 'https://indiediscotheque.com/robots/' + data.djid + data.djname + '.png?size=175x175&set='+set;


      };

      // special styles

      if (data.special) {
        if (data.special == "id8") {
          ctx.fillStyle = data.colors.color;
          ctx.fillRect(1, 30, 223, 10);

          ctx.fillStyle = "#333333";
          // ctx.fillRect(1, 29, 223, 1);
          // ctx.fillRect(1, 40, 223, 1);

          ctx.fillStyle = data.colors.txt;
          ctx.font = "400 10px Helvetica, Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Celebrating 8 Years of Indie Discotheque", 112.5, 38);

          var cake = new Image;
          cake.xvalue = 0;
          cake.onload = function() {
            ctx.drawImage(this, 10, 50, 35, 35);
            var eight = new Image;
            eight.xvalue = 0;
            eight.onload = function() {
              ctx.drawImage(this, 180, 50, 35, 35);
              doImages();
            };
            eight.src = 'img/8.png';
          };
          cake.src = 'img/cake.png';

        } else if (data.special == "id9") {
          ctx.fillStyle = data.colors.color;
          ctx.fillRect(1, 30, 223, 10);

          ctx.fillStyle = "#333333";
          // ctx.fillRect(1, 29, 223, 1);
          // ctx.fillRect(1, 40, 223, 1);

          ctx.fillStyle = data.colors.txt;
          ctx.font = "400 10px Helvetica, Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Celebrating 9 Years of Indie Discotheque", 112.5, 38);

          var cake = new Image;
          cake.xvalue = 0;
          cake.onload = function() {
            ctx.drawImage(this, 5, 50, 45, 45);
            var eight = new Image;
            eight.xvalue = 0;
            eight.onload = function() {
              ctx.save();
              ctx.translate(75 * 0.5, 75 * 0.5);
              ctx.rotate(0.959931);
              ctx.translate(-75 * 0.5, -75 * 0.5);

              ctx.drawImage(this, 125, -81, 75, 75);
              ctx.restore();
              var picboy = new Image;
              picboy.xvalue = 0;
              picboy.onload = function() {
                ctx.drawImage(this, 25, 40, 170, 170);
                var picboy2 = new Image;
                picboy2.xvalue = 0;
                picboy2.onload = function() {
                  var heighta = 50;
                  if (data.image.match(/ytimg.com/g)) heighta = 28;
                  ctx.drawImage(this, 10, 230, 50, heighta);
                  ctx = null;
                };
                picboy2.src = data.image;
              };
              picboy.src = 'img/id9.png';
            };
            eight.src = 'https://indiediscotheque.com/robots/' + data.djid + data.djname + '.png?size=110x110&set='+set;
          };
          cake.src = 'img/arnold.png';
        }
      } else {
        doImages();
      }
    }
  },
  showCard: function(cardid, chatid) {
    // let's SHOW A CARD
    ftapi.lookup.card(cardid, function(data) {
      firetable.actions.displayCard(data, chatid);
    });
  },
  filterQueue: function(val) {
    if (val.length == 0) {
      $("#mainqueue .pvbar").show();
      return
    } else {

    }
    val = val.toLowerCase();
    $("#mainqueue .pvbar").each(function(p, q) {
      var txt = $(q).find(".listwords").text();
      var regex = new RegExp(val, 'ig');
      if (txt.match(regex)) {
        $(q).show()
      } else {
        $(q).hide()
      }
    });
  },
  muteToggle: function(zeroMute) {

    var muted = localStorage["firetableMute"];
    var icon = "&#xE050;";
    firetable.debug && console.log('muted:', muted);
    if (zeroMute) {
      icon = "&#xE04E;";
      muted = 0;

    } else if (typeof muted !== 'undefined') {
      if (muted != "false") {

        if (muted == 0) {
          $("#slider").slider("value", 80);
          player.setVolume(80);
          firetable.scwidget.setVolume(80);
          localStorage["firetableVol"] = 80;
        } else {
          muted = parseInt(muted);
          $("#slider").slider("value", muted);
          player.setVolume(muted);
          firetable.scwidget.setVolume(muted);
          localStorage["firetableVol"] = muted;
        }
        muted = false;
      } else {
        icon = "&#xE04E;";

        muted = $("#slider").slider("value");
        $("#slider").slider('value', 0);
        player.setVolume(0);
        firetable.scwidget.setVolume(0);
        localStorage["firetableVol"] = 0;

      }
    } else {
      icon = "&#xE04E;";

      muted = $("#slider").slider("value");
      $("#slider").slider('value', 0);
      player.setVolume(0);
      firetable.scwidget.setVolume(0);
      localStorage["firetableVol"] = 0;
    }

    if (muted) $("#volstatus").addClass('on');
    else $("#volstatus").removeClass('on');
    $("#volstatus i").html(icon);
    localStorage["firetableMute"] = muted;
  },
  pview: function(id, fromSearch, type, fromHist) {
    if (firetable.preview == id) {
      //already previewing this. stop and resume regular song
      clearTimeout(firetable.ptimeout);
      firetable.ptimeout = null;
      $("#pv" + firetable.preview).html("&#xE037;");
      $("#pvbar" + firetable.preview).css("background-image", "none");
      clearInterval(firetable.movePvBar);
      firetable.movePvBar = null;
      firetable.preview = false;
      //start regular song
      var nownow = Date.now();
      var timeSince = nownow - firetable.song.started;
      if (timeSince <= 0) timeSince = 0;

      var secSince = Math.floor(timeSince / 1000);
      var timeLeft = firetable.song.duration - secSince;
      if (firetable.song.type == 1) {
        if (!firetable.preview) {
          if (firetable.scLoaded) firetable.scwidget.pause();
          if (!firetable.disableMediaPlayback) player.loadVideoById(firetable.song.cid, secSince, "large");
        }
      } else if (firetable.song.type == 2) {
        if (!firetable.preview) {
          if (firetable.ytLoaded) player.stopVideo();
          firetable.scSeek = timeSince;
          if (!firetable.disableMediaPlayback) firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
            auto_play: true
          });
        }
      }
    } else {
      if (firetable.preview) {
        $("#pv" + firetable.preview).html("&#xE037;");
        $("#pvbar" + firetable.preview).css("background-image", "none");
      }

      firetable.preview = id;
      if (fromSearch) {
        var cid = id.slice(5);
      } else {
        var cid = firetable.queue[id].cid;
      }

      if (firetable.ptimeout != null) {
        clearTimeout(firetable.ptimeout);
        firetable.ptimeout = null;
      }
      if (firetable.movePvBar != null) {
        clearInterval(firetable.movePvBar);
        firetable.movePvBar = null;
      }
      firetable.pvCount = 0;
      firetable.ptimeout = setTimeout(function() {
        firetable.ptimeout = null;
        $("#pv" + firetable.preview).html("&#xE037;");
        $("#pvbar" + firetable.preview).css("background-image", "none");
        clearInterval(firetable.movePvBar);
        firetable.movePvBar = null;
        firetable.pvCount = 0;
        firetable.preview = false;

        //start regular song
        var nownow = Date.now();
        var timeSince = nownow - firetable.song.started;
        if (timeSince <= 0) timeSince = 0;

        var secSince = Math.floor(timeSince / 1000);
        var timeLeft = firetable.song.duration - secSince;
        if (firetable.song.type == 1) {
          if (!firetable.preview) {
            if (firetable.scLoaded) firetable.scwidget.pause();
            if (!firetable.disableMediaPlayback) player.loadVideoById(firetable.song.cid, secSince, "large");
          }
        } else if (firetable.song.type == 2) {
          if (!firetable.preview) {
            if (firetable.ytLoaded) player.stopVideo();
            firetable.scSeek = timeSince;
            if (!firetable.disableMediaPlayback) firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
              auto_play: true
            });
          }
        }
      }, 30 * 1000);
      $("#pv" + id).html("&#xE034;");
      firetable.movePvBar = setInterval(function() {
        var pcnt = (firetable.pvCount / 29) * 100;
        firetable.pvCount += 0.2;
        var pvcolr = "#222";
        if (fromHist) pvcolr = "#222";
        $("#pvbar" + firetable.preview).css("background-image", "linear-gradient(90deg, rgba(244, 129, 11, 0.267) " + pcnt + "%, " + pvcolr + " " + pcnt + "%)");
      }, 200);
      if (type == 1) {
        if (firetable.scLoaded) firetable.scwidget.pause();
        if (!firetable.disableMediaPlayback) player.loadVideoById(cid, 0, "large")
      } else if (type == 2) {
        if (firetable.ytLoaded) player.stopVideo();
        firetable.scSeek = 0;
        if (!firetable.disableMediaPlayback) firetable.scwidget.load("http://api.soundcloud.com/tracks/" + cid, {
          auto_play: true
        });
      }


    }

  },
  mergeLists: function(source, dest, sourceName) {
    if (source == dest) {
      //source and dest are the same, let's remove the duplicates
      firetable.actions.removeDupesFromQueue();
      return;
    }
    if (dest == -1) {
      // create new list if needed
      var newname = firetable.utilities.format_date(Date.now()) + " Copy of " + sourceName;
      var dest = ftapi.actions.createList(newname);
      $("#listpicker").append("<option id=\"pdopt" + dest + "\" value=\"" + dest + "\">" + newname + "</option>");
    }
    ftapi.actions.mergeLists(source, dest, function() {
      $("#mergeCompleted").show();
      $("#mergeHappening").hide();
    });
  },
  queueFromLink: function(link) {
    if (link.match(/youtube.com\/watch/)) {
      //youtube
      firetable.debug && console.log("yt");

      function getQueryStringValue(str, key) {
        return unescape(str.replace(new RegExp("^(?:.*[&\\?]" + escape(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
      }
      var therealid = getQueryStringValue(link, "v");
      if (therealid) {
        function keyWordsearch() {
          gapi.client.setApiKey(ftconfigs.youtubeKey);
          gapi.client.load('youtube', 'v3', function() {
            makeRequest();
          });
        }

        function makeRequest() {
          var request = gapi.client.youtube.videos.list({
            id: therealid,
            part: 'snippet',
            maxResults: 1
          });
          request.execute(function(response) {
            firetable.debug && console.log('queue from link:', response);
            if (response.result) {
              if (response.result.items) {
                if (response.result.items.length) {
                  var goodtitle = response.result.items[0].snippet.title;
                  var yargo = response.result.items[0].snippet.title.split(" - ");
                  var sartist = yargo[0];
                  var stitle = yargo[1];
                  if (!stitle) {
                    // yt title not formatted artist - title. use uploader name instead as artist
                    stitle = sartist;
                    sartist = response.result.items[0].snippet.channelTitle.replace(" - Topic", "");
                  }
                  goodtitle = sartist + " - " + stitle;
                  firetable.actions.queueTrack(response.result.items[0].id, goodtitle, 1);
                }
              }
            }
          })
        }
        keyWordsearch();
      }
    } else if (link.match(/soundcloud.com/)) {
      //soundcloud
      firetable.debug && console.log("sc");
      var getComments = function(track) {
        return SC.get("tracks/" + track.id);
      };

      firetable.actions.resolveSCLink(link, function(tracks) {
        if (tracks) {
          var yargo = tracks.title.split(" - ");
          var sartist = yargo[0];
          var stitle = yargo[1];
          if (!stitle) {
            stitle = sartist;
            sartist = tracks.user.username;
          }
          var goodTitle = sartist + " - " + stitle;
          firetable.actions.queueTrack(tracks.id, goodTitle, 2);
        }
      });
      //SC.resolve(link).then(getComments).then(listComments);

    }
  },
  resolveSCLink: function(link, callback) {
    var importantStuff = link.replace("https://soundcloud.com/", "");
    importantStuff = importantStuff.replace("http://soundcloud.com/", "");
    $.ajax({
      url: "https://thompsn.com/resolvesc/?q=" + importantStuff,
      type: 'GET',
      dataType: 'json',
      success: function(res) {
        console.log(res);
        callback(res.response);
      }
    });
  },
  scGet: function(type, q, callback) {
    $.ajax({
      url: "https://thompsn.com/soundcloud/?type=" + type + "&q=" + q,
      type: 'GET',
      dataType: 'json',
      success: function(res) {
        console.log(res);
        callback(res.response);
      }
    });
  },
  updateQueue: function() {
    //this fires when someone drags a song to a new spot in the queue
    var arr = $('#mainqueue > div').map(function() {
      var theid = this.id;
      var idraw = theid.slice(5);
      return idraw;
    }).get();
    ftapi.actions.reorderList(arr, firetable.preview, function(changePV) {
      if (changePV) firetable.preview = changePV;
    });
  },
  shuffleQueue: function() {
    ftapi.actions.shuffleList(firetable.preview, function(changePV) {
      if (changePV) firetable.preview = changePV;
    });
  },
  removeDupesFromQueue: function() {
    ftapi.actions.removeDuplicatesFromList();
    $("#mergeCompleted").show();
    $("#mergeHappening").hide();
  },
  editTagsPrompt: function(songid) {
    var song = firetable.queue[songid];
    var $pvbar = $('#mainqueue .pvbar[data-key="' + songid + '"]');
    $('#mainqueue .pvbar.editing').removeClass('editing');
    $('.tagPromptBox').remove();
    $pvbar.addClass('editing');
    var $tags = $tagEditorTemplate.clone().appendTo($pvbar);
    $tags.find(".tagMachine").val(song.name);
    if (song.type == 1) {
      $tags.find(".tagSongLink").attr("href", "https://youtube.com/watch?v=" + song.cid);
    } else if (song.type == 2) {
      firetable.actions.scGet('tracks', song.cid, function(tracks) {
        if (tracks.permalink_url) {
          $tags.find(".tagSongLink").attr("href", tracks.permalink_url);
        } else {
          $tags.find(".tagSongLink").attr("href", "http://howtojointheindiediscothequewaitlist.com/ThisSongIsBroken?thanks=true");
        }
      });
    }

    firetable.debug && console.log('edit tags song id:', songid);
    firetable.songToEdit = {
      song: song,
      key: songid
    };
  },
  importList(id, name, type) {
    //time to IMPORT SOME LISTS!
    $("#overlay").removeClass('show');
    $("#importResults").html("");
    $("#plMachine").val("");
    if (type == 1) {
      //youtube
      var finalList = [];

      function keyWordsearch(pg) {
        gapi.client.setApiKey(ftconfigs.youtubeKey);
        gapi.client.load('youtube', 'v3', function() {
          makeRequest(pg);
        });
      }

      function makeRequest(pg) {
        if (pg) {
          var request = gapi.client.youtube.playlistItems.list({
            playlistId: id,
            maxResults: 50,
            part: "snippet",
            pageToken: pg
          });
        } else {
          var request = gapi.client.youtube.playlistItems.list({
            playlistId: id,
            maxResults: 50,
            part: "snippet"
          });
        }
        request.execute(function(response) {
          if (response.items.length) {
            for (var idx = 0; idx < response.items.length; idx++) {
              finalList.push(response.items[idx]);
            }
          }
          if (response.nextPageToken) {
            if (response.nextPageToken != "") keyWordsearch(response.nextPageToken);
          } else {
            firetable.debug && console.log(finalList);
            var listid = ftapi.actions.createList(name);
            $("#listpicker").append("<option id=\"pdopt" + listid + "\" value=\"" + listid + "\">" + name + "</option>");
            for (var i = 0; i < finalList.length; i++) {
              var goodTitle = finalList[i].snippet.title;
              // can't use youtube uploader name to fix tags here because YOUTUBE DECIDED NOT TO INCLUDE THAT INFORMATION >:o
              if (goodTitle !== "Private video" && goodTitle !== "Deleted video") {
                ftapi.actions.addToList(1, goodTitle, finalList[i].snippet.resourceId.videoId, listid);
              }
            }
          }
        })
      }
      keyWordsearch();

    } else if (type == 2) {
      firetable.actions.scGet('playlists', id, function(listinfo) {
        firetable.debug && console.log('sc tracks:', listinfo.tracks);
        var listid = ftapi.actions.createList(name);
        $("#listpicker").append("<option id=\"pdopt" + listid + "\" value=\"" + listid + "\">" + name + "</option>");
        for (var i = 0; i < listinfo.tracks.length; i++) {
          if (listinfo.tracks[i].title) {
            var yargo = listinfo.tracks[i].title.split(" - ");
            var sartist = yargo[0];
            var stitle = yargo[1];
            if (!stitle) {
              stitle = sartist;
              sartist = listinfo.tracks[i].user.username;
            }
            var goodTitle = sartist + " - " + stitle;
          } else {
            var goodTitle = "Unknown";
          }

          ftapi.actions.addToList(2, goodTitle, listinfo.tracks[i].id, listid);
        }
      });
    }
  },
  bumpSongInQueue: function(songid) {
    ftapi.actions.moveTrackToTop(songid, firetable.preview, function(changePV) {
      if (changePV) firetable.preview = changePV;
    });
  },
  signUp: function(email, password, username) {
    firetable.debug && console.log("signup");
    ftapi.actions.signUp(email, password, username, function(error) {
      alert(error);
    });
  },
  deleteSong: function(id) {
    ftapi.actions.deleteTrack(id);
  },
  uidLookup: function(name) {
    var match = false;
    var usrs = ftapi.users;
    for (var key in usrs) {
      if (usrs.hasOwnProperty(key)) {
        if (ftapi.users[key].username) {
          if (ftapi.users[key].username == name) {
            match = key;
          }
        }
      }
    }
    if (!match && ftapi.users[name]) match = name;
    return match;
  },
  grab: function() {
    if (firetable.song.cid != 0) {
      var title = firetable.song.artist + " - " + firetable.song.title;
      firetable.actions.queueTrack(firetable.song.cid, title, firetable.song.type, true);
    }
  },
  unban: function(userid) {
    ftapi.actions.unbanUser(userid);
  },
  reloadtrack: function() {
    $('#reloadtrack').addClass('on working');
    //start regular song
    var nownow = Date.now();
    var timeSince = nownow - firetable.song.started;
    if (timeSince <= 0) timeSince = 0;
    var secSince = Math.floor(timeSince / 1000);
    var timeLeft = firetable.song.duration - secSince;
    if (firetable.song.type == 1) {
      if (!firetable.preview) {
        if (firetable.scLoaded) firetable.scwidget.pause();
        if (!firetable.disableMediaPlayback) player.loadVideoById(firetable.song.cid, secSince, "large");
      }
    } else if (firetable.song.type == 2) {
      if (!firetable.preview) {
        if (firetable.ytLoaded) player.stopVideo();
        firetable.scSeek = timeSince;
        if (!firetable.disableMediaPlayback) firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
          auto_play: true
        }, function() {
          $('#reloadtrack').removeClass('on working');
        });
      }
    }
  },
  queueTrack: function(cid, name, type, tobottom) {
    var info = {
      type: type,
      name: name,
      cid: cid
    };
    $("#apv" + type + cid).find(".material-icons").text("check");
    $("#apv" + type + cid).css("color", firetable.orange);
    $("#apv" + type + cid).css("pointer-events", "none");
    setTimeout(function() {
      $("#apv" + type + cid).find(".material-icons").text("playlist_add");
      $("#apv" + type + cid).removeAttr("style");
    }, 3000);

    var cuteid = ftapi.actions.addToList(type, name, cid, false, function() {
      firetable.debug && console.log('queue track id:', cuteid);
      if (!tobottom) firetable.actions.bumpSongInQueue(cuteid);
    });

    if (firetable.preview) {
      if (firetable.preview.slice(0, 5) == "ytcid" || firetable.preview.slice(0, 5) == "sccid") {
        $("#pv" + firetable.preview).html("&#xE037;");
        clearTimeout(firetable.ptimeout);
        firetable.ptimeout = null;
        $("#pvbar" + firetable.preview).css("background-image", "none");
        clearInterval(firetable.movePvBar);
        firetable.movePvBar = null;
        firetable.preview = false;
        //start regular song
        var nownow = Date.now();
        var timeSince = nownow - firetable.song.started;
        if (timeSince <= 0) timeSince = 0;
        var secSince = Math.floor(timeSince / 1000);
        var timeLeft = firetable.song.duration - secSince;
        if (firetable.song.type == 1) {
          if (!firetable.preview) {
            if (firetable.scLoaded) firetable.scwidget.pause();
            if (!firetable.disableMediaPlayback) player.loadVideoById(firetable.song.cid, secSince, "large");
          }
        } else if (firetable.song.type == 2) {
          if (!firetable.preview) {
            if (firetable.ytLoaded) player.stopVideo();
            firetable.scSeek = timeSince;
            if (!firetable.disableMediaPlayback) firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
              auto_play: true
            });
          }
        }
      }
    }
    $("#mainqueuestuff").css("display", "block");
    $("#filterMachine").css("display", "block");
    $("#addbox").css("display", "none");
    $("#cancelqsearch").hide();
    $("#qControlButtons").show();
  }
};

firetable.emojis = {
  h: function() {
    $(".pickerResult").show();
    $("#pickerResults h3").show();
  },
  n: function(p, q) {
    var e = p.attr("data-alternative-name");
    return ($(p).text().toLowerCase().indexOf(q) >= 0) || (e != null && e.toLowerCase().indexOf(q) >= 0)
  },
  sec: function(sec) {
    firetable.debug && console.log('emoji sec:', sec);
    var selectedSec = $("#pickerNav > .on");
    var thething = sec.substr(1);
    console.log(thething);
    if (selectedSec.length) {
      firetable.debug && console.log("already selected sec");
      if (selectedSec[0].id == sec) {
        firetable.debug && console.log("toggle selected... back to FULL LIST");
        $("#" + selectedSec[0].id).removeClass("on");
        $("#pickerContents div").show();
      } else {
        //new sec selected
        $("#" + selectedSec[0].id).removeClass("on");
        $("#" + selectedSec[0].id.substr(1)).hide();
        $("#" + sec).addClass("on");
        $("#" + thething).show();
      }
    } else {
      firetable.debug && console.log("first select");
      $("#" + sec).addClass("on");
      $("#pickerContents div").hide();
      $("#" + thething).show();
    }
  },
  niceSearch: function(val) {
    if (val.length == 0) {
      firetable.emojis.h();
      return
    } else {
      var isvisible = $("#pickerResults h3").is(":visible");
      if (isvisible) $("#pickerResults h3").hide();
    }
    val = val.toLowerCase();
    $(".pickerResult").each(function(p, q) {
      if (firetable.emojis.n($(q), val)) {
        $(q).show()
      } else {
        $(q).hide()
      }
    });
    // simplebar scroll update?
  }
};

firetable.utilities = {
  getEmojiMap: function() {
    firetable.emojiMap = {};
    (async function() {
      urls = [
        "https://unpkg.com/unicode-emoji-json@0.3.0/data-by-group.json",
        "https://unpkg.com/emojilib@2.4.0/emojis.json",
        "https://unpkg.com/emojilib@3.0.4/dist/emoji-en-US.json"
      ];
      try {
        const requests = urls.map((url) => fetch(url));
        const responses = await Promise.all(requests);
        const promises = responses.map((response) => response.json());
        const data = await Promise.all(promises);
        let oldmojis = {};
        for (const [oldSlug, emojiObj] of Object.entries(data[1])) {
          oldmojis[emojiObj.char] = oldSlug;
        }
        for (const [category, emojisArr] of Object.entries(data[0])) {
          let catid = category.replace(/[\s&]+/g, '_').toLowerCase();
          $('#pickerNav').append('<span id="bpicker' + catid + '" title="' + category + '">' + emojisArr[0].emoji + '</span>');
          $('#pickerContents').append('<div id="picker' + catid + '"><h3>' + category + '</h3></div>');
          for (let i in emojisArr) {
            firetable.emojiMap[emojisArr[i].slug] = emojisArr[i].emoji;
            var words = "";
            words += (data[2][emojisArr[i].emoji] !== undefined) ? data[2][emojisArr[i].emoji].join(',') : "";
            words += (oldmojis[emojisArr[i].emoji] !== undefined) ? ','+oldmojis[emojisArr[i].emoji] : "";
            $("#picker" + catid).append('<span role="button" class="pickerResult" title="' + emojisArr[i].slug + '" data-alternative-name="' + words + '">' + emojisArr[i].emoji + '</span>');
          }
          for (let i in oldmojis) {
            firetable.emojiMap[oldmojis[i]] = i;
          }
        }
        twemoji.parse(document.getElementById("pickerNav"));
      } catch (err) {};
    })()
  },
  hexToRGB: function(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  wrapText: function(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    var lines = 0;

    for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
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
  emojiShortnamestoUnicode: function(str) {
    var res = str.replace(/\:(.*?)\:/g, function(x) {
      var response = x;
      var shortname = x.replace(/\:/g, "");
      if (firetable.emojiMap[shortname]) {
        response = "<span title=\"" + x + "\">" + firetable.emojiMap[shortname] + "</span>";
      } else if (shortname == "rohn") {
        response = "<span class=\"rohnmoji\" title=\":rohn:\"></span>";
      }
      return response;
    });
    return res;
  },
  playSound: function(filename) {
    if (firetable.playBadoop) {
      document.getElementById("audilert").setAttribute('src', filename + ".mp3");
    }
  },
  desktopNotify: function(chatData, namebo) {
    if (Notification) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      } else {
        var notification = new Notification(namebo, {
          icon: "https://indiediscotheque.com/robots/" + chatData.id + namebo + ".png?size=110x110&set="+firetable.avatarset,
          body: chatData.txt,
        });
      }
    }
  },
  screenUp: function() {
    $('body').removeClass('screen');
  },
  screenDown: function() {
    $('body').addClass('screen');
  },
  isChatPrettyMuchAtBottom: function() {
    var scrollable = chatScroll.contentEl.scrollHeight - chatScroll.el.clientHeight;
    var scrolled = chatScroll.contentWrapperEl.scrollTop;
    console.log('near bottom?', scrollable, scrolled);
    return (Math.abs(scrollable - scrolled) <= 25);
  },
  scrollToBottom: function() {
    chatScroll.contentWrapperEl.scrollTop = chatScroll.contentEl.scrollHeight;
  },
  htmlEscape: function(s, preserveCR) {
    preserveCR = preserveCR ? '&#13;' : '\n';
    return ('' + s) /* Forces the conversion to string. */
      .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
      .replace(/'/g, '\\&apos;') /* The 4 other predefined entities, required. */
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      /*
      You may add other replacements here for HTML only
      (but it's not necessary).
      Or for XML, only if the named entities are defined in its DTD.
      */
      .replace(/\r\n/g, preserveCR) /* Must be before the next replacement. */
      .replace(/[\r\n]/g, preserveCR);;
  },
  format_date: function(d) {

    var date = new Date(d);

    var month = date.getMonth() + 1;
    var day = date.getDate();
    var year = date.getFullYear();

    var formatted_date = month + "/" + day + "/" + year;
    return formatted_date;
  },
  format_time: function(d) {
    var date = new Date(d);

    var hours1 = date.getHours();
    var ampm = "am";
    var hours = hours1;
    if (hours1 >= 12) {
      ampm = "pm";
      if (hours !== 12) hours = hours1 - 12;
    }
    if (hours == 0) hours = 12;
    var minutes = date.getMinutes();
    var min = "";
    if (minutes > 9) {
      min += minutes;
    } else {
      min += "0" + minutes;
    }
    return hours + ":" + min + "" + ampm;
  },
  debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this,
        args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  },
  chatAt: function(element) {
    element.bind("click", function() {
      console.log(element);
      var nameToAt;
      if (element[0].className == "prson") {
        nameToAt = $(this).find(".prsnName").text();
      } else if (element[0].className == "botson") {
        nameToAt = $(this).next(".chatContent").find(".chatName").text();
      } else if (element[0].className == "chatName") {
        nameToAt = $(this).text();
      }
      $("#newchat").val(function(i, val) {
        return val + "@" + nameToAt + " ";
      }).focus();
    })
  },
  initAtLand: function() {
    firetable.atLand = true;
    firetable.atString = "";
    firetable.atUsers = ["everyone"];
    for (var user in ftapi.users) {
      firetable.atUsers.push(ftapi.users[user].username);
    }
    firetable.atUsersFiltered = firetable.atUsers.sort();
  },
  updateAtLand: function() {
    firetable.atUsersFiltered = firetable.atUsers.filter(user => user.toLowerCase().startsWith(firetable.atString.toLowerCase())).sort();
    $('#atPicker').html('');
    if (firetable.atUsersFiltered.length) {
      for (var user of firetable.atUsersFiltered) {
        $('<div class="atPickerThing"><button class="butt graybutt" role="button">@' + user + '</button></div>').appendTo('#atPicker');
      }
    } else {
      $('<div class="atPickerThing"><i>No users match</i></div>').appendTo('#atPicker');
    }
  },
  chooseAt: function(atPeep) {
    var $chatText = $('#newchat');
    if (firetable.atString.length > 0) $chatText.val($chatText.val().slice(0, firetable.atString.length * -1));
    $chatText.val($chatText.val() + atPeep + " ");
    firetable.utilities.exitAtLand();
  },
  exitAtLand: function() {
    firetable.atLand = false;
    firetable.atUsersFiltered = [];
    firetable.atString = "";
    $('#atPicker').removeClass('show').html('');
  }
};

firetable.ui = {
  textToLinks: function(text, themeBox) {
    var re = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    if (firetable.showImages && !themeBox) re = /(https?:\/\/(?![/|.|\w|\s|-]*(?:jpe?g|png|gif))[^" ]+)/g;
    return text.replace(re, "<a href=\"$1\" target=\"_blank\" tabindex=\"-1\">$1</a>");

    return text;
  },
  dubtrackImportFileSelect: function(evt) {
    var files = evt.target.files; // FileList object
    var file = files[0];
    // read the file contents
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function(event) {
      try {
        var allthestuff = event.currentTarget.result;
        console.log(allthestuff);
        firetable.dtImportName = firetable.ui.strip(allthestuff.split('<h4>')[1].split('</h4>')[0]);
        var hams = allthestuff.split('<li class="list-group-item list-group-item-dark" ');
        hams.shift();
        firetable.dtImportList = [];
        for (var i = 0; i < hams.length; i++) {
          var thingsRegex = /(type\=\"(.*))(" id\=\"(.*)\")>(.*)<\/li>/gm;
          var matches = thingsRegex.exec(hams[i])
          var type = matches[2];
          var cid = matches[4];
          var name = firetable.ui.strip(matches[5]);
          firetable.dtImportList.push({
            type: type,
            cid: cid,
            name: name
          });
        }
        console.log(firetable.dtImportList);
        console.log(firetable.dtImportName);
        if (firetable.dtImportList.length) {
          $("#importDubResults").text("Ok... import " + firetable.dtImportName + " (" + firetable.dtImportList.length + " tracks)?")
          $("#dubimportButton").show();
        } else {
          $("#importDubResults").text("ERROR... NO TRAX?")
          $("#dubimportButton").hide();
        }
      } catch (e) {
        console.log(e);
        $("#importDubResults").text("ERROR")
        $("#dubimportButton").hide();
      }


    };

  },
  strip: function(html) {
    var doc = firetable.parser.parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  },
  hidePlayerControls: function() {
    $("head").append("<style class='playerControlsHider'>.previewicon { display: none !important; } div#playerControls { display: none !important; } </style>");
  },
  showPlayerControls: function() {
    $(".playerControlsHider").remove();
  },
  showImages: function(chatTxt) {
    if (firetable.showImages) {
      var imageUrlRegex = /((http(s?):)([/|.|\w|\s|-])*\.(?:jpe?g|gif|png))/g;
      var hasImage = chatTxt.search(imageUrlRegex) >= 0;
      if (hasImage) {
        chatTxt = chatTxt.replace(imageUrlRegex, function(imageUrl) {
          var chatImage = new Image();
          chatImage.onload = function() {
            if (firetable.utilities.isChatPrettyMuchAtBottom()) firetable.utilities.scrollToBottom();
          }
          chatImage.src = imageUrl;
          return '<a class="inlineImgLink" href="' + imageUrl + '" target="_blank" tabindex="-1"><img src="' + imageUrl + '" class="inlineImage" /><span role=\"button\" class="hideImage">&times;</span></a>'
        });

      }
    }
    return chatTxt;
  },
  loginLinkToggle: function(id) {
    $("#formlinks").find(".selected").removeClass("selected");
    $("#" + id).addClass("selected");
  },
  loginEventsInit: function() {
    $("#resetpass").bind("click", function() {
      $("#logscreen").css("display", "none");
      $("#createscreen").css("display", "none");
      $("#resetscreen").css("display", "block");
      firetable.ui.loginLinkToggle($(this).attr('id'));
    });
    $("#loginlink").bind("click", function() {
      $("#logscreen").css("display", "block");
      $("#createscreen").css("display", "none");
      $("#resetscreen").css("display", "none");
      firetable.ui.loginLinkToggle($(this).attr('id'));
    });
    $("#signuplink").bind("click", function() {
      $("#logscreen").css("display", "none");
      $("#createscreen").css("display", "block");
      $("#resetscreen").css("display", "none");
      firetable.ui.loginLinkToggle($(this).attr('id'));
    });
    $("#loginpass").bind("keyup", function(e) {
      if (e.which == 13) {
        var email = $("#loginemail").val();
        var pass = $("#loginpass").val();
        $("#loginemail").val("");
        $("#loginpass").val("");
        firetable.actions.logIn(email, pass);
      }
    });
    $("#newpass2").bind("keyup", function(e) {
      if (e.which == 13) {
        var email = $("#newemail").val();
        var pass = $("#newpass").val();
        var pass2 = $("#newpass2").val();
        var username = $("#newusername").val();
        if (pass == pass2) {
          firetable.actions.signUp(email, pass, username);
        } else {
          alert("Those passwords do not match!");
        }
      }
    });
    $("#theAddress").bind("keyup", function(e) {
      if (e.which == 13) {
        var email = $("#theAddress").val();
        firetable.debug && console.log("reset email return");
        ftapi.actions.resetPassword(email, function(error) {
          var errorCode = error.code;
          var errorMessage = error.message;
          if (errorCode === 'auth/wrong-password') {
            alert('Wrong password.');
          } else {
            alert(errorMessage);
          }
          firetable.debug && console.log('send pass reset error:', error);
        });
        alert("Reset email sent. Click the reset link when it arrives thanks.");
      }
    });
    $("#createAccountBttn").bind("click", function() {
      var email = $("#newemail").val();
      var pass = $("#newpass").val();
      var pass2 = $("#newpass2").val();
      var termsAgreedTo = $("#agreetoterms").is(":checked");
      var username = $("#newusername").val();
      if (!termsAgreedTo) {
        alert("You must read and agree to the Terms of Service and Privacy Policy before you can create an account.");
      } else if (pass != pass2) {
        alert("Those passwords do not match!");
      } else {
        firetable.actions.signUp(email, pass, username);
      }
    });
    $("#resetPassBttn").bind("click", function() {
      var email = $("#theAddress").val();
      firetable.debug && console.log("reset email click button");
      ftapi.actions.resetPassword(email, function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
          alert('Wrong password.');
        } else {
          alert(errorMessage);
        }
        firetable.debug && console.log('send pass reset error:', error);
      });
      alert("Reset email sent. Click the reset link when it arrives thanks.");
    });
    $("#loginBttn").bind("click", function() {
      var email = $("#loginemail").val();
      var pass = $("#loginpass").val();
      $("#loginemail").val("");
      $("#loginpass").val("");
      firetable.actions.logIn(email, pass);
    });
  },
  loginEventsDestroy: function() {
    $("#resetpass").off("click");
    $("#loginlink").off("click");
    $("#signuplink").off("click");
    $("#loginpass").off("keyup");
    $("#newpass2").off("keyup");
    $("#theAddress").off("keyup");
    $("#createAccountBttn").off("click");
    $("#resetPassBttn").off("click");
    $("#loginBttn").off("click");
  },
  init: function() {

    $('#mainqueue').sortable({
      start: function(event, ui) {
        var start_pos = ui.item.index();
        ui.item.data('start_pos', start_pos);
      },
      change: function(event, ui) {

      },
      update: function(event, ui) {
        firetable.debug && console.log("UPDATE");
        firetable.actions.updateQueue();
      }
    });
    //GET SETTINGS FROM LOCALSTORAGE
    var disableMediaPlayback = localStorage["firetableDisableMedia"];
    if (typeof disableMediaPlayback == "undefined") {
      localStorage["disableMediaPlayback"] = false;
      firetable.disableMediaPlayback = false;
      $("#mediaDisableToggle").prop("checked", false);
    } else {
      disableMediaPlayback = JSON.parse(disableMediaPlayback);
      firetable.disableMediaPlayback = disableMediaPlayback;
      $("#mediaDisableToggle").prop("checked", disableMediaPlayback);
      if (disableMediaPlayback) {
        firetable.ui.hidePlayerControls();
      }
    }

    var showImages = localStorage["firetableShowImages"];
    if (typeof showImages == "undefined") {
      localStorage["firetableShowImages"] = false;
      firetable.showImages = false;
      $("#showImagesToggle").prop("checked", false);
    } else {
      showImages = JSON.parse(showImages);
      firetable.showImages = showImages;
      $("#showImagesToggle").prop("checked", showImages);
    }
    var showAvatars = localStorage["firetableShowAvatars"];
    if (typeof showAvatars == "undefined") {
      localStorage["firetableShowAvatars"] = true;
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
    var playBadoop = localStorage["firetableBadoop"];
    if (typeof playBadoop == "undefined") {
      localStorage["firetableBadoop"] = true;
      firetable.playBadoop = true;
      $("#badoopToggle").prop("checked", true);
    } else {
      playBadoop = JSON.parse(playBadoop);
      firetable.playBadoop = playBadoop;
      $("#badoopToggle").prop("checked", playBadoop);
    }
    var dtnmt = localStorage["firetableDTNM"];
    if (typeof dtnmt == "undefined") {
      localStorage["firetableDTNM"] = false;
      firetable.desktopNotifyMentions = false;
      $("#desktopNotifyMentionsToggle").prop("checked", false);
    } else {
      dtnmt = JSON.parse(dtnmt);
      firetable.desktopNotifyMentions = dtnmt;
      $("#desktopNotifyMentionsToggle").prop("checked", dtnmt);
    }
    var screenControl = localStorage["firetableScreenControl"];
    if (typeof screenControl == "undefined") {
      localStorage["firetableScreenControl"] = "sync";
      firetable.screenControl = "sync";
      $("#screenControlTog" + firetable.screenControl).prop("checked", true);
    } else {
      firetable.screenControl = screenControl;
      $("#screenControlTog" + firetable.screenControl).prop("checked", true);
      if (screenControl == "on") {
        firetable.utilities.screenDown();
      } else if (screenControl == "off") {
        firetable.utilities.screenUp();
      } else if (screenControl == "sync") {
        if (firetable.screenSyncPos) {
          firetable.utilities.screenDown();
        } else {
          firetable.utilities.screenUp();
        }
      }
    }
    var $historyItem = $('#thehistory .pvbar').remove();
    ftapi.events.on('newHistory', function(data) {
      if (data.img == "img/idlogo.png" && ftconfigs.defaultAlbumArtUrl.length) data.img = ftconfigs.defaultAlbumArtUrl;
      var firstpart = "yt";
      if (data.type == 2) firstpart == "sc";
      var pkey = firstpart + "cid" + data.cid;
      var $histItem = $historyItem.clone();
      $histItem.attr('id', "pvbar" + pkey);
      $histItem.attr("data-key", pkey);
      $histItem.attr("data-cid", data.cid);
      $histItem.attr("data-type", data.type);

      $histItem.find('.previewicon').attr('id', "pv" + pkey).on('click', function() {
        firetable.actions.pview(
          $(this).closest('.pvbar').attr('data-key'),
          true,
          $(this).closest('.pvbar').attr('data-type'),
          true
        );
      });
      $histItem.find('.histlink').attr({
        'href': data.url,
        'tabindex': "-1"
      }).text(data.artist + " - " + data.title);
      $histItem.find('.histdj').text(data.dj);
      $histItem.find('.histdate').text(firetable.utilities.format_date(data.when));
      $histItem.find('.histtime').text(firetable.utilities.format_time(data.when));
      $histItem.find('.histeal').attr('id', "apv" + data.type + data.cid).on('click', function() {
        firetable.actions.queueTrack(
          $(this).closest('.pvbar').attr('data-cid'),
          firetable.utilities.htmlEscape($(this).closest('.pvbar').find('.histlink').text()),
          $(this).closest('.pvbar').attr('data-type'),
          true
        );
      });
      $histItem.find('.histart').css('background-image', 'url(' + data.img + ')');
      $histItem.prependTo("#thehistory");
      // simplebar scroll update?
    });
    ftapi.events.on("newTheme", function(data) {
      if (!data) {
        //no theme
        $("#currentTheme").text("!suggest a theme");
      } else {
        var txtOut = firetable.ui.strip(data);
        txtOut = firetable.ui.textToLinks(txtOut, true);
        txtOut = firetable.utilities.emojiShortnamestoUnicode(txtOut);
        txtOut = txtOut.replace(/\`(.*?)\`/g, function(x) {
          return "<code>" + x.replace(/\`/g, "") + "</code>";
        });
        $("#currentTheme").html(txtOut);
        twemoji.parse(document.getElementById("currentTheme"));
      }
    });
    ftapi.events.on("tagUpdate", function(data) {
      firetable.debug && console.log("TAG UPDATE", data);
      firetable.tagUpdate = data;
      if (firetable.song) {
        if (firetable.song.cid == data.cid && data.adamData.track_name) {
          $("#track").text(firetable.ui.strip(data.adamData.track_name));
          $("#artist").text(firetable.ui.strip(data.adamData.artist));
          var nicename = firetable.song.djname;
          var showPlaycount = false;
          if (data.adamData.playcount) {
            if (data.adamData.playcount > 0) {
              showPlaycount = true;
            }
          }
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
            $(".npmsg" + data.cid).last().html("<div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing <strong>" + data.adamData.track_name + "</strong> by <strong>" + data.adamData.artist + "</strong><br/>This song has been played " + data.adamData.playcount + " times.</div>");
          } else {
            $("#playCount").text("");
            $(".npmsg" + data.cid).last().html("<div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing <strong>" + data.adamData.track_name + "</strong> by <strong>" + data.adamData.artist + "</strong></div>");
          }
          if (doTheScrollThing) firetable.utilities.scrollToBottom();
        }
      }
    });


    ftapi.events.on('newSong', function(data) {
      $("#playCount").text("");
      $("#lastPlay").text("");
      $("#firstPlay").text("");
      window.dispatchEvent(new Event('resize'));
      $("#cloud_with_rain").removeClass("on");
      $("#fire").removeClass("on");
      $("#timr").countdown("destroy");
      if (firetable.moveBar != null) {
        clearInterval(firetable.moveBar);
        firetable.moveBar = null;
      }
      if (data.image == "img/idlogo.png" && ftconfigs.defaultAlbumArtUrl.length) data.image = ftconfigs.defaultAlbumArtUrl;
      $("#prgbar").css("background", "#151515");
      var showPlaycount = false;
      if (firetable.tagUpdate) {
        if (data.cid == firetable.tagUpdate.cid && firetable.tagUpdate.adamData.track_name) {
          data.title = firetable.tagUpdate.adamData.track_name;
          data.artist = firetable.tagUpdate.adamData.artist;
          if (firetable.tagUpdate.adamData.last_play) {
            $("#lastPlay").text("last " + firetable.utilities.format_date(firetable.tagUpdate.adamData.last_play) + " by " + firetable.tagUpdate.adamData.last_play_dj);
          }
          if (firetable.tagUpdate.adamData.first_play) {
            $("#firstPlay").text("first " + firetable.utilities.format_date(firetable.tagUpdate.adamData.first_play) + " by " + firetable.tagUpdate.adamData.first_play_dj);
          }
          if (firetable.tagUpdate.adamData.playcount) {
            if (firetable.tagUpdate.adamData.playcount > 0) {
              showPlaycount = true;
              $("#playCount").text(firetable.tagUpdate.adamData.playcount + " plays");
            }
          }
        }
      }
      $("#track").text(firetable.ui.strip(data.title));
      $("#artist").text(firetable.ui.strip(data.artist));
      $("#songlink").attr("href", data.url);
      $("#albumArt").css("background-image", "url(" + data.image + ")");
      var nownow = Date.now();
      var timeSince = nownow - data.started;
      if (timeSince <= 0) timeSince = 0;
      var secSince = Math.floor(timeSince / 1000);
      var timeLeft = data.duration - secSince;
      firetable.song = data;
      firetable.debug && console.log("NEW TRACK", data);
      firetable.debug && console.log('time since:', timeSince);
      if (data.type == 1) {
        $("#scScreen").hide();
        $("#songlink").html('<svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="youtube" class="svg-inline--fa fa-youtube fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"></path></svg>');
      } else if (data.type == 2) {
        $("#scScreen").show();
        $("#songlink").html('<svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="soundcloud" class="svg-inline--fa fa-soundcloud fa-w-20" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M111.4 256.3l5.8 65-5.8 68.3c-.3 2.5-2.2 4.4-4.4 4.4s-4.2-1.9-4.2-4.4l-5.6-68.3 5.6-65c0-2.2 1.9-4.2 4.2-4.2 2.2 0 4.1 2 4.4 4.2zm21.4-45.6c-2.8 0-4.7 2.2-5 5l-5 105.6 5 68.3c.3 2.8 2.2 5 5 5 2.5 0 4.7-2.2 4.7-5l5.8-68.3-5.8-105.6c0-2.8-2.2-5-4.7-5zm25.5-24.1c-3.1 0-5.3 2.2-5.6 5.3l-4.4 130 4.4 67.8c.3 3.1 2.5 5.3 5.6 5.3 2.8 0 5.3-2.2 5.3-5.3l5.3-67.8-5.3-130c0-3.1-2.5-5.3-5.3-5.3zM7.2 283.2c-1.4 0-2.2 1.1-2.5 2.5L0 321.3l4.7 35c.3 1.4 1.1 2.5 2.5 2.5s2.2-1.1 2.5-2.5l5.6-35-5.6-35.6c-.3-1.4-1.1-2.5-2.5-2.5zm23.6-21.9c-1.4 0-2.5 1.1-2.5 2.5l-6.4 57.5 6.4 56.1c0 1.7 1.1 2.8 2.5 2.8s2.5-1.1 2.8-2.5l7.2-56.4-7.2-57.5c-.3-1.4-1.4-2.5-2.8-2.5zm25.3-11.4c-1.7 0-3.1 1.4-3.3 3.3L47 321.3l5.8 65.8c.3 1.7 1.7 3.1 3.3 3.1 1.7 0 3.1-1.4 3.1-3.1l6.9-65.8-6.9-68.1c0-1.9-1.4-3.3-3.1-3.3zm25.3-2.2c-1.9 0-3.6 1.4-3.6 3.6l-5.8 70 5.8 67.8c0 2.2 1.7 3.6 3.6 3.6s3.6-1.4 3.9-3.6l6.4-67.8-6.4-70c-.3-2.2-2-3.6-3.9-3.6zm241.4-110.9c-1.1-.8-2.8-1.4-4.2-1.4-2.2 0-4.2.8-5.6 1.9-1.9 1.7-3.1 4.2-3.3 6.7v.8l-3.3 176.7 1.7 32.5 1.7 31.7c.3 4.7 4.2 8.6 8.9 8.6s8.6-3.9 8.6-8.6l3.9-64.2-3.9-177.5c-.4-3-2-5.8-4.5-7.2zm-26.7 15.3c-1.4-.8-2.8-1.4-4.4-1.4s-3.1.6-4.4 1.4c-2.2 1.4-3.6 3.9-3.6 6.7l-.3 1.7-2.8 160.8s0 .3 3.1 65.6v.3c0 1.7.6 3.3 1.7 4.7 1.7 1.9 3.9 3.1 6.4 3.1 2.2 0 4.2-1.1 5.6-2.5 1.7-1.4 2.5-3.3 2.5-5.6l.3-6.7 3.1-58.6-3.3-162.8c-.3-2.8-1.7-5.3-3.9-6.7zm-111.4 22.5c-3.1 0-5.8 2.8-5.8 6.1l-4.4 140.6 4.4 67.2c.3 3.3 2.8 5.8 5.8 5.8 3.3 0 5.8-2.5 6.1-5.8l5-67.2-5-140.6c-.2-3.3-2.7-6.1-6.1-6.1zm376.7 62.8c-10.8 0-21.1 2.2-30.6 6.1-6.4-70.8-65.8-126.4-138.3-126.4-17.8 0-35 3.3-50.3 9.4-6.1 2.2-7.8 4.4-7.8 9.2v249.7c0 5 3.9 8.6 8.6 9.2h218.3c43.3 0 78.6-35 78.6-78.3.1-43.6-35.2-78.9-78.5-78.9zm-296.7-60.3c-4.2 0-7.5 3.3-7.8 7.8l-3.3 136.7 3.3 65.6c.3 4.2 3.6 7.5 7.8 7.5 4.2 0 7.5-3.3 7.5-7.5l3.9-65.6-3.9-136.7c-.3-4.5-3.3-7.8-7.5-7.8zm-53.6-7.8c-3.3 0-6.4 3.1-6.4 6.7l-3.9 145.3 3.9 66.9c.3 3.6 3.1 6.4 6.4 6.4 3.6 0 6.4-2.8 6.7-6.4l4.4-66.9-4.4-145.3c-.3-3.6-3.1-6.7-6.7-6.7zm26.7 3.4c-3.9 0-6.9 3.1-6.9 6.9L227 321.3l3.9 66.4c.3 3.9 3.1 6.9 6.9 6.9s6.9-3.1 6.9-6.9l4.2-66.4-4.2-141.7c0-3.9-3-6.9-6.9-6.9z"></path></svg>');
        var biggerImg = data.image.replace('-large', '-t500x500');
        firetable.scImg = biggerImg;
        $("#albumArt").css("background-image", "url(" + biggerImg + ")")
        try {
          setup(biggerImg);
        } catch (e) {
          firetable.debug && console.log('big image error:', e)
        }
      }
      if (data.type == 1 && firetable.ytLoaded) {
        if (!firetable.preview) {
          if (firetable.scLoaded) firetable.scwidget.pause();
          if (!firetable.disableMediaPlayback) player.loadVideoById(data.cid, secSince, "large");
          var thevolactual = $("#slider").slider("value");
          player.setVolume(thevolactual);
          firetable.scwidget.setVolume(thevolactual);
        }
      } else if (data.type == 2 && firetable.scLoaded) {
        if (!firetable.preview) {
          if (firetable.ytLoaded) player.stopVideo();
          firetable.scSeek = timeSince;
          if (!firetable.disableMediaPlayback) firetable.scwidget.load("http://api.soundcloud.com/tracks/" + data.cid, {
            auto_play: true,
            single_active: false,
            callback: function() {
              var thevolactual = localStorage["firetableVol"];
              player.setVolume(thevolactual);
              firetable.scwidget.setVolume(thevolactual);
            }
          });
        }
      }
      if (data.cid != 0) {
        var nicename = data.djid;
        if (ftapi.users[data.djid]) {
          if (ftapi.users[data.djid].username) nicename = ftapi.users[data.djid].username;
        }
        if (firetable.nonpmsg) {
          firetable.nonpmsg = false;
        } else {
          var doTheScrollThing = firetable.utilities.isChatPrettyMuchAtBottom();
          if (showPlaycount) {
            $("#chats").append("<div class=\"newChat nowplayn npmsg" + data.cid + "\"><div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing <strong>" + data.title + "</strong> by <strong>" + data.artist + "</strong><br/>This song has been played " + firetable.tagUpdate.adamData.playcount + " times.</div>")
          } else {
            $("#chats").append("<div class=\"newChat nowplayn npmsg" + data.cid + "\"><div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing <strong>" + data.title + "</strong> by <strong>" + data.artist + "</strong></div>")
          }
          if (doTheScrollThing) firetable.utilities.scrollToBottom();
          firetable.lastChatPerson = false;
          firetable.lastChatId = false;
        }

      }
      $("#timr").countdown({
        until: timeLeft,
        compact: true,
        description: "",
        format: "MS"
      });
      firetable.moveBar = setInterval(function() {
        var now = Date.now();
        var sofar = now - firetable.song.started;
        var pcnt = (sofar / (firetable.song.duration * 1000)) * 100;
        $("#prgbar").css("background", "linear-gradient(90deg, " + firetable.color + " " + pcnt + "%, #151515 " + pcnt + "%)");
      }, 500);
    });
    ftapi.events.on("screenStateChanged", function(data) {
      firetable.debug && console.log('thescreen:', data);
      firetable.screenSyncPos = data;
      if (firetable.screenControl == "sync") {
        if (data) {
          firetable.utilities.screenDown();
        } else {
          firetable.utilities.screenUp();
        }
      }
    });
    ftapi.events.on("danceStateChanged", function(data) {
      firetable.debug && console.log('dance check:', data);
      if (data) {
        $("#deck").addClass("dance");
      } else {
        $("#deck").removeClass("dance");
      }
    });
    ftapi.events.on("lightsChanged", function(data) {
      firetable.debug && console.log('lights check:', data);
      if (data) {
        firetable.lights = true;
        $('.festiveLights').remove();
        var colorThing = firetable.utilities.hexToRGB(firetable.color);
        var style = "<style class='festiveLights'>.lightrope { text-align: center; white-space: nowrap; overflow: hidden; position: absolute; z-index: 1; margin: -6px 0 0 0; padding: 0; pointer-events: none; width: 100%; z-index: 55; }ul.lightrope li{position: relative; list-style: none; margin: 0; padding: 0; display: block; width: 6px; height: 14px; border-radius: 50%; margin: 10px; display: inline-block; background: #111;} .lightrope li span { position: relative; animation-fill-mode: both; animation-iteration-count: infinite; list-style: none; margin: 0; padding: 0; display: block; width: 6px; height: 14px; border-radius: 50%; display: inline-block; background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); animation-name: flash-1; animation-duration: 2s; } .lightrope li:nth-child(2n+1) span { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.5); animation-name: flash-2; animation-duration: 0.4s; } .lightrope li:nth-child(4n+2) span { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); animation-name: flash-3; animation-duration: 1.1s; } .lightrope li:nth-child(odd) span { animation-duration: 1.8s; } .lightrope li:nth-child(3n+1) span { animation-duration: 1.4s; } .lightrope li :before { content: \"\"; position: absolute; background: #4e4e4e; width: 4px; height: 4.6666666667px; border-radius: 3px; top: -2.3333333333px; left: 1px; } .lightrope li:after { content: \"\"; top: -7px; left: 3px; position: absolute; width: 32px; height: 9.3333333333px; border-bottom: solid #4e4e4e 2px; border-radius: 50%; } .lightrope li:last-child:after { content: none; } .lightrope li:first-child { margin-left: -20px; } @keyframes flash-1 { 0%, 100% { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); } 50% { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.4); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.2); } } @keyframes flash-2 { 0%, 100% { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); } 50% { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.4); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.2); } } @keyframes flash-3 { 0%, 100% { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); } 50% { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.4); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.2); } }</style>";
        $("head").append(style);
      } else {
        $('.festiveLights').remove();
        firetable.lights = false;
      }
    });
    ftapi.events.on("waitlistChanged", function(data) {
      var ok1 = "";
      var cnt = "0";
      if (data) {
        var countr = 1;
        for (var key in data) {
          firetable.debug && console.log('waitlist', data);
          if (data.hasOwnProperty(key)) {
            cnt = countr;
            var removeMe = "";
            if (data[key].removeAfter) removeMe = "departure_board"
            ok1 += "<div class=\"prson\"><div class=\"botson\" style=\"background-image:url(https://indiediscotheque.com/robots/" + data[key].id + "" + data[key].name + ".png?size=110x110&set="+firetable.avatarset+");\"></div><span class=\"prsnName\">" + countr + ". " + data[key].name + " <span class=\"removemeIcon material-icons\"> " + removeMe + " </span></span></div>";
            countr++;
          }
        }
      }
      $("#label2 .count").text(" (" + cnt + ")");
      $("#justwaitlist").html(ok1);
    });
    ftapi.events.on("tableChanged", function(data) {
      var ok1 = "";
      if (data) {
        var countr = 0;
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            var removeMe = "";
            if (data[key].removeAfter) removeMe = "departure_board"

            ok1 += "<div id=\"spt" + countr + "\" class=\"spot\"><div class=\"avtr\" id=\"avtr" + countr + "\" style=\"background-image: url(https://indiediscotheque.com/robots/" + data[key].id + "" + data[key].name + ".png?size=110x110&set="+firetable.avatarset+");\"></div><div id=\"djthing" + countr + "\" class=\"djplaque\"><div class=\"djname\"><span class=\"removemeIcon material-icons\"> " + removeMe + " </span> " + data[key].name + "</div><div class=\"playcount\">" + data[key].plays + "/<span id=\"plimit" + countr + "\">" + firetable.playlimit + "</span></div></div></div>";
            countr++;
          }
        }
        if (countr < 4) {
          ok1 += "<div class=\"spot empty\"><div class=\"djplaque\"><div class=\"djname\">!addme</div><div class=\"playcount\"></div></div></div>";
          countr++;
          for (var i = countr; i < 4; i++) {
            ok1 += "<div class=\"spot empty\"><div class=\"djplaque\">&nbsp;</div></div>";
          }
        }

      } else {
        ok1 += "<div class=\"spot empty\"><div class=\"djplaque\"><div class=\"djname\">!addme</div><div class=\"playcount\"></div></div></div>";
        for (var i = 0; i < 3; i++) {
          ok1 += "<div class=\"spot empty\"><div class=\"djplaque\">&nbsp;</div></div>";
        }
      }
      $("#deck").html(ok1);
      for (var i = 0; i < 4; i++) {
        if (i != firetable.playdex) {
          $("#avtr" + i).removeClass("animate");
          $("#djthing" + i).removeClass("djActive");

        } else {
          $("#avtr" + i).addClass("animate");
          $("#djthing" + i).addClass("djActive");
        }
      }
    });
    ftapi.events.on("spotlightStateChanged", function(data) {
      firetable.playdex = data;
      for (var i = 0; i < 4; i++) {
        if (i != data) {
          $("#avtr" + i).removeClass("animate");
          $("#djthing" + i).removeClass("djActive");

        } else {
          $("#avtr" + i).addClass("animate");
          $("#djthing" + i).addClass("djActive");
        }
      }
    });
    ftapi.events.on("playLimitChanged", function(data) {
      firetable.playlimit = data;
      for (var i = 0; i < 4; i++) {
        $("#plimit" + i).text(data);
      }
    });
    ftapi.events.on("banListChanged", function(data) {
      $("#activeSuspentions").html("");
      for (key in data) {
        if (data[key]) {
          ftapi.lookup.userByName(key, function(person) {
            $("#activeSuspentions").append("<div class=\"importResult\"><div class=\"imtxt\">" + person.username + "</div><i role=\"button\" onclick=\"firetable.actions.unban('" + person.userid + "')\" class=\"material-icons\" title=\"Unsuspend\">&#xE5C9;</i></div>");
          });
        }
      }
    });
    ftapi.events.on("userJoined", function(data) {
      console.log(data);
      var user = data;
      var block = "";
      var blockcon = "";
      var herecon = "lens";
      var isIdle = "";
      if (data.idle) {
        if (data.idle.isIdle && !data.hostbot) isIdle = "idle";
        if (data.idle.audio == 2) {
          herecon = "label_important";
        }
      }
      if (data.blocked) {
        block = "blockd";
        blockcon = "block";
      }

      if (!data.username) data.username = data.userid;

      var destination = "#usersRegular";
      var rolename = "";
      if (data.mod) {
        rolename = "mod";
        destination = "#usersMod";
      }
      if (data.supermod) {
        rolename = "supermod";
        destination = "#usersSuper";
      }
      if (data.hostbot) {
        rolename = "robot";
        destination = "#usersBot";
      }

      var newUserToAddX = $("<div></div>");
      newUserToAddX.addClass("prson " + block);
      newUserToAddX.attr("id", "user" + data.userid);
      newUserToAddX.html("<div class=\"botson\" style=\"background-image:url(https://indiediscotheque.com/robots/" + data.userid + "" + data.username + ".png?size=110x110&set="+firetable.avatarset+");\"><span class=\"material-icons block\">" + blockcon + "</span><span class=\"material-icons herecon " + isIdle + "\">" + herecon + "</span></div><span class=\"prsnName\">" + data.username + "</span><span class=\"utitle\">" + rolename + "</span><span class=\"prsnJoined\">joined " + firetable.utilities.format_date(data.joined) + "</span>");
      firetable.utilities.chatAt(newUserToAddX); // adds the click event to @ the user
      $(destination).append(newUserToAddX);
    });
    ftapi.events.on("userLeft", function(data) {
      $("#user" + data.userid).remove();
    });
    ftapi.events.on("userChanged", function(data) {
      var user = data;
      var block = "";
      var blockcon = "";
      var herecon = "lens";
      var isIdle = "";
      console.log("CHANGE", data)
      if (data.idle) {
        if (data.idle.isIdle && !data.hostbot) isIdle = "idle";
        if (data.idle.audio == 2) {
          herecon = "label_important";
        }
      }
      if (data.blocked) {
        block = "blockd";
        blockcon = "block";
      }

      if (!data.username) data.username = data.userid;

      var destination = "#usersRegular";
      var rolename = "";
      if (data.mod) {
        rolename = "mod";
        destination = "#usersMod";
      }
      if (data.supermod) {
        rolename = "supermod";
        destination = "#usersSuper";
      }
      if (data.hostbot) {
        rolename = "robot";
        destination = "#usersBot";
      }

      $("#user" + data.userid).html("<div class=\"botson\" style=\"background-image:url(https://indiediscotheque.com/robots/" + data.userid + "" + data.username + ".png?size=110x110&set="+firetable.avatarset+");\"><span class=\"material-icons block\">" + blockcon + "</span><span class=\"material-icons herecon " + isIdle + "\">" + herecon + "</span></div><span class=\"prsnName\">" + data.username + "</span><span class=\"utitle\">" + rolename + "</span><span class=\"prsnJoined\">joined " + firetable.utilities.format_date(data.joined) + "</span>");
    });
    ftapi.events.on("usersChanged", function(okdata) {
      if ($("#loggedInName").text() == ftapi.uid) {
        if (ftapi.users[ftapi.uid]) {
          if (ftapi.users[ftapi.uid].username) {
            $("#loggedInName").text(ftapi.users[ftapi.uid].username);
          }
        }
      }
      if (ftapi.uid) {
        if (ftapi.users[ftapi.uid]) {
          if (ftapi.users[ftapi.uid].supermod) {
            if ($("#ftSuperCopButton").is(":hidden")) {
              $("#ftSuperCopButton").show();
            }
          }
        }
      }
      var count = Object.keys(okdata).length;
      $("#label1 .count").text(" (" + count + ")");
      firetable.debug && console.log('users:', okdata);
    });
    var $chatTemplate = $('#chatKEY').remove();
    ftapi.events.on("newChat", function(chatData) {
      var namebo = chatData.id;
      var utitle = "";

      var atBottom = false;
      if (firetable.utilities.isChatPrettyMuchAtBottom()) atBottom = true;

      var you = ftapi.uid;
      if (ftapi.users[ftapi.uid]) {
        if (ftapi.users[ftapi.uid].username) you = ftapi.users[ftapi.uid].username;
      }

      if (ftapi.users[chatData.id]) {
        if (ftapi.users[chatData.id].username) namebo = ftapi.users[chatData.id].username;
        if (ftapi.users[chatData.id].mod) utitle = "mod";
        if (ftapi.users[chatData.id].supermod) utitle = "supermod";
        if (ftapi.users[chatData.id].hostbot) utitle = "robot";
      } else if (chatData.name) {
        namebo = chatData.name;
      }

      var badoop = false;
      if (chatData.txt.match("@" + you, 'i') || chatData.txt.match(/\@everyone/)) {
        var oknow = Date.now();
        if (oknow - chatData.time < (10 * 1000)) {
          firetable.utilities.playSound("sound");
          if (firetable.desktopNotifyMentions) firetable.utilities.desktopNotify(chatData, namebo);
          badoop = true;
        }
      }
      if (chatData.id == firetable.lastChatPerson && !badoop) {
        $("#chat" + firetable.lastChatId + " .chatContent").append("<div id=\"chattxt" + chatData.chatID + "\" class=\"chatText\"></div>");
        $("#chatTime" + firetable.lastChatId).text(firetable.utilities.format_time(chatData.time));
        var txtOut = firetable.ui.strip(chatData.txt);
        txtOut = firetable.ui.showImages(txtOut);
        txtOut = firetable.ui.textToLinks(txtOut);
        txtOut = firetable.utilities.emojiShortnamestoUnicode(txtOut);
        txtOut = txtOut.replace(/\`(.*?)\`/g, function(x) {
          return "<code>" + x.replace(/\`/g, "") + "</code>";
        });
        if (chatData.hidden) txtOut = "[message removed]";
        $("#chattxt" + chatData.chatID).html(txtOut);
        var canBeDeleted = false;
        if (ftapi.users[ftapi.uid].mod || ftapi.users[ftapi.uid].supermod) {
          if (ftapi.users[chatData.id]) {
            if (!ftapi.users[chatData.id].mod && !ftapi.users[chatData.id].supermod) {
              canBeDeleted = true;
            }
          } else {
            canBeDeleted = true;
          }
          if (canBeDeleted && !chatData.hidden) {
            // add delete button
            $("#chattxt" + chatData.chatID).addClass("deleteMe");
            $("#chattxt" + chatData.chatID).append("<div class=\"modDelete\">x</div>");
            $("#chattxt" + chatData.chatID).find(".modDelete").on('click', function() {
              console.log("DELETE CHAT", chatData);
              ftapi.actions.deleteChat(chatData.feedID);
            });
          }
        }
        twemoji.parse(document.getElementById("chattxt" + chatData.chatID));

      } else {
        var $chatthing = $chatTemplate.clone();
        $chatthing.attr('id', "chat" + chatData.chatID);
        $chatthing.find('.botson').css('background-image', "url(https://indiediscotheque.com/robots/" + chatData.id + namebo + ".png?size=110x110&set="+firetable.avatarset);
        $chatthing.find('.utitle').html(utitle);
        $chatthing.find('.chatTime').attr('id', "chatTime" + chatData.chatID).html(firetable.utilities.format_time(chatData.time));
        if (badoop) $chatthing.addClass('badoop');
        var txtOut = firetable.ui.strip(chatData.txt);
        txtOut = firetable.ui.showImages(txtOut);
        txtOut = firetable.ui.textToLinks(txtOut);
        txtOut = firetable.utilities.emojiShortnamestoUnicode(txtOut);
        txtOut = txtOut.replace(/\`(.*?)\`/g, function(x) {
          return "<code>" + x.replace(/\`/g, "") + "</code>";
        });
        if (chatData.hidden) txtOut = "[message removed]";
        $chatthing.find(".chatText").html(txtOut).attr('id', "chattxt" + chatData.chatID);
        console.log(chatData);

        $chatthing.find(".chatName").text(namebo);
        firetable.utilities.chatAt($chatthing.find('.botson')); // adds the click event to @ the user
        firetable.utilities.chatAt($chatthing.find('.chatName')); // adds the click event to @ the user
        twemoji.parse($chatthing.find(".chatText")[0]);
        $chatthing.appendTo("#chats");
        try {
          if (ftapi.users[ftapi.uid].mod || ftapi.users[ftapi.uid].supermod) {
            var canBeDeleted = false;
            if (ftapi.users[chatData.id]) {
              if (!ftapi.users[chatData.id].mod && !ftapi.users[chatData.id].supermod && !chatData.hidden) {
                canBeDeleted = true;
              }
            } else {
              canBeDeleted = true;
            }
            if (canBeDeleted && !chatData.hidden) {
              // add delete button
              $chatthing.find(".chatText").addClass("deleteMe");
              $chatthing.find(".chatText").append("<div class=\"modDelete\">x</div>");
              $chatthing.find(".modDelete").on('click', function() {
                ftapi.actions.deleteChat(chatData.feedID);
              });
            }
          }
        } catch (e) {
          console.log(e)
        }
        firetable.lastChatPerson = chatData.id;
        firetable.lastChatId = chatData.chatID;
      }

      if (chatData.card) {
        $("#chattxt" + chatData.chatID).append("<canvas width=\"225\" height=\"300\" class=\"chatCard\" id=\"cardMaker" + chatData.chatID + "\"></canvas>");

        firetable.actions.showCard(chatData.card, chatData.chatID);
        firetable.debug && console.log("showin card");
      }

      if (atBottom || ftapi.uid == chatData.id) firetable.utilities.scrollToBottom();
      else $('#morechats').addClass('show');
    });

    ftapi.events.on("chatRemoved", function(data) {
      console.log("CHAT DELETED", data);
      $("#chattxt" + data.chatID).text("[message removed]");
      if (ftapi.users[ftapi.uid].mod || ftapi.users[ftapi.uid].supermod) $("#chattxt" + data.chatID).removeClass("deleteMe");
    });

    ftapi.events.on("playlistChanged", function(okdata, listID) {
      firetable.queue = okdata;
      $('#mainqueue').html("");
      for (var key in okdata) {
        if (okdata.hasOwnProperty(key)) {
          var $newli = $playlistItemTemplate.clone();
          var thisone = okdata[key];
          var psign = "&#xE037;";
          if (key == firetable.preview) {
            psign = "&#xE034;";
          }
          $newli.attr('id', "pvbar" + key);
          $newli.attr("data-key", key);
          $newli.attr("data-type", thisone.type);
          $newli.find('.previewicon').attr('id', "pv" + key).on('click', function() {
            firetable.actions.pview($(this).closest('.pvbar').attr('data-key'), false, $(this).closest('.pvbar').attr('data-type'));
          }).html(psign);
          $newli.find('.listwords').html(thisone.name);
          $newli.find('.bumpsongs').on('click', function() {
            firetable.actions.bumpSongInQueue($(this).closest('.pvbar').attr('data-key'))
          });
          $newli.find('.bottomsongs').on('click', function() {
            var oldID = $(this).closest('.pvbar').attr('data-key');
            ftapi.actions.moveTrackToBottom($(this).closest('.pvbar').attr('data-key'), function(newID) {
              if (firetable.preview) {
                // visually update preview in the new location if applicable
                if (firetable.preview == oldID) {
                  firetable.preview = newID;
                  $("#pv" + newID).html("&#xE034;");
                }
              }
            });
          });
          if (thisone.flagged) {
            var flagLabel = "broken";
            var flagIcon = "warning";
            if (thisone.flagged.code == 7) {
              flagLabel = "age restricted";
            } else if (thisone.flagged.code >= 8) {
              if (thisone.flagged.code == 8) {
                // manual broken flagged by mod
                flagLabel = "broken (manual)";
              } else if (thisone.flagged.code == 9) {
                // low quality
                flagLabel = "low audio quality";
                flagIcon = "disc_full";
              } else if (thisone.flagged.code == 10) {
                // offtheme
                flagLabel = "offtheme";
                flagIcon = "flag";
              }
            }
            $newli.find('.track-warning').html("<span class=\"material-icons\"> " + flagIcon + " </span>");
            $newli.find('.track-warning').prop('title', 'Flagged as ' + flagLabel + ' on ' + firetable.utilities.format_date(thisone.flagged.date) + '. Click to remove flag.');
            $newli.find('.track-warning').on('click', function() {
              ftapi.actions.unflagTrack($(this).closest('.pvbar').attr('data-key'));
              $(this).html("");
            });

          }
          $newli.find('.edittags').on('click', function() {
            firetable.actions.editTagsPrompt($(this).closest('.pvbar').attr('data-key'))
          });
          $newli.find('.deletesong').on('click', function() {
            firetable.actions.deleteSong($(this).closest('.pvbar').attr('data-key'))
          });
          $('#mainqueue').append($newli);
        }
      }
    });

    firetable.ui.LinkGrabber.start();

    $("#label1").bind("click.lb1tab", firetable.ui.usertab1);
    $("#label2").bind("click.lb2tab", firetable.ui.usertab2);
    $("#addToQueueBttn").bind("click", function() {
      $("#mainqueuestuff").css("display", "none");
      $("#filterMachine").css("display", "none");
      $("#addbox").css("display", "flex");
      $("#cancelqsearch").show();
      $("#qControlButtons").hide();

      $("#plmanager").css("display", "none");
    });

    $("#minimodeoptions .tab").bind("click", function(event) {
      $("#mainGrid").removeClass().addClass($(this).attr('id'));
      $("#minimodeoptions .tab").removeClass('on');
      $(this).addClass('on');
    });

    $("#plmaker").bind("keyup", function(e) {
      if (e.which == 13) {
        var val = $("#plmaker").val();
        if (val != "") {
          var listid = ftapi.actions.createList(val);
          $("#listpicker").append("<option id=\"pdopt" + listid + "\" value=\"" + listid + "\">" + val + "</option>");
          $("#listpicker").val(listid).change();
          ftapi.actions.switchList(listid);
        }
      }
    });
    $("#cancelqsearch").bind("click", function() {
      $("#mainqueuestuff").css("display", "block");
      $("#filterMachine").css("display", "block");
      $("#cancelqsearch").hide();
      $("#qControlButtons").show();

      $("#addbox").css("display", "none");
      if (firetable.preview) {
        if (firetable.preview.slice(0, 5) == "ytcid" || firetable.preview.slice(0, 5) == "sccid") {
          $("#pv" + firetable.preview).html("&#xE037;");
          clearTimeout(firetable.ptimeout);
          firetable.ptimeout = null;
          $("#pvbar" + firetable.preview).css("background-image", "none");
          clearInterval(firetable.movePvBar);
          firetable.movePvBar = null;
          firetable.preview = false;
          //start regular song
          var nownow = Date.now();
          var timeSince = nownow - firetable.song.started;
          if (timeSince <= 0) timeSince = 0;

          var secSince = Math.floor(timeSince / 1000);
          var timeLeft = firetable.song.duration - secSince;
          if (firetable.song.type == 1) {
            if (!firetable.preview) {
              if (firetable.scLoaded) firetable.scwidget.pause();
              if (!firetable.disableMediaPlayback) player.loadVideoById(firetable.song.cid, secSince, "large");
            }
          } else if (firetable.song.type == 2) {
            if (!firetable.preview) {
              if (firetable.ytLoaded) player.stopVideo();
              firetable.scSeek = timeSince;
              if (!firetable.disableMediaPlayback) firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
                auto_play: true
              });
            }
          }
        }
      }
    });

    $("#grab").bind("click", function() {
      var isHidden = $("#stealContain").is(":hidden");
      if (isHidden) {
        ftapi.lookup.allLists(function(allPlaylists) {
          $("#stealpicker").html("<option value=\"-1\">Where to?</option><option value=\"0\">Default Queue</option>");
          for (var key in allPlaylists) {
            if (allPlaylists.hasOwnProperty(key)) {
              $("#stealpicker").append("<option value=\"" + key + "\">" + allPlaylists[key].name + "</option>");
            }
          }
          $('#grab').addClass('on');
          $("#stealContain").css({
            'top': $('#grab').offset().top + $('#grab').height(),
            'left': $('#grab').offset().left - 16
          }).show();
        });

      } else {
        $('#grab').removeClass('on');
        $("#stealContain").hide();
      }
    });
    $("#shuffleQueue").bind("click", firetable.actions.shuffleQueue);
    $("#history").bind("click", function() {
      $("#thehistoryWrap").slideToggle().css('top', $('#stage').outerHeight() + $('#topbar').outerHeight());
      $(this).toggleClass('on');
    });
    $("#startMerge").bind("click", function() {
      var source = $("#mergepicker").val();
      var sourceName = $("#mergepicker option:selected").text();
      var dest = $("#mergepicker2").val();
      var destName = $("#mergepicker2 option:selected").text();
      $("#mergeSetup").hide();
      $("#mergeHappening").show();
      firetable.debug && console.log(sourceName + " -> " + destName);
      firetable.actions.mergeLists(source, dest, sourceName);
    });
    $("#mergeOK").bind("click", function() {
      $("#mergeSetup").show();
      $("#mergeCompleted").hide();
      $("#mergeHappening").hide();
      $("#mergeContain").hide();
    });
    $("#mergeLists").bind("click", function() {
      var $this = $(this);
      var isHidden = $("#mergeContain").is(":hidden");
      if (isHidden) {
        ftapi.lookup.allLists(function(allPlaylists) {
          $("#mergepicker").html("<option value=\"0\">Default Queue</option>");
          $("#mergepicker2").html("<option value=\"-1\">Create New Copy</option><option value=\"0\">Default Queue</option>");
          for (var key in allPlaylists) {
            if (allPlaylists.hasOwnProperty(key)) {
              $("#mergepicker").append("<option value=\"" + key + "\">" + allPlaylists[key].name + "</option>");
              $("#mergepicker2").append("<option value=\"" + key + "\">" + allPlaylists[key].name + "</option>");
            }
          }
          if (ftapi.users[ftapi.uid]) {
            if (ftapi.users[ftapi.uid].selectedList) {
              $("#mergepicker").val(ftapi.users[ftapi.uid].selectedList).change();
              $("#mergepicker2").val(-1).change();
            }
          }
          $("#mergeContain").show();
          $this.addClass('on');
        });

      } else {
        $("#mergeContain").hide();
        $this.removeClass('on');
      }
    });
    $("#reloadtrack").bind("click", firetable.actions.reloadtrack);

    $("#importDubGo").bind("click", firetable.actions.dubtrackImport);

    $("#volstatus").bind("click", function() {
      firetable.actions.muteToggle();
    });
    $(".openModal").bind("click", function() {
      var modalContentID = $(this).attr('data-modal');
      $(".modalThing").removeClass('show');
      $("#overlay").addClass('show');
      $("#" + modalContentID).addClass('show');
    });
    $(".closeModal").bind("click", function() {
      $("#overlay").removeClass('show');
      $("#deletepicker").html("");
      firetable.actions.cardCase();
      $("#plMachine").val("");
    });
    $(document).on("click", ".closeeditor", function() {
      $(this).closest('.pvbar').removeClass('editing').find('.tagPromptBox').remove();
      firetable.songToEdit = null;
    });
    $("#cardCaseButton").bind("click", function() {
      firetable.actions.cardCase();
      $("#cardsOverlay").show();
    });
    $("#pickerNav").on("click", "span", function() {
      try {
        var sec = $(this)[0].id;
        firetable.emojis.sec(sec);
      } catch (s) {}
    });
    $("#pickEmoji").bind("click", function() {
      //toggle emoji picker
      if ($("#emojiPicker").is(":hidden")) {
        $(this).addClass('on');
        $("#emojiPicker").slideDown(function() {
          $('#pickerSearch').focus();
        });

        if (!firetable.pickerInit) {
          const makeRequest = async () => {
            twemoji.parse(document.getElementById("pickerResults"));
            return true;
          }

          makeRequest()
        }
      } else {
        $(this).removeClass('on');
        $("#emojiPicker").slideUp(function() {
          $('#pickerSearch').val('').trigger('change');
          $('#newchat').focus();
        });
      }
    });

    $("#morechats .butt").bind("click", function() {
      firetable.utilities.scrollToBottom();
    });

    $("#fire").bind("click", function() {
      ftapi.actions.sendChat(":fire:");
      $("#cloud_with_rain").removeClass("on");
      $("#fire").addClass("on");
    });

    $("#cloud_with_rain").bind("click", function() {
      ftapi.actions.sendChat(":cloud_with_rain:");
      $("#cloud_with_rain").addClass("on");
      $("#fire").removeClass("on");
    });


    //SETTINGS TOGGLES
    $('#badoopToggle').change(function() {
      if (this.checked) {
        firetable.debug && console.log("badoop on");
        localStorage["firetableBadoop"] = true;
        firetable.playBadoop = true;
      } else {
        firetable.debug && console.log("badoop off");
        localStorage["firetableBadoop"] = false;
        firetable.playBadoop = false;

      }
    });
    $('#showImagesToggle').change(function() {
      if (this.checked) {
        firetable.debug && console.log("show images on");
        localStorage["firetableShowImages"] = true;
        firetable.showImages = true;
      } else {
        firetable.debug && console.log("show images off");
        localStorage["firetableShowImages"] = false;
        firetable.showImages = false;

      }
    });
    $('#mediaDisableToggle').change(function() {
      if (this.checked) {
        firetable.debug && console.log("media disable on");
        localStorage["firetableDisableMedia"] = true;
        firetable.disableMediaPlayback = true;
        if (firetable.scLoaded) firetable.scwidget.pause();
        if (firetable.ytLoaded) player.stopVideo();
        firetable.ui.hidePlayerControls();
      } else {
        firetable.debug && console.log("media disable off");
        localStorage["firetableDisableMedia"] = false;
        firetable.disableMediaPlayback = false;
        firetable.ui.showPlayerControls();
        firetable.actions.reloadtrack();
      }
    });
    $('#showAvatarsToggle').change(function() {
      if (this.checked) {
        firetable.debug && console.log("show avatars on");
        localStorage["firetableShowAvatars"] = true;
        firetable.showAvatars = true;
        document.getElementById("actualChat").classList.remove("avatarsOff");
      } else {
        firetable.debug && console.log("show avatars off");
        localStorage["firetableShowAvatars"] = false;
        firetable.showAvatars = false;
        document.getElementById("actualChat").classList.add("avatarsOff");
      }
    });
    $(document).on('click', '.hideImage', function(e) {
      e.stopPropagation();
      e.preventDefault();
      $(this).closest('.chatText').toggleClass('hideImg');
    });
    $('#desktopNotifyMentionsToggle').change(function() {
      if (this.checked) {
        firetable.debug && console.log("dtnm on");
        localStorage["firetableDTNM"] = true;
        firetable.desktopNotifyMentions = true;
        if (Notification) {
          if (Notification.permission !== "granted") {
            Notification.requestPermission();
          }
        }
      } else {
        firetable.debug && console.log("dtnm off");
        localStorage["firetableDTNM"] = false;
        firetable.desktopNotifyMentions = false;

      }
    });

    $('input[type=radio][name=screenControl]').change(function() {
      firetable.debug && console.log('screen control:', this.value);
      localStorage["firetableScreenControl"] = this.value;
      firetable.screenControl = this.value;
      if (this.value == "off") {
        firetable.utilities.screenUp();
      } else if (this.value == "on") {
        firetable.utilities.screenDown();
      } else if (this.value == "sync") {
        if (firetable.screenSyncPos) {
          firetable.utilities.screenDown();
        } else {
          firetable.utilities.screenUp();
        }
      }
    });


    $("#stealpicker").change(function() {
      var dest = $("#stealpicker").val();
      if (dest == "-1") return;
      if (firetable.song.cid != 0) {
        var title = firetable.song.artist + " - " + firetable.song.title;
        $("#grab").removeClass('on');
        ftapi.actions.addToList(firetable.song.type, title, firetable.song.cid, dest);
        $("#stealContain").hide();
      }
    });

    $("#pldeleteButton").bind("click", function() {
      var val = $("#deletepicker").val();
      firetable.debug && console.log('playlist delete:', val);
      if (ftapi.users[ftapi.uid]) {
        if (ftapi.users[ftapi.uid].selectedList) {
          if (ftapi.users[ftapi.uid].selectedList == val) {
            $("#listpicker").val("0").change();
          }
        }
      }
      ftapi.actions.deleteList(val);
      $("#pdopt" + val).remove();
      $("#overlay").removeClass('show');
    });
    $("#plimportLauncher").bind("click", function() {
      $("#overlay").addClass('show');
      $(".modalThing").removeClass('show');
      $('#importPromptBox').addClass('show');
    });
    $("#pldeleteLauncher").bind("click", function() {
      ftapi.lookup.allLists(function(allPlaylists) {
        $("#deletepicker").html("");
        for (var key in allPlaylists) {
          if (allPlaylists.hasOwnProperty(key)) {
            $("#deletepicker").append("<option value=\"" + key + "\">" + allPlaylists[key].name + "</option>");
          }
        }
        $("#overlay").addClass('show');
        $(".modalThing").removeClass('show');
        $('#deletePromptBox').addClass('show');
      });
    });
    $("#pickerSearch").on("change paste keyup", function() {
      firetable.emojis.niceSearch($("#pickerSearch").val());
    });
    $("#queueFilter").on("change paste keyup", function() {
      firetable.actions.filterQueue($("#queueFilter").val());
    });
    $("#pickerResults").on("click", "span", function() {
      try {
        var oldval = $("#newchat").val();
        var newval = oldval + ":" + $(this).attr("title").trim() + ":";
        $("#newchat").focus().val(newval);

      } catch (s) {}
    });

    firetable.ui.loginEventsInit();

    $("#ytsearchSelect").bind("click", function() {
      $("#scsearchSelect").removeClass("on");
      $("#ytsearchSelect").addClass("on");
      firetable.searchSelectsChoice = 1;
    });
    $("#scsearchSelect").bind("click", function() {
      $("#ytsearchSelect").removeClass("on");
      $("#scsearchSelect").addClass("on");
      firetable.searchSelectsChoice = 2;
    });
    $("#ytimportchoice").bind("click", function() {
      firetable.debug && console.log("yt import");
      firetable.importSelectsChoice = 1;
    });
    $("#scimportchoice").bind("click", function() {
      firetable.debug && console.log("sc import");
      firetable.importSelectsChoice = 2;
    });
    $("#dtimportchoice").bind("click", function() {
      firetable.debug && console.log("dt import");
      firetable.importSelectsChoice = 3;
    });
    $(document).on("keyup", ".tagMachine", function(e) {
      if (e.which == 13) {
        var songKey = $(this).closest('.tagPromptBox').prev('.pvbar').attr('data-key');
        if (firetable.songToEdit) {
          var val = $(this).val();
          if (val != "") {
            var obj = firetable.songToEdit;
            ftapi.actions.editTrackTag(obj.key, obj.song.cid, val);
            firetable.songToEdit = null;
            $(this).closest('.editing').removeClass('editing').next('.tagPromptBox').remove();
          }
        }
      }
    });
    $("#changeUsername").bind("keyup", function(e) {
      if (e.which == 13) {
        var oldDjName = ftapi.users[ftapi.uid].username;
        var newDjName = $("#changeUsername").val();
        $("#usernameResponse").html("");
        if (newDjName != "") {
          // try to change name
          ftapi.actions.changeName(newDjName, function(error) {
            if (error) {
              alert(error);
              $("#usernameResponse").text(error);
            } else {
              $("#usernameResponse").text("Great job! Your name is now " + newDjName);
              $("#loggedInName").text(newDjName);
            }
          });
        }
      }
    });
    $('#dubtrackimportfile').bind('change', firetable.ui.dubtrackImportFileSelect);
    $("#supercopSearch").bind("keyup", function(e) {
      if (e.which == 13) {
        var val = $("#supercopSearch").val();
        $("#supercopResponse").html("");
        if (val != "") {
          //begin user search...
          ftapi.lookup.userByName(val, function(person) {
            //check search results
            if (person) {
              //found something!
              if (!person.supermod) {
                ftapi.actions.banUser(person.userid);
                $("#supercopResponse").html(person.username + " suspended.");

              } else {
                $("#supercopResponse").text("Can not suspend that (or any) supermod.");
              }
            } else {
              $("#supercopResponse").text(val + " not found...");
            }
          });
        }
      }
    });
    $("#importSources .tab").bind("click", function(e) {
      var searchFrom = firetable.importSelectsChoice;
      if (searchFrom == 3) {
        $("#importDubContent").show();
        $("#importContent").hide();
      } else {
        $("#importDubContent").hide();
        $("#importContent").show();
      }
      $(this).siblings().removeClass('on');
      $(this).addClass('on');
    });
    $("#plMachine").bind("keyup", function(e) {
      if (e.which == 13) {
        var val = $("#plMachine").val();
        if (val != "") {
          $("#importResults").html("");
          $("#plMachine").val("");
          var searchFrom = firetable.importSelectsChoice;
          if (searchFrom == 1) {
            var listID;
            var directLink = false;
            //see if this is a particular list's url...
            if (val.match(/youtube.com\/watch/) || val.match(/youtube.com\/playlist/)) {
              function getQueryStringValue(str, key) {
                return unescape(str.replace(new RegExp("^(?:.*[&\\?]" + escape(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
              }
              listID = getQueryStringValue(val, "list");
              if (listID) directLink = true;
            }

            if (directLink) {
              function keyWordsearch() {
                gapi.client.setApiKey(ftconfigs.youtubeKey);
                gapi.client.load('youtube', 'v3', function() {
                  makeRequest();
                });
              }

              function makeRequest() {
                var request = gapi.client.youtube.playlists.list({
                  id: listID,
                  part: 'snippet'
                });
                request.execute(function(response) {
                  if (response.result) {
                    if (response.result.items) {
                      if (response.result.items.length === 1) {
                        var item = response.result.items[0];
                        vidTitle = item.snippet.title;
                        $("#importResults").append("<div class=\"importResult\"><div class=\"imtxt\">" + item.snippet.title + " by " + item.snippet.channelTitle + "</div><a target=\"_blank\" href=\"https://www.youtube.com/playlist?list=" + listID + "\" class=\"importLinkCheck\"><i class=\"material-icons\">&#xE250;</i></a> <i role=\"button\" onclick=\"firetable.actions.importList('" + listID + "', '" + firetable.utilities.htmlEscape(item.snippet.title) + "', 1)\" class=\"material-icons\" title=\"Import\">&#xE02E;</i></div>");
                      } else {
                        // no result
                      }
                    }
                  }
                })
              }
              keyWordsearch();
            } else {
              //youtube
              function keyWordsearch() {
                gapi.client.setApiKey(ftconfigs.youtubeKey);
                gapi.client.load('youtube', 'v3', function() {
                  makeRequest();
                });
              }

              function makeRequest() {
                var request = gapi.client.youtube.search.list({
                  q: val,
                  type: 'playlist',
                  part: 'snippet',
                  maxResults: 15
                });
                request.execute(function(response) {
                  var srchItems = response.result.items;
                  firetable.debug && console.log('import search results:', response);
                  $.each(srchItems, function(index, item) {
                    vidTitle = item.snippet.title;
                    $("#importResults").append("<div class=\"importResult\"><div class=\"imtxt\">" + item.snippet.title + " by " + item.snippet.channelTitle + "</div><a target=\"_blank\" href=\"https://www.youtube.com/playlist?list=" + item.id.playlistId + "\" class=\"importLinkCheck\"><i class=\"material-icons\">&#xE250;</i></a> <i role=\"button\" onclick=\"firetable.actions.importList('" + item.id.playlistId + "', '" + firetable.utilities.htmlEscape(item.snippet.title) + "', 1)\" class=\"material-icons\" title=\"Import\">&#xE02E;</i></div>");
                  })
                })
              }
              keyWordsearch();
            }

          } else if (searchFrom == 2) {
            var listData;
            var directLink = false;
            //see if this is a particular list's url...
            console.log(val);
            if (val.match(/.*\/\/soundcloud\.com\/.*\/sets\/.*/)) {
              firetable.actions.resolveSCLink(val, function(item) {
                if (item) {
                  if (item.sharing == "public" && item.kind == "playlist") {
                    $("#importResults").append("<div class=\"importResult\"><div class=\"imtxt\">" + item.title + " by " + item.user.username + " (" + item.track_count + " songs)</div><a target=\"_blank\" href=\"" + item.permalink_url + "\" class=\"importLinkCheck\"><i class=\"material-icons\">&#xE250;</i></a> <i role=\"button\" onclick=\"firetable.actions.importList('" + item.id + "', '" + firetable.utilities.htmlEscape(item.title) + "', 2)\" class=\"material-icons\" title=\"Import\">&#xE02E;</i></div>");
                  }
                }
              });
              //var getList = SC.resolve(val).then(finishUp);

            } else {
              //cloud sound world dot com
              SC.get('/playlists', {
                q: val
              }).then(function(lists) {
                for (var i = 0; i < lists.length; i++) {
                  var item = lists[i];
                  if (item.sharing == "public") {
                    $("#importResults").append("<div class=\"importResult\"><div class=\"imtxt\">" + item.title + " by " + item.user.username + " (" + item.track_count + " songs)</div><a target=\"_blank\" href=\"" + item.permalink_url + "\" class=\"importLinkCheck\"><i class=\"material-icons\">&#xE250;</i></a> <i role=\"button\" onclick=\"firetable.actions.importList('" + item.id + "', '" + firetable.utilities.htmlEscape(item.title) + "', 2)\" class=\"material-icons\" title=\"Import\">&#xE02E;</i></div>");
                  }
                }
              });
            }
          }
        }
      }
    });
    var $searchItemTemplate = $('#searchResults .pvbar').remove();
    $("#qsearch").bind("keyup", function(e) {
      if (e.which == 13) {
        var txt = $("#qsearch").val();
        if (firetable.searchSelectsChoice == 1) {
          var showResults = function(response) {
            firetable.debug && console.log('queue search:', response);
            //  $("#qsearch").val("");
            $('#searchResults').html("");

            if (firetable.preview) {
              if (firetable.preview.slice(0, 5) == "ytcid" || firetable.preview.slice(0, 5) == "sccid") {
                $("#pv" + firetable.preview).html("&#xE037;");
                clearTimeout(firetable.ptimeout);
                firetable.ptimeout = null;
                $("#pvbar" + firetable.preview).css("background-image", "none");
                clearInterval(firetable.movePvBar);
                firetable.movePvBar = null;
                firetable.preview = false;
                //start regular song
                var nownow = Date.now();
                var timeSince = nownow - firetable.song.started;
                if (timeSince <= 0) timeSince = 0;

                var secSince = Math.floor(timeSince / 1000);
                var timeLeft = firetable.song.duration - secSince;
                if (firetable.song.type == 1) {
                  if (!firetable.preview) {
                    if (firetable.scLoaded) firetable.scwidget.pause();
                    if (!firetable.disableMediaPlayback) player.loadVideoById(firetable.song.cid, secSince, "large");
                  }
                } else if (firetable.song.type == 2) {
                  if (!firetable.preview) {
                    if (firetable.ytLoaded) player.stopVideo();
                    firetable.scSeek = timeSince;
                    if (!firetable.disableMediaPlayback) firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
                      auto_play: true
                    });
                  }
                }
              }
            }
            var srchItems = response.result.items;
            $.each(srchItems, function(index, item) {
              console.log(item);
              var thecid;
              if (item.kind == "youtube#searchResult") {
                thecid = item.id.videoId;
              } else if (item.kind == "youtube#video") {
                thecid = item.id;
              }
              vidtitle = item.snippet.title;
              var yargo = item.snippet.title.split(" - ");
              var sartist = yargo[0];
              var stitle = yargo[1];
              if (!stitle) {
                // yt title not formatted artist - title. use uploader name instead as artist
                stitle = sartist;
                sartist = item.snippet.channelTitle.replace(" - Topic", "");
              }
              vidTitle = sartist + " - " + stitle;
              var pkey = "ytcid" + thecid;
              var $srli = $searchItemTemplate.clone();
              $srli.attr('id', "pvbar" + pkey);
              $srli.attr("data-key", pkey);
              $srli.attr("data-cid", thecid);
              $srli.find('.previewicon').attr('id', "pv" + pkey).on('click', function() {
                firetable.actions.pview($(this).closest('.pvbar').attr('data-key'), true, 1);
              });
              $srli.find('.listwords').html(vidTitle);
              $srli.find('.queuetrack').on('click', function() {
                firetable.actions.queueTrack(
                  $(this).closest('.pvbar').attr('data-cid'),
                  firetable.utilities.htmlEscape($(this).closest('.pvbar').find('.listwords').text()),
                  1
                );
              });
              $("#searchResults").append($srli);
            })
          };
          var directLink = false;
          var thecid = false;
          //see if this is a particular track's url...
          if (txt.match(/youtube.com\/watch/)) {
            function getQueryStringValue(str, key) {
              return unescape(str.replace(new RegExp("^(?:.*[&\\?]" + escape(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
            }
            thecid = getQueryStringValue(txt, "v");
            if (thecid) directLink = true;
          }
          if (directLink) {
            firetable.debug && console.log("direct yt link found");

            function keyWordsearch() {
              gapi.client.setApiKey(ftconfigs.youtubeKey);
              gapi.client.load('youtube', 'v3', function() {
                makeRequest();
              });
            }

            function makeRequest() {
              var request = gapi.client.youtube.videos.list({
                id: thecid,
                part: 'snippet',
                maxResults: 1
              });
              request.execute(function(response) {
                console.log(response);
                showResults(response);
              })
            }
            keyWordsearch();
          } else {
            function keyWordsearch() {
              gapi.client.setApiKey(ftconfigs.youtubeKey);
              gapi.client.load('youtube', 'v3', function() {
                makeRequest();
              });
            }

            function makeRequest() {
              var q = $('#qsearch').val();
              $('#searchResults').html("Searching...");

              var request = gapi.client.youtube.search.list({
                q: q,
                type: 'video',
                part: 'snippet',
                maxResults: 15
              });
              request.execute(function(response) {
                showResults(response);
              })
            }
            keyWordsearch();
          }
        } else if (firetable.searchSelectsChoice == 2) {
          var q = $('#qsearch').val();
          var showResults = function(tracks) {
            firetable.debug && console.log('sc tracks:', tracks);
            // $("#qsearch").val("");
            $('#searchResults').html("");

            if (firetable.preview) {
              if (firetable.preview.slice(0, 5) == "ytcid" || firetable.preview.slice(0, 5) == "sccid") {
                $("#pv" + firetable.preview).html("&#xE037;");
                clearTimeout(firetable.ptimeout);
                firetable.ptimeout = null
                $("#pvbar" + firetable.preview).css("background-image", "none");
                clearInterval(firetable.movePvBar);
                firetable.movePvBar = null;
                firetable.preview = false;
                //start regular song
                var nownow = Date.now();
                var timeSince = nownow - firetable.song.started;
                if (timeSince <= 0) timeSince = 0;

                var secSince = Math.floor(timeSince / 1000);
                var timeLeft = firetable.song.duration - secSince;
                if (firetable.song.type == 1) {
                  if (!firetable.preview) {
                    firetable.scwidget.pause();
                    if (!firetable.disableMediaPlayback) player.loadVideoById(firetable.song.cid, secSince, "large");
                  }
                } else if (firetable.song.type == 2) {
                  if (!firetable.preview) {
                    if (firetable.ytLoaded) player.stopVideo();
                    firetable.scSeek = timeSince;
                    if (!firetable.disableMediaPlayback) firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
                      auto_play: true
                    });
                  }
                }
              }
            }
            var srchItems = tracks;
            $.each(srchItems, function(index, item) {
              vidTitle = item.title;
              var yargo = item.title.split(" - ");
              var sartist = yargo[0];
              var stitle = yargo[1];
              if (!stitle) {
                stitle = sartist;
                sartist = item.user.username;
              }
              vidTitle = sartist + " - " + stitle;
              var pkey = "sccid" + item.id;
              var $srli = $searchItemTemplate.clone();
              $srli.attr('id', "pvbar" + pkey);
              $srli.attr("data-key", pkey);
              $srli.attr("data-cid", item.id);
              $srli.find('.previewicon').attr('id', "pv" + pkey).on('click', function() {
                firetable.actions.pview(
                  $(this).closest('.pvbar').attr('data-key'),
                  true,
                  2
                );
              });
              $srli.find('.listwords').html(vidTitle);
              $srli.find('.queuetrack').on('click', function() {
                firetable.actions.queueTrack(
                  $(this).closest('.pvbar').attr('data-cid'),
                  firetable.utilities.htmlEscape($(this).closest('.pvbar').find('.listwords').text()),
                  2
                );
              });
              $("#searchResults").append($srli);
            })
          }
          var directLink = false;
          if (q.match(/:\/\/soundcloud\.com\//)) {
            directLink = true;
          }
          $('#searchResults').html("Searching...");
          if (directLink) {
            firetable.debug && console.log("sc direct link found");
            firetable.actions.resolveSCLink(q, function(item) {
              var items = [];
              if (item.kind == "track") items.push(item);
              showResults(items);
            });
            //var getList = SC.resolve(q).then(finishUp);
          } else {
            SC.get('/tracks', {
              q: q
            }).then(function(tracks) {
              showResults(tracks);
            });
          }
        }
      }
    });
    $("#newchat").bind("keypress", function(e) {
      firetable.debug && console.log('chat key', e.key);
      if (e.key == "Enter") {
        var txt = $("#newchat").val();
        if (txt == "") return;
        var matches = txt.match(/^(?:[\/])(\w+)\s*(.*)/i);
        if (txt == ":fire:" || txt == "🔥") {
          $("#cloud_with_rain").removeClass("on");
          $("#fire").addClass("on");
        } else if (txt == ":cloud_with_rain:" || txt == "🌧") {
          $("#cloud_with_rain").addClass("on");
          $("#fire").removeClass("on");
        }
        if (matches) {
          var command = matches[1].toLowerCase();
          var args = matches[2];
          if (command == "mod") {
            var personToMod = firetable.actions.uidLookup(args);
            if (personToMod) {
              ftapi.actions.modUser(personToMod);
            }
          } else if (command == "unmod") {
            var personToMod = firetable.actions.uidLookup(args);
            if (personToMod) {
              ftapi.actions.unmodUser(personToMod);
            }
          } else if (command == "block") {
            if (args) {
              ftapi.actions.blockUser(args, function(response) {
                console.log(response);
                firetable.actions.localChatResponse(response);
              });
            }
          } else if (command == "unblock") {
            if (args) {
              ftapi.actions.unblockUser(args, function(response) {
                console.log(response);

                firetable.actions.localChatResponse(response);
              });
            }
          } else if (command == "hot") {
            ftapi.actions.sendChat(":fire:");
            $("#cloud_with_rain").removeClass("on");
            $("#fire").addClass("on");
          } else if (command == "storm") {
            ftapi.actions.sendChat(":cloud_with_rain:");
            $("#cloud_with_rain").addClass("on");
            $("#fire").removeClass("on");
          } else if (command == "shrug") {
            var thingtosay = "¯\\_(ツ)_/¯";
            if (args) thingtosay = args + " ¯\\_(ツ)_/¯";
            ftapi.actions.sendChat(thingtosay);
          } else if (command == "tableflip") {
            var thingtosay = "(╯°□°）╯︵ ┻━┻";
            if (args) thingtosay = args + " (╯°□°）╯︵ ┻━┻";
            ftapi.actions.sendChat(thingtosay);
          } else if (command == "unflip") {
            var thingtosay = "┬─┬ ノ( ゜-゜ノ)";
            if (args) thingtosay = args + " ┬─┬ ノ( ゜-゜ノ)";
            ftapi.actions.sendChat(thingtosay);
          }
        } else {
          ftapi.actions.sendChat(txt);
        }
        $("#newchat").val("");
        $("#emojiPicker").slideUp();
        $("#pickEmoji").removeClass("on");
        firetable.utilities.exitAtLand();
      } else if (e.key == "@") { // open the door to @ land
        if (firetable.atLand) { // double @@
          firetable.utilities.exitAtLand();
        } else { // first step into @ land
          firetable.utilities.initAtLand();
          for (var user of firetable.atUsersFiltered) {
            $('#atPicker').addClass('show');
            $('<div class="atPickerThing"><button class="butt graybutt" role="button">@' + user + '</button></div>').appendTo('#atPicker');
          }
        }
      } else if (firetable.atLand) { // we're in @ land
        if (e.key == " " || e.key == "Spacebar") { // we've got what we want
          firetable.utilities.exitAtLand();
        } else if (!e.key.match(/[0-9a-zA-Z_]/)) { // not possibly a characer from a name
          firetable.atString += e.key;
          $('#atPicker').html('');
          $('<div class="atPickerThing"><i>Usernames cannot contain "' + e.key + '"</i></div>').appendTo('#atPicker');
        } else { // we're still in @ land
          firetable.atString += e.key;
          firetable.utilities.updateAtLand();
        }
      }
    });
    $("#newchat").bind("keyup", function(e) {
      if (firetable.atLand) { // we're in @ land
        if (e.key == "Backspace") {
          if (!firetable.atString) { // deleting the @, exit @ land
            firetable.utilities.exitAtLand();
          } else { // still got someone we're lookin for
            firetable.atString = firetable.atString.slice(0, -1);
            firetable.utilities.updateAtLand();
          }
        } else if (e.key == "ArrowUp") { // i see my @, go up!
          $('#atPicker .butt:last').focus();
        } else if (e.key == "ArrowDown") { // i see my @, go down!
          $('#atPicker .butt:first').focus();
        }
      }
    });
    $("#newchat").bind("keydown", function(e) {
      if (e.key == "Tab") {
        if (firetable.atUsersFiltered.length === 1) {
          $("#newchat").one("blur", function(e) {
            $("#newchat").focus().val($("#newchat").val());
          });
          firetable.utilities.chooseAt(firetable.atUsersFiltered[0]);
        } else {
          firetable.utilities.exitAtLand();
        }
      }
    });
    $(document).on('click', '#atPicker .butt', function(e) {
      e.preventDefault();
      firetable.utilities.chooseAt($(this).text().replace("@", ""));
      setTimeout(() => {
        var tempText = $("#newchat").val();
        $('#newchat').focus().val('');
        $('#newchat').val(tempText);
      }, 250);
    });
    $(document).on('keyup', '#atPicker .butt:focus', function(e) {
      if (e.key == "ArrowUp") {
        if ($('#atPicker .butt:focus').parent().prev().length) {
          $('#atPicker .butt:focus').parent().prev().find('.butt').focus();
        } else {
          $('#atPicker .butt:last').focus();
        }
      } else if (e.key == "ArrowDown") {
        if ($('#atPicker .butt:focus').parent().next().length) {
          $('#atPicker .butt:focus').parent().next().find('.butt').focus();
        } else {
          $('#atPicker .butt:first').focus();
        }
      }
    });

    ftapi.events.on("colorsChanged", function(data) {
      firetable.debug && console.log("COLOR CHANGE!", data);

      firetable.color = data.color;
      firetable.countcolor = data.txt;
      if (data.color == "#fff" || data.color == "#7f7f7f") {
        firetable.color = firetable.orange;
        firetable.countcolor = "#fff";
        $("#stage").css("background-color", "#fff");
      } else {
        $("#stage").css("background-color", data.color);
      }
      /*
      if (firetable.countcolor == "#fff"){
        firetable.countcolor = "#ffffffc9";
      } else if (firetable.countcolor == "#000"){
        firetable.debug && console.log("a")
        firetable.countcolor = "#000000c9";
      }
      $("#stage").css("color", firetable.countcolor);
      */
      $('.customColorStyles').remove();

      $('.festiveLights').remove();

      var colorThing = firetable.utilities.hexToRGB(firetable.color);
      $("head").append("<style class='customColorStyles'>:focus { box-shadow: 0 0 0.5rem " + firetable.color + "; } .djActive, #addToQueueBttn, .butt:not(.graybutt), .ui-slider-horizontal .ui-slider-range-min { background-color: " + firetable.color + "; color: " + firetable.countcolor + "; } .iconbutt.on { color: " + firetable.color + "; border-bottom: 1px solid " + firetable.color + "66; box-shadow: inset 0 0 1rem " + firetable.color + "33; } .simplebar-scrollbar:before { background: " + firetable.color + "; }</style>");

      if (firetable.lights) {
        var style = "<style class='festiveLights'>.lightrope { text-align: center; white-space: nowrap; overflow: hidden; position: absolute; z-index: 1; margin: -6px 0 0 0; padding: 0; pointer-events: none; width: 100%; z-index: 55; }ul.lightrope li{position: relative; list-style: none; margin: 0; padding: 0; display: block; width: 6px; height: 14px; border-radius: 50%; margin: 10px; display: inline-block; background: #111;} .lightrope li span { position: relative; animation-fill-mode: both; animation-iteration-count: infinite; list-style: none; margin: 0; padding: 0; display: block; width: 6px; height: 14px; border-radius: 50%; display: inline-block; background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); animation-name: flash-1; animation-duration: 2s; } .lightrope li:nth-child(2n+1) span { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.5); animation-name: flash-2; animation-duration: 0.4s; } .lightrope li:nth-child(4n+2) span { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); animation-name: flash-3; animation-duration: 1.1s; } .lightrope li:nth-child(odd) span { animation-duration: 1.8s; } .lightrope li:nth-child(3n+1) span { animation-duration: 1.4s; } .lightrope li :before { content: \"\"; position: absolute; background: #4e4e4e; width: 4px; height: 4.6666666667px; border-radius: 3px; top: -2.3333333333px; left: 1px; } .lightrope li:after { content: \"\"; top: -7px; left: 3px; position: absolute; width: 32px; height: 9.3333333333px; border-bottom: solid #4e4e4e 2px; border-radius: 50%; } .lightrope li:last-child:after { content: none; } .lightrope li:first-child { margin-left: -20px; } @keyframes flash-1 { 0%, 100% { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); } 50% { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.4); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.2); } } @keyframes flash-2 { 0%, 100% { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); } 50% { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.4); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.2); } } @keyframes flash-3 { 0%, 100% { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 1); } 50% { background: rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.4); box-shadow: 0px 2.3333333333px 12px 1.5px rgba(" + colorThing.r + "," + colorThing.g + "," + colorThing.b + ", 0.2); } }</style>";
        $("head").append(style);
      }

    });
  },
  usertab1: function() {
    $("#allusersWrap").css("display", "block");
    $("#justwaitWrap").css("display", "none");
    $("#usertabs").find(".on").removeClass("on");
    $("#label1").addClass("on");
  },
  usertab2: function() {
    $("#usertabs").find(".on").removeClass("on");
    $("#label2").addClass("on");
    $("#allusersWrap").css("display", "none");
    $("#justwaitWrap").css("display", "block");

  },
  LinkGrabber: {
    textarea: null,

    /* Textarea Management */

    attach_ta: function(event) {
      if (!$.contains(document.getElementById("queuelist"), event.target)) return;
      if (firetable.ui.LinkGrabber.textarea != null) return;

      var textarea = firetable.ui.LinkGrabber.textarea = document.createElement("textarea");
      textarea.setAttribute("style", "position: fixed; width: 100%; margin: 0; top: 0; bottom: 0; right: 0; left: 0; z-index: 99999999");
      textarea.style.opacity = "0.000000000000000001";

      var body = document.getElementsByTagName("body")[0];
      body.appendChild(textarea);

      textarea.oninput = firetable.ui.LinkGrabber.evt_got_link;
    },

    detach_ta: function() {
      if (firetable.ui.LinkGrabber.textarea == null) return;
      var textarea = firetable.ui.LinkGrabber.textarea;

      textarea.parentNode.removeChild(textarea);
      firetable.ui.LinkGrabber.textarea = null;
    },

    /* Event Handlers */

    evt_drag_over: function(event) {
      firetable.ui.LinkGrabber.attach_ta(event); //Create TA overlay
    },

    evt_got_link: function() {
      /* THIS IS WHERE WE HANDLE THE RECEIVED LINK */

      var link = firetable.ui.LinkGrabber.textarea.value;
      firetable.debug && console.log("NEW LINK RECEIVED VIA THE DRAGON'S DROP. " + link);
      firetable.actions.queueFromLink(link);

      firetable.ui.LinkGrabber.detach_ta();
    },

    evt_drag_out: function(e) {
      if (e.target == firetable.ui.LinkGrabber.textarea) firetable.ui.LinkGrabber.detach_ta();
    },

    /* Start/Stop */

    start: function() {
      document.addEventListener("dragover", firetable.ui.LinkGrabber.evt_drag_over, false);
      document.addEventListener("dragenter", firetable.ui.LinkGrabber.evt_drag_over, false);

      document.addEventListener("mouseup", firetable.ui.LinkGrabber.evt_drag_out, false);
      document.addEventListener("dragleave", firetable.ui.LinkGrabber.evt_drag_out, false);
    },

    stop: function() {
      document.removeEventListener("dragover", firetable.ui.LinkGrabber.evt_drag_over);
      document.removeEventListener("dragenter", firetable.ui.LinkGrabber.evt_drag_over);

      document.removeEventListener("mouseup", firetable.ui.LinkGrabber.evt_drag_out);
      document.removeEventListener("dragleave", firetable.ui.LinkGrabber.evt_drag_out);

      firetable.ui.LinkGrabber.detach_ta();
    }
  }


}



let isLoaded = false;
let glitch;
let imgSrc = '';

function setup(useThis) {
  if (!useThis) useThis = firetable.scImg;
  background(0);
  let cnv = createCanvas($('#djStage').outerWidth(), $('#djStage').outerHeight());
  cnv.parent('scScreen');
  loadImage(useThis, function(img) {
    glitch = new Glitch(img);
    isLoaded = true;
    var $can = $('#scScreen canvas');
    var canrat = $can.width() / $can.height();
    $can.data('ratio', canrat);
  });
}

function draw() {
  clear();
  background(0);

  if (isLoaded) {
    glitch.show();
  }

  // fill(255, 255, 255);
  // textSize(14);
  // text('FPS: ' + floor(frameRate()), 20, 30);

}

class Glitch {
  constructor(img) {
    this.channelLen = 4;
    this.imgOrigin = img;
    this.imgOrigin.loadPixels();
    this.copyData = [];
    this.flowLineImgs = [];
    this.shiftLineImgs = [];
    this.shiftRGBs = [];
    this.scatImgs = [];
    this.throughFlag = true;
    this.copyData = new Uint8ClampedArray(this.imgOrigin.pixels);

    // flow line
    for (let i = 0; i < 1; i++) {
      let o = {
        pixels: null,
        t1: floor(random(0, 1000)),
        speed: floor(random(4, 24)),
        randX: floor(random(24, 80))
      };
      this.flowLineImgs.push(o);
    }

    // shift line
    for (let i = 0; i < 6; i++) {
      let o = null;
      this.shiftLineImgs.push(o);
    }

    // shift RGB
    for (let i = 0; i < 1; i++) {
      let o = null;
      this.shiftRGBs.push(o);
    }

    // scat imgs
    for (let i = 0; i < 3; i++) {
      let scatImg = {
        img: null,
        x: 0,
        y: 0
      };
      this.scatImgs.push(scatImg);
    }
  }

  replaceData(destImg, srcPixels) {
    for (let y = 0; y < destImg.height; y++) {
      for (let x = 0; x < destImg.width; x++) {
        let r, g, b, a;
        let index;
        index = (y * destImg.width + x) * this.channelLen;
        r = index;
        g = index + 1;
        b = index + 2;
        a = index + 3;
        destImg.pixels[r] = srcPixels[r];
        destImg.pixels[g] = srcPixels[g];
        destImg.pixels[b] = srcPixels[b];
        destImg.pixels[a] = srcPixels[a];
      }
    }
    destImg.updatePixels();
  }

  flowLine(srcImg, obj) {

    let destPixels,
      tempY;
    destPixels = new Uint8ClampedArray(srcImg.pixels);
    obj.t1 %= srcImg.height;
    obj.t1 += obj.speed;
    //tempY = floor(noise(obj.t1) * srcImg.height);
    tempY = floor(obj.t1);
    for (let y = 0; y < srcImg.height; y++) {
      if (tempY === y) {
        for (let x = 0; x < srcImg.width; x++) {
          let r, g, b, a;
          let index;
          index = (y * srcImg.width + x) * this.channelLen;
          r = index;
          g = index + 1;
          b = index + 2;
          a = index + 3;
          destPixels[r] = srcImg.pixels[r] + obj.randX;
          destPixels[g] = srcImg.pixels[g] + obj.randX;
          destPixels[b] = srcImg.pixels[b] + obj.randX;
          destPixels[a] = srcImg.pixels[a];
        }
      }
    }
    return destPixels;
  }

  shiftLine(srcImg) {

    let offsetX;
    let rangeMin, rangeMax;
    let destPixels;
    let rangeH;

    destPixels = new Uint8ClampedArray(srcImg.pixels);
    rangeH = srcImg.height;
    rangeMin = floor(random(0, rangeH));
    rangeMax = rangeMin + floor(random(1, rangeH - rangeMin));
    offsetX = this.channelLen * floor(random(-40, 40));

    for (let y = 0; y < srcImg.height; y++) {
      if (y > rangeMin && y < rangeMax) {
        for (let x = 0; x < srcImg.width; x++) {
          let r, g, b, a;
          let r2, g2, b2, a2;
          let index;

          index = (y * srcImg.width + x) * this.channelLen;
          r = index;
          g = index + 1;
          b = index + 2;
          a = index + 3;
          r2 = r + offsetX;
          g2 = g + offsetX;
          b2 = b + offsetX;
          destPixels[r] = srcImg.pixels[r2];
          destPixels[g] = srcImg.pixels[g2];
          destPixels[b] = srcImg.pixels[b2];
          destPixels[a] = srcImg.pixels[a];
        }
      }
    }
    return destPixels;
  }

  shiftRGB(srcImg) {

    let randR, randG, randB;
    let destPixels;
    let range;

    range = 16;
    destPixels = new Uint8ClampedArray(srcImg.pixels);
    randR = (floor(random(-range, range)) * srcImg.width + floor(random(-range, range))) * this.channelLen;
    randG = (floor(random(-range, range)) * srcImg.width + floor(random(-range, range))) * this.channelLen;
    randB = (floor(random(-range, range)) * srcImg.width + floor(random(-range, range))) * this.channelLen;

    for (let y = 0; y < srcImg.height; y++) {
      for (let x = 0; x < srcImg.width; x++) {
        let r, g, b, a;
        let r2, g2, b2, a2;
        let index;

        index = (y * srcImg.width + x) * this.channelLen;
        r = index;
        g = index + 1;
        b = index + 2;
        a = index + 3;
        r2 = (r + randR) % srcImg.pixels.length;
        g2 = (g + randG) % srcImg.pixels.length;
        b2 = (b + randB) % srcImg.pixels.length;
        destPixels[r] = srcImg.pixels[r2];
        destPixels[g] = srcImg.pixels[g2];
        destPixels[b] = srcImg.pixels[b2];
        destPixels[a] = srcImg.pixels[a];
      }
    }

    return destPixels;
  }

  getRandomRectImg(srcImg) {
    let startX;
    let startY;
    let rectW;
    let rectH;
    let destImg;
    startX = floor(random(0, srcImg.width - 30));
    startY = floor(random(0, srcImg.height - 50));
    rectW = floor(random(30, srcImg.width - startX));
    rectH = floor(random(1, 50));
    destImg = srcImg.get(startX, startY, rectW, rectH);
    destImg.loadPixels();
    return destImg;
  }

  show() {

    // restore the original state
    this.replaceData(this.imgOrigin, this.copyData);

    // sometimes pass without effect processing
    let n = floor(random(100));
    if (n > 75 && this.throughFlag) {
      this.throughFlag = false;
      setTimeout(() => {
        this.throughFlag = true;
      }, floor(random(200, 1500)));
    }
    if (!this.throughFlag) {
      push();
      translate((width - this.imgOrigin.width) / 2, (height - this.imgOrigin.height) / 2);
      image(this.imgOrigin, 0, 0);
      pop();
      return;
    }

    // flow line
    this.flowLineImgs.forEach((v, i, arr) => {
      arr[i].pixels = this.flowLine(this.imgOrigin, v);
      if (arr[i].pixels) {
        this.replaceData(this.imgOrigin, arr[i].pixels);
      }
    })

    // shift line
    this.shiftLineImgs.forEach((v, i, arr) => {
      if (floor(random(100)) > 50) {
        arr[i] = this.shiftLine(this.imgOrigin);
        this.replaceData(this.imgOrigin, arr[i]);
      } else {
        if (arr[i]) {
          this.replaceData(this.imgOrigin, arr[i]);
        }
      }
    })

    // shift rgb
    this.shiftRGBs.forEach((v, i, arr) => {
      if (floor(random(100)) > 65) {
        arr[i] = this.shiftRGB(this.imgOrigin);
        this.replaceData(this.imgOrigin, arr[i]);
      }
    })

    push();
    translate((width - this.imgOrigin.width) / 2, (height - this.imgOrigin.height) / 2);
    image(this.imgOrigin, 0, 0);
    pop();

    // scat image
    this.scatImgs.forEach((obj) => {
      push();
      translate((width - this.imgOrigin.width) / 2, (height - this.imgOrigin.height) / 2);
      if (floor(random(100)) > 80) {
        obj.x = floor(random(-this.imgOrigin.width * 0.3, this.imgOrigin.width * 0.7));
        obj.y = floor(random(-this.imgOrigin.height * 0.1, this.imgOrigin.height));
        obj.img = this.getRandomRectImg(this.imgOrigin);
      }
      if (obj.img) {
        image(obj.img, obj.x, obj.y);
      }
      pop();
    })

  }

}

if (!firetable.started) firetable.init();
