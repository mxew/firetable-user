var firetable = {
  started: false,
  loggedIn: false,
  uid: null,
  uname: null,
  pvCount: 0,
  playdex: 0,
  users: {},
  queue: false,
  preview: false,
  movePvBar: null,
  moveBar: null,
  song: null,
  playBadoop: true,
  sbhowImages: false,
  screenControl: "sync",
  screenSyncPos: false,
  scSeek: false,
  desktopNotifyMentions: false,
  orange: "#F4810B",
  color: "#F4810B",
  countcolor: "#fff",
  presenceDetectEvent: null,
  presenceDetectRef: null,
  connectedRef: null,
  ytLoaded: null,
  scLoaded: null,
  selectedListThing: "0",
  queueBind: null,
  parser: null,
  songTagToEdit: null,
  scwidget: null,
  searchSelectsChoice: 1,
  importSelectsChoice: 1,
  queueRef: null,
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
  debug: true
}

firetable.version = "01.01.00";
var player, $playlistItemTemplate;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('playerArea', {
    width: $('#djStage').outerHeight()*1.7777,
    height: $('#djStage').outerHeight(),
    playerVars: {
      'autoplay': 1,
      'controls': 0
    },
    videoId: '0',
    events: {
      onReady: initialize,
      onStateChange: function(){
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
    if (timeSince <= 0 ) timeSince = 0;

    var secSince = Math.floor(timeSince / 1000);
    var timeLeft = data.duration - secSince;
    if (data.type == 1) {
      if (!firetable.preview) {
        player.loadVideoById(data.cid, secSince, "large")
      }
    }
  }


}

function onPlayerStateChange(event) {
  //state changed thanks
}

firetable.init = function() {
  console.log("Yo sup welcome to firetable my name is chris rohn.");
  firetable.started = true;
  var config = {
    apiKey: "AIzaSyDdshWtOPnY_0ACt6uJKmcI_qPpTfO4sJ4",
    authDomain: "firetable-e10fd.firebaseapp.com",
    databaseURL: "https://firetable-e10fd.firebaseio.com"
  };
  firetable.utilities.getEmojiMap();
  firetable.parser = new DOMParser();
  $(window).resize(firetable.utilities.debounce(function() {
    // This will execute whenever the window is resized
    $("#thehistory").css('top', $('#stage').outerHeight() + $('#topbar').outerHeight());
    $('#playerArea,#scScreen').width($('#djStage').outerWidth()).height($('#djStage').outerHeight());
    $( "#stealContain" ).css({ 'top': $('#grab').offset().top + $('#grab').height(), 'left': $('#grab').offset().left - 16 });
    setup();
    var objDiv = document.getElementById("chatsWrap");
    objDiv.scrollTop = objDiv.scrollHeight - objDiv.clientHeight;
  },500));
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
      if (timeSince <= 0 ) timeSince = 0;

      var secSince = Math.floor(timeSince / 1000);
      var timeLeft = data.duration - secSince;
      if (data.type == 2) {
        if (!firetable.preview) {
          firetable.scSeek = timeSince;
          firetable.scwidget.load("http://api.soundcloud.com/tracks/" + data.cid, {
            auto_play: true
          });
        }
      }
    }
    firetable.scLoaded = true;
  });

  $playlistItemTemplate = $('#mainqueue .pvbar').remove();

  firebase.initializeApp(config);
  ftapi.init();

  SC.initialize({
    client_id: "27028829630d95b0f9d362951de3ba2c"
  });

  ftapi.events.on("loggedIn", function(data){
    firetable.actions.loggedIn(data);
  });

  ftapi.events.on("loggedOut", firetable.actions.showLoginScreen);

  ftapi.events.on("authReconnected", function(){
    firetable.debug && console.log('reconnected');
    $('body').removeClass('disconnected');
    $('#newchat').prop( 'disabled', false ).focus();
  });

  ftapi.events.on("authDisconnected", function(){
    firetable.debug && console.log('disconnected');
    $('body').addClass('disconnected');
    $('#newchat').prop( 'disabled', true ).blur();
  });

  ftapi.events.on("userBanned", function(){
    firetable.debug && console.log("ban detected.");
      if (document.getElementById("notice") == null){
        var usrname2use = ftapi.uid;
        if (ftapi.users[ftapi.uid]){
          if (ftapi.users[ftapi.uid].username) usrname2use = ftapi.users[ftapi.uid].username;
        }
        $('.notice').attr('id','notice');
        $("#troublemaker").text(usrname2use);
      }
  });

  ftapi.events.on("userUnbanned", function(){
    window.location.reload();
  });

  firetable.ui.init();
};

firetable.actions = {
  logOut: function() {
    ftapi.actions.logOut();
    firetable.debug && console.log("logout");
  },
  showLoginScreen: function(){
    $("#cardCaseButton").hide();
    $("#loggedInName").hide();
    $("#logOutButton").hide().off();
    $('#mainGrid').removeClass().addClass('login');
    $("#grab").css("display", "none");
    if (firetable.loginForm && !$("#login").html()){
      $("#mainGrid").append("<div id=\"login\" class=\"scrollit\">"+firetable.loginForm+"</div>");
      firetable.ui.loginEventsInit();
      scrollits["login"] = new PerfectScrollbar($("#login")[0], { minScrollbarLength: 30 });
    }
  },
  logIn: function(email, password) {
    firetable.debug && console.log("login");
    ftapi.actions.logIn(email, password, function(error){
        var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
          alert('Wrong password.');
        } else {
          alert(errorMessage);
        }
        firetable.debug && console.log("log in error:",error);
    });
  },
  loggedIn: function(user){
    firetable.debug && console.log("user signed in!");
    if ($("#login").html()){
      firetable.loginForm = $("#login").html();
      scrollits["login"].destroy();
      firetable.ui.loginEventsDestroy();
      $("#login").remove();
    }

    if (ftapi.users[ftapi.uid]) {
      if (ftapi.users[ftapi.uid].username) {
        $("#loggedInName").text(ftapi.users[ftapi.uid].username);
        ftapi.uid = ftapi.users[ftapi.uid].username;
      } else {
        $("#loggedInName").text(user.uid);
      }
    } else {
      $("#loggedInName").text(user.uid);
    }
    var getSelect = firebase.database().ref("users/" + ftapi.uid + "/selectedList");
    var allQueues = firebase.database().ref("playlists/" + ftapi.uid);
    allQueues.once('value')
      .then(function(allQueuesSnap) {
        var allPlaylists = allQueuesSnap.val();
        $("#listpicker").off("change");
        $("#listpicker").html("<option value=\"1\">Add/Delete Playlist</option><option value=\"0\">Default Queue</option>");
        for (var key in allPlaylists) {
          if (allPlaylists.hasOwnProperty(key)) {
            $("#listpicker").append("<option id=\"pdopt" + key + "\" value=\"" + key + "\">" + allPlaylists[key].name + "</option>");
          }
        }
        getSelect.once('value')
          .then(function(snappy) {
            firetable.selectedListThing = snappy.val();

            if (!firetable.selectedListThing) firetable.selectedListThing = "0";
            if (firetable.selectedListThing == 0) {
              firetable.queueRef = firebase.database().ref("queues/" + ftapi.uid);
            } else {
              firetable.queueRef = firebase.database().ref("playlists/" + ftapi.uid + "/" + firetable.selectedListThing + "/list");
            }
            $("#listpicker").val(firetable.selectedListThing).change();
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

              } else if (val != firetable.selectedListThing) {
                //LOAD SELECTED LIST
                //change selected list in user obj
                $("#mainqueuestuff").css("display", "block");
                $("#filterMachine").css("display", "block");
                $("#addbox").css("display", "none");
                $("#cancelqsearch").hide();
                $("#qControlButtons").show();

                $("#plmanager").css("display", "none");
                var uref = firebase.database().ref("users/" + ftapi.uid + "/selectedList");
                uref.set(val);
                firetable.selectedListThing = val;
                firetable.queueRef.off("value", firetable.queueBind); //stop listening for changes on old list
                if (firetable.selectedListThing == "0") {
                  firetable.queueRef = firebase.database().ref("queues/" + ftapi.uid);
                } else {
                  firetable.queueRef = firebase.database().ref("playlists/" + ftapi.uid + "/" + firetable.selectedListThing + "/list");
                }
                firetable.queueBind = firetable.queueRef.on('value', function(dataSnapshot) {
                  var okdata = dataSnapshot.val();
                  firetable.debug && console.log('change list',okdata);
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
                      $newli.attr( "data-key", key );
                      $newli.attr( "data-type", thisone.type);
                      $newli.find('.previewicon').attr('id', "pv" + key).on('click', function(){
                        firetable.actions.pview(
                          $(this).parent().attr('data-key'),
                          false,
                          $(this).parent().attr('data-type')
                        );
                      }).html(psign);
                      $newli.find('.listwords').html(thisone.name);
                      $newli.find('.bumpsongs').on('click', function(){
                        firetable.actions.bumpSongInQueue(
                          $(this).parent().attr('data-key')
                        );
                      });
                      $newli.find('.edittags').on('click', function(){
                        firetable.actions.editTagsPrompt(
                          $(this).parent().attr('data-key')
                        );
                      });
                      $newli.find('.deletesong').on('click', function(){
                        firetable.actions.deleteSong(
                          $(this).parent().attr('data-key')
                        );
                      });
                      $('#mainqueue').append($newli);
                    }
                  }
                });
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
            firetable.queueBind = firetable.queueRef.on('value', function(dataSnapshot) {
              var okdata = dataSnapshot.val();
              firetable.debug && console.log("init list",okdata);
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
                  $newli.attr( "data-key", key );
                  $newli.attr( "data-type", thisone.type);
                  $newli.find('.previewicon').attr('id', "pv" + key).on('click', function(){
                    firetable.actions.pview($(this).parent().attr('data-key'), false, $(this).parent().attr('data-type'));
                  }).html(psign);
                  $newli.find('.listwords').html(thisone.name);
                  $newli.find('.bumpsongs').on('click', function(){ firetable.actions.bumpSongInQueue($(this).parent().attr('data-key')) });
                  $newli.find('.edittags').on('click', function(){ firetable.actions.editTagsPrompt($(this).parent().attr('data-key')) });
                  $newli.find('.deletesong').on('click', function(){ firetable.actions.deleteSong($(this).parent().attr('data-key')) });
                  $('#mainqueue').append($newli);
                }
              }

            });
          });
      });
    $("#cardCaseButton").show();
    $("#loggedInName").show();
    $("#logOutButton").show().on('click',firetable.actions.logOut);
    firetable.debug && console.log('remove login class from mainGrid');
    $('#mainGrid').removeClass().addClass('mmusrs');
    $("#grab").css("display", "inline-block");
  },
  cardCase: function(){
    var niceref = firebase.database().ref("cards");
     $("#cardsMain").html("");
     niceref.orderByChild('owner').equalTo(ftapi.uid).once("value")
       .then(function(snapshot) {
         snapshot.forEach(function(childSnapshot) {
           var key = childSnapshot.key;
           var childData = childSnapshot.val();
           firetable.debug && console.log('card:',childData);
           $("#cardsMain").append("<span id=\"caseCardSpot"+key+"\" class=\"caseCardSpot\"><canvas width=\"225\" height=\"300\" class=\"caseCard\" id=\"cardMaker"+key+"\"></canvas><span role=\"button\" onclick=\"firetable.actions.giftCard('"+key+"')\" class=\"cardGiftChat\">Gift to DJ</span><span role=\"button\" onclick=\"firetable.actions.chatCard('"+key+"')\" class=\"cardShareChat\">Share In Chat</span></span>");

           firetable.actions.displayCard(childData, childSnapshot.key);
           });
    });
  },
  chatCard: function(cardid){
    ftapi.actions.sendChat("Check out my card...", cardid);
  },
  giftCard: function(cardid){
    ftapi.actions.sendChat("!giftcard :gift:", cardid);
    $("#caseCardSpot"+cardid).remove();
  },
  displayCard: function(data, chatid){
    firetable.debug && console.log("display card");
    var defaultScheme = false;
    if (data.colors){
      if (data.colors.color == "#fff" || data.colors.color == "#7f7f7f") {
        data.colors.color = firetable.orange;
        data.colors.txt = "#000";
        defaultScheme = true;
      }
    }

    var canvas = document.getElementById('cardMaker'+chatid);

    if (canvas.getContext) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 225, 300);

      ctx.fillStyle = data.colors.color;
      if (defaultScheme) ctx.fillStyle = "#fff";
      ctx.fillRect(1, 30, 223, 175);

      var grd = ctx.createLinearGradient(0,0,0,175);
      grd.addColorStop(0,"rgba(0, 0, 0, 0.75)");
      grd.addColorStop(1,"rgba(0, 0, 0, 0.55)");

      // Fill with gradient
      ctx.fillStyle = grd;
      ctx.fillRect(1,30,223,175);

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
      ctx.fillText("Printed "+firetable.utilities.format_date(data.date)+" | Indie Discotheque", 112.5, 299);

      ctx.font = "700 10px Helvetica, Arial, sans-serif";
      ctx.textAlign = "left";
      var linez = firetable.utilities.wrapText(ctx, data.title, 66, 240, 160, 15);
      firetable.debug && console.log('linez:',linez);
      ctx.font = "400 8px Helvetica, Arial, sans-serif";
      ctx.textAlign = "left";
      firetable.utilities.wrapText(ctx, data.artist, 66, 253 + (15 * linez), 160, 15);

      ctx.fillStyle = data.colors.txt;
      ctx.font = "400 9px Helvetica, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Card No. "+data.cardnum+" | DJ Card | Max Operating Temp "+data.temp+"°", 112.5, 214);
      ctx.beginPath();
      ctx.arc(205, 15, 12, 0, 2 * Math.PI, false);
      ctx.fillStyle = data.colors.color;
      ctx.fill();

      ctx.fillStyle = data.colors.txt;
      ctx.font = "700 15px Helvetica, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(data.num, 200.5, 20);

      var doImages = function(){
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
        picboy.src = 'https://indiediscotheque.com/robots/'+data.djid + data.djname+'.png?size=175x175';


      };

      // special styles

      if (data.special){
        if (data.special == "id8"){
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
            eight.src = 'https://indiediscotheque.com/basement/img/8.png';
          };
          cake.src = 'https://indiediscotheque.com/basement/img/cake.png';

        }
      } else {
        doImages();
      }
    }
  },
  showCard: function(cardid, chatid){
    // let's SHOW A CARD
    ftapi.actions.getCard(cardid, function(data){
      firetable.actions.displayCard(data, chatid);
    });
  },
  filterQueue: function(val){
    if (val.length == 0) {
      $("#mainqueue .pvbar").show();
      return
    } else {

    }
    val = val.toLowerCase();
    console.log(val);
    $("#mainqueue .pvbar").each(function(p, q) {
      var txt = $(q).find(".listwords").text();
      var regex = new RegExp( val, 'ig' );
      if (txt.match(regex)) {
        console.log($(q).find(".listwords").text())
        $(q).show()
      } else {
        $(q).hide()
      }
    });
  },
  muteToggle: function(zeroMute) {

    var muted = localStorage["firetableMute"];
    var icon = "&#xE050;";
    firetable.debug && console.log('muted:',muted);
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

    if ( muted ) $("#volstatus").addClass('on');
    else $("#volstatus").removeClass('on');
    $("#volstatus i").html(icon);
    localStorage["firetableMute"] = muted;
  },
  pview: function(id, fromSearch, type, fromHist) {
    console.log("preview", {id: id, fromSearch: fromSearch, type: type, fromHist: fromHist});
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
      if (timeSince <= 0 ) timeSince = 0;

      var secSince = Math.floor(timeSince / 1000);
      var timeLeft = firetable.song.duration - secSince;
      if (firetable.song.type == 1) {
        if (!firetable.preview) {
          if (firetable.scLoaded) firetable.scwidget.pause();
          player.loadVideoById(firetable.song.cid, secSince, "large");
        }
      } else if (firetable.song.type == 2) {
        if (!firetable.preview) {
          if (firetable.ytLoaded) player.stopVideo();
          firetable.scSeek = timeSince;
          firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
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
        if (timeSince <= 0 ) timeSince = 0;

        var secSince = Math.floor(timeSince / 1000);
        var timeLeft = firetable.song.duration - secSince;
        if (firetable.song.type == 1) {
          if (!firetable.preview) {
            if (firetable.scLoaded) firetable.scwidget.pause();
            player.loadVideoById(firetable.song.cid, secSince, "large");
          }
        } else if (firetable.song.type == 2) {
          if (!firetable.preview) {
            if (firetable.ytLoaded) player.stopVideo();
            firetable.scSeek = timeSince;
            firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
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
        $("#pvbar" + firetable.preview).css("background-image", "linear-gradient(90deg, rgba(244, 129, 11, 0.267) " + pcnt + "%, "+ pvcolr +" " + pcnt + "%)");
      }, 200);
      if (type == 1) {
        if (firetable.scLoaded) firetable.scwidget.pause();
        player.loadVideoById(cid, 0, "large")
      } else if (type == 2) {
        if (firetable.ytLoaded) player.stopVideo();
        firetable.scSeek = 0;
        firetable.scwidget.load("http://api.soundcloud.com/tracks/" + cid, {
          auto_play: true
        });
      }


    }

  },
  mergeLists: function(source, dest, sourceName){
    if (source == dest){
      //source and dest are the same, let's remove the duplicates
      firetable.actions.removeDupesFromQueue();
      return;
    }
    if (dest == -1){
      // create new list if needed
      var plref = firebase.database().ref("playlists/" + ftapi.uid);
      var newlist = plref.push();
      var listid = newlist.key;
      dest = listid;
      var newname = firetable.utilities.format_date(Date.now()) + " Copy of "+sourceName;
      var obj = {
        name: newname,
        list: {}
      };
      newlist.set(obj);
      $("#listpicker").append("<option id=\"pdopt" + listid + "\" value=\"" + listid + "\">" + newname + "</option>");
    }
    var destref;
    if (dest == 0){
      destref = firebase.database().ref("queues/" + ftapi.uid);
    } else {
      destref = firebase.database().ref("playlists/" + ftapi.uid + "/" + dest + "/list");
    }

    var sourceref;
    if (source == 0){
      sourceref = firebase.database().ref("queues/" + ftapi.uid);
    } else {
      sourceref = firebase.database().ref("playlists/" + ftapi.uid + "/" + source + "/list");
    }
    // create dest obj to check for duplicates
    var destObj = {};
    destref.once("value")
      .then(function(snapshot2) {
        snapshot2.forEach(function(childSnapshot) {
            var key = childSnapshot.key;
            var childData = childSnapshot.val();
            if (childData){
              if (childData.cid) destObj[childData.cid] = childData.type;
            }
        });
        firetable.debug && console.log('merge dest:',destObj);
        sourceref.once("value")
          .then(function(snapshot3) {
            snapshot3.forEach(function(childSnapshot3) {
                var key = childSnapshot3.key;
                var childData = childSnapshot3.val();
                if (childData){
                  if (childData.cid) {
                    var dupe = false;
                    if (destObj[childData.cid]){
                        if (childData.type == destObj[childData.cid]) dupe = true;
                    }
                    firetable.debug && console.log('dupe:',dupe, childData);
                    if (!dupe){
                      // NOT A DUPLICATE! GO GO GO
                      destref.push(childData);
                    }
                  }
                }

            });
            $("#mergeCompleted").show();
            $("#mergeHappening").hide();
        });
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
          gapi.client.setApiKey('AIzaSyDCXzJ9gGLTF_BLcTzNUO2Zeh4HwPxgyds');
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
            firetable.debug && console.log('queue from link:',response);
            if (response.result) {
              if (response.result.items) {
                if (response.result.items.length) {
                  firetable.actions.queueTrack(response.result.items[0].id, response.result.items[0].snippet.title, 1);
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

      var listComments = function(tracks) {
        firetable.debug && console.log('sc tracks for comments:',tracks);
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
      };
      SC.resolve(link).then(getComments).then(listComments);

    }
  },
  updateQueue: function() {
    //this fires when someone drags a song to a new spot in the queue
    var arr = $('#mainqueue > div').map(function() {
      var theid = this.id;
      var idraw = theid.slice(5);
      return idraw;
    }).get();

    var okdata = firetable.queue;
    var ids = [];
    for (var key in okdata) {
      if (okdata.hasOwnProperty(key)) {
        ids.push(key);
      }
    }
    var changePv = false;
    var newobj = {};
    for (var i = 0; i < arr.length; i++) {
      var songid = arr[i];
      var newspot = ids[i];
      var thisone = okdata[songid];
      newobj[newspot] = thisone;
      if (firetable.preview == songid) {
        changePv = newspot;
      }
    }
    if (changePv) firetable.preview = changePv;
    firetable.queueRef.set(newobj);
  },
  shuffleQueue: function(){
    var okdata = firetable.queue;
    var ids = [];
    var arr = [];
    for (var key in okdata) {
      if (okdata.hasOwnProperty(key)) {
        ids.push(key);
        arr.push(key);
      }
    }
    firetable.utilities.shuffle(arr);
    var changePv = false;
    var newobj = {};
    for (var i = 0; i < arr.length; i++) {
      var songid = arr[i];
      var newspot = ids[i];
      var thisone = okdata[songid];
      newobj[newspot] = thisone;
      if (firetable.preview == songid) {
        changePv = newspot;
        firetable.debug && console.log('shuffle queue:',changePv);
      }
    }
    if (changePv) firetable.preview = changePv;
    firetable.queueRef.set(newobj);
  },
  removeDupesFromQueue: function(){
    var okdata = firetable.queue;
    var arr = [];
    for (var key in okdata) {
      if (okdata.hasOwnProperty(key)) {
        var entry = firetable.queue[key];
        entry.key = key;
        arr.push(entry);
      }
    }
    var dupes = arr.filter((obj, pos, arr2) => {
        return arr2.map(mapObj => mapObj.cid).indexOf(obj.cid) !== pos;
    });
    for (var i=0; i<dupes.length; i++){
      firetable.actions.deleteSong(dupes[i].key);
    }
    $("#mergeCompleted").show();
    $("#mergeHappening").hide();
  },
  editTagsPrompt: function(songid) {
    var song = firetable.queue[songid];
    $("#tagMachine").val(song.name);
    if (song.type == 1) {
      $("#tagSongLink").attr("href", "https://youtube.com/watch?v=" + song.cid);
    } else if (song.type == 2) {
      SC.get('/tracks', {
        ids: song.cid
      }).then(function(tracks) {
        if (tracks.length) {
          $("#tagSongLink").attr("href", tracks[0].permalink_url);
        } else {
          $("#tagSongLink").attr("href", "http://howtojointheindiediscothequewaitlist.com/ThisSongIsBroken?thanks=true");
        }
      });
    }

    firetable.debug && console.log('edit tags song id:',songid);
    firetable.songToEdit = {
      song: song,
      key: songid
    };
    $("#overlay").css("display", "flex");
    $(".modalThing").hide();
    $('#tagPromptBox').show();
  },
  importList(id, name, type) {
    //time to IMPORT SOME LISTS!
    $("#overlay").hide();
    $("#importResults").html("");
    $("#plMachine").val("");
    if (type == 1) {
      //youtube
      var finalList = [];

      function keyWordsearch(pg) {
        gapi.client.setApiKey('AIzaSyDCXzJ9gGLTF_BLcTzNUO2Zeh4HwPxgyds');
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
            var plref = firebase.database().ref("playlists/" + ftapi.uid);
            var newlist = plref.push();
            var listid = newlist.key;
            var obj = {
              name: name,
              list: {}
            };
            newlist.set(obj);
            $("#listpicker").append("<option id=\"pdopt" + listid + "\" value=\"" + listid + "\">" + name + "</option>");
            var nref = firebase.database().ref("playlists/" + ftapi.uid + "/" + listid + "/list");
            for (var i = 0; i < finalList.length; i++) {
              var info = {
                type: 1,
                name: finalList[i].snippet.title,
                cid: finalList[i].snippet.resourceId.videoId
              };
              nref.push(info);
            }
          }
        })
      }
      keyWordsearch();

    } else if (type == 2) {
      SC.get('/playlists/' + id).then(function(listinfo) {
        firetable.debug && console.log('sc tracks:',listinfo.tracks);
        var plref = firebase.database().ref("playlists/" + ftapi.uid);
        var newlist = plref.push();
        var listid = newlist.key;
        var obj = {
          name: name,
          list: {}
        };
        newlist.set(obj);
        $("#listpicker").append("<option id=\"pdopt" + listid + "\" value=\"" + listid + "\">" + name + "</option>");
        var nref = firebase.database().ref("playlists/" + ftapi.uid + "/" + listid + "/list");
        for (var i = 0; i < listinfo.tracks.length; i++) {
          var yargo = listinfo.tracks[i].title.split(" - ");
          var sartist = yargo[0];
          var stitle = yargo[1];
          if (!stitle) {
            stitle = sartist;
            sartist = listinfo.tracks[i].user.username;
          }
          var goodTitle = sartist +" - "+stitle;
          var info = {
            type: 2,
            name: goodTitle,
            cid: listinfo.tracks[i].id
          };
          nref.push(info);
        }
      });
    }
  },
  editSongTag: function(obj) {
    if (firetable.queue[obj.key]) {
      if (firetable.queue[obj.key].cid == obj.song.cid) {
        var changeref = firetable.queueRef.child(obj.key);
        changeref.set(obj.song);
      } else {
        //song appears to have moved since the editing began, let's try and find it...
        for (var key in firetable.queue) {
          if (firetable.queue.hasOwnProperty(key)) {
            if (firetable.queue[key].cid == obj.song.cid) {
              var changeref = firetable.queueRef.child(key);
              changeref.set(obj.song);
              return;
            }
          }
        }
      }
    } else {
      //song appears to have moved since the editing began, let's try and find it...
      for (var key in firetable.queue) {
        if (firetable.queue.hasOwnProperty(key)) {
          if (firetable.queue[key].cid == obj.song.cid) {
            var changeref = firetable.queueRef.child(key);
            changeref.set(obj.song);
            return;
          }
        }
      }
    }

  },
  bumpSongInQueue: function(songid) {
    //this is a stupid way of doing this,
    //but i couldn't find a way to re-order a fb ref
    //or add to the top of it (fb has a push() but no unshift() equivalent)
    if (!firetable.queue) return false;
    var okdata = firetable.queue;
    var qtemp = [];
    var ids = [];
    var indx = false;
    var countr = 0;
    for (var key in okdata) {
      if (okdata.hasOwnProperty(key)) {
        var thisone = okdata[key];
        var obj = {
          data: thisone,
          key: key
        };
        qtemp.push(obj);
        ids.push(key);
        if (key == songid) indx = countr;
        countr++;
      }
    }
    var newobj = {};
    if (indx) {
      var thingo = qtemp[indx];
      qtemp.splice(indx, 1); //take song out of temp array
      qtemp.unshift(thingo); //add it to the top
      var changePv = false;
      //now we have to rebuild the object keeping the oldkeys in the same order
      //we have to do it this way (i think) because firebase orders based on its ids
      for (var i = 0; i < qtemp.length; i++) {
        var theid = ids[i];
        firetable.debug && console.log('bump song id:',theid);
        if (firetable.preview == qtemp[i].key) {
          changePv = theid;
        }

        newobj[theid] = qtemp[i].data;
      }
      if (changePv) firetable.preview = changePv;
      firetable.queueRef.set(newobj); //send it off to firebase!
    }

  },
  signUp: function(email, password) {
    firetable.debug && console.log("signup");
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      alert(errorMessage);
    });
  },
  deleteSong: function(id) {
    var removeThis = firetable.queueRef.child(id);
    removeThis.remove()
      .then(function() {
        firetable.debug && console.log("song remove went great.");

      })
      .catch(function(error) {
        firetable.debug && console.log("Song Remove failed: " + error.message);
      });
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
  unban: function(userid){
    ftapi.actions.unbanUser(userid);
  },
  reloadtrack: function() {
    $('#reloadtrack').addClass('on working');
    //start regular song
    var nownow = Date.now();
    var timeSince = nownow - firetable.song.started;
    if (timeSince <= 0 ) timeSince = 0;
    var secSince = Math.floor(timeSince / 1000);
    var timeLeft = firetable.song.duration - secSince;
    if (firetable.song.type == 1) {
      if (!firetable.preview) {
        if (firetable.scLoaded) firetable.scwidget.pause();
        player.loadVideoById(firetable.song.cid, secSince, "large");
      }
    } else if (firetable.song.type == 2) {
      if (!firetable.preview) {
        if (firetable.ytLoaded) player.stopVideo();
        firetable.scSeek = timeSince;
        firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
          auto_play: true
        },function(){
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
    setTimeout( function() {
      $("#apv" + type + cid).find(".material-icons").text("playlist_add");
      $("#apv" + type + cid).removeAttr("style");
    }, 3000 );
    var cuteid = firetable.queueRef.push(info, function() {
      firetable.debug && console.log('queue track id:',cuteid.key);
      if (!tobottom) firetable.actions.bumpSongInQueue(cuteid.key);
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
        if (timeSince <= 0 ) timeSince = 0;
        var secSince = Math.floor(timeSince / 1000);
        var timeLeft = firetable.song.duration - secSince;
        if (firetable.song.type == 1) {
          if (!firetable.preview) {
            if (firetable.scLoaded) firetable.scwidget.pause();
            player.loadVideoById(firetable.song.cid, secSince, "large");
          }
        } else if (firetable.song.type == 2) {
          if (!firetable.preview) {
            if (firetable.ytLoaded) player.stopVideo();
            firetable.scSeek = timeSince;
            firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
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
  n: function (p, q) {
    var e = p.attr("data-alternative-name");
    return ($(p).text().toLowerCase().indexOf(q) >= 0) || (e != null && e.toLowerCase().indexOf(q) >= 0)
  },
  sec: function(sec){
    firetable.debug && console.log('emoji sec:',sec);
    var selectedSec = $("#pickerNav > .on");
    var thething = sec.substr(1);

    if (selectedSec.length){
      firetable.debug && console.log("already selected sec");
      if (selectedSec[0].id == sec){
        firetable.debug && console.log("toggle selected... back to FULL LIST");
        $("#"+selectedSec[0].id).removeClass("on");
        $("#pickerResults div").show();
      } else {
        //new sec selected
        $("#"+selectedSec[0].id).removeClass("on");
        $("#"+selectedSec[0].id.substr(1)).hide();
        $("#"+sec).addClass("on");
        $("#"+thething).show();
      }
    } else {
      firetable.debug && console.log("first select");
      $("#"+sec).addClass("on");
      $("#pickerResults div").hide();
      $("#"+thething).show();
    }
  },
  niceSearch: function (val){
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
    })
  }
};

firetable.utilities = {
  getEmojiMap: function(){
    firetable.emojiMap = {};
    fetch("https://unpkg.com/emojilib@^2.0.0/emojis.json").then(data => data.json()).then(json => {
      for (key in json) {
        var emoji = json[key]
        firetable.emojiMap[key] = emoji.char;
        var words = key;
        for (var i=0; i<emoji.keywords.length; i++){
          words += ", "+emoji.keywords[i];
        }
        $("#picker"+emoji.category).append("<span role=\"button\" class=\"pickerResult\" title=\""+key+"\" data-alternative-name=\""+words+"\">"+emoji.char+"</span>");
      }
    });
  },
  wrapText: function (context, text, x, y, maxWidth, lineHeight) {
          var words = text.split(' ');
          var line = '';
          var lines = 0;

          for(var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
              context.fillText(line, x, y);
              line = words[n] + ' ';
              y += lineHeight;
              lines++;
            }
            else {
              line = testLine;
            }
          }
          context.fillText(line, x, y);
          return lines;
  },
  // Modern Fisher-Yates shuffle
  shuffle: function(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
  },
  emojiShortnamestoUnicode : function(str){
    var res = str.replace(/\:(.*?)\:/g, function (x) {
      var response = x;
      var shortname = x.replace(/\:/g, "");
      if (firetable.emojiMap[shortname]){
        response = "<span title=\""+x+"\">"+firetable.emojiMap[shortname]+"</span>";
      }
      return response;
    });
    return res;
  },
  playSound: function(filename) {
    if (firetable.playBadoop){
      document.getElementById("audilert").setAttribute('src',filename+".mp3");
    }
  },
  desktopNotify: function(chatData, namebo){
      if (Notification) {
        if (Notification.permission !== "granted") {
          Notification.requestPermission();
        } else {
            var notification = new Notification(namebo, {
              icon: "https://indiediscotheque.com/robots/"+chatData.id + namebo +".png?size=110x110",
              body: chatData.txt,
            });
        }
      }
  },
  screenUp: function(){
    $('body').removeClass('screen');
  },
  screenDown: function(){
    $('body').addClass('screen');
  },
  isChatPrettyMuchAtBottom: function() {
    var objDiv = document.getElementById("chatsWrap");
    var answr = false;
    var thing1 = objDiv.scrollHeight - objDiv.clientHeight;
    var thing2 = objDiv.scrollTop;
    if (Math.abs(thing1 - thing2) <= 5) answr = true;
    return answr;
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
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }
};

firetable.ui = {
  textToLinks: function(text, themeBox) {
    var re = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    if (firetable.showImages && !themeBox) re = /(https?:\/\/(?![/|.|\w|\s|-]*(?:jpg|png|gif))[^" ]+)/g;
    return text.replace(re, "<a href=\"$1\" target=\"_blank\" tabindex=\"-1\">$1</a>");

return text;
  },
  strip: function(html){
    var doc = firetable.parser.parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  },
  showImages: function(chatTxt) {
    if (firetable.showImages){
      var imageUrlRegex = /((http(s?):)([/|.|\w|\s|-])*\.(?:jpe?g|gif|png))/g;
      var hasImage = chatTxt.search(imageUrlRegex) >= 0;
      if (hasImage) {
        chatTxt = chatTxt.replace(imageUrlRegex, function(imageUrl){
            var chatImage = new Image();
            chatImage.onload = function() {
              var objDiv = document.getElementById("chatsWrap");
              var thing1 = objDiv.scrollHeight - objDiv.clientHeight;
              var thing2 = objDiv.scrollTop;
              if (Math.abs(thing1 - thing2) <= (parseInt(chatImage.height)+20)) objDiv.scrollTop = objDiv.scrollHeight - objDiv.clientHeight;
            }
            chatImage.src = imageUrl;
          return '<a class="inlineImgLink" href="'+imageUrl+'" target="_blank" tabindex="-1"><img src="'+imageUrl+'" class="inlineImage" /><span role=\"button\" class="hideImage">&times;</span></a>'
        });

      }
    }
    return chatTxt;
  },
  loginLinkToggle: function(id){
    $("#formlinks").find(".selected").removeClass("selected");
    $("#"+id).addClass("selected");
  },
  loginEventsInit: function(){
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
         if (pass == pass2) {
           firetable.actions.signUp(email, pass);
         } else {
           alert("Those passwords do not match!");
         }
       }
     });
     $("#theAddress").bind("keyup", function(e) {
       if (e.which == 13) {
         var email = $("#theAddress").val();
         firetable.debug && console.log("reset email return");
         firebase.auth().sendPasswordResetEmail(email).catch(function(error) {
           var errorCode = error.code;
           var errorMessage = error.message;
           if (errorCode === 'auth/wrong-password') {
             alert('Wrong password.');
           } else {
             alert(errorMessage);
           }
           firetable.debug && console.log('send pass reset error:',error);
         });
         alert("Reset email sent. Click the reset link when it arrives thanks.");
       }
     });
     $("#createAccountBttn").bind("click", function() {
       var email = $("#newemail").val();
       var pass = $("#newpass").val();
       $("#newemail").val("");
       $("#newpass").val("");
       firetable.actions.signUp(email, pass);

     });
     $("#resetPassBttn").bind("click", function() {
       var email = $("#theAddress").val();
       firetable.debug && console.log("reset email click button");
       firebase.auth().sendPasswordResetEmail(email).catch(function(error) {
         var errorCode = error.code;
         var errorMessage = error.message;
         if (errorCode === 'auth/wrong-password') {
           alert('Wrong password.');
         } else {
           alert(errorMessage);
         }
         firetable.debug && console.log('send pass reset error:',error);
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
  loginEventsDestroy: function(){
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
    var showImages = localStorage["firetableShowImages"];
    if (typeof showImages == "undefined") {
      localStorage["firetableShowImages"] = false;
      firetable.showImages = false;
      $( "#showImagesToggle" ).prop( "checked", false );
    } else {
      showImages = JSON.parse(showImages);
      firetable.showImages = showImages;
      $( "#showImagesToggle" ).prop( "checked", showImages );
    }
    var showAvatars = localStorage["firetableShowAvatars"];
    if (typeof showAvatars == "undefined") {
      localStorage["firetableShowAvatars"] = true;
      firetable.showAvatars = true;
      $( "#showAvatarsToggle" ).prop( "checked", true );
    } else {
      showAvatars = JSON.parse(showAvatars);
      firetable.showAvatars = showAvatars;
      $( "#showAvatarsToggle" ).prop( "checked", showAvatars );
      if( showAvatars == false ) {
        document.getElementById("actualChat").classList.add("avatarsOff");
      }
    }
    var playBadoop = localStorage["firetableBadoop"];
    if (typeof playBadoop == "undefined") {
      localStorage["firetableBadoop"] = true;
      firetable.playBadoop = true;
      $( "#badoopToggle" ).prop( "checked", true );
    } else {
      playBadoop = JSON.parse(playBadoop);
      firetable.playBadoop = playBadoop;
      $( "#badoopToggle" ).prop( "checked", playBadoop );
    }
    var dtnmt = localStorage["firetableDTNM"];
    if (typeof dtnmt == "undefined") {
      localStorage["firetableDTNM"] = false;
      firetable.desktopNotifyMentions = false;
      $( "#desktopNotifyMentionsToggle" ).prop( "checked", false);
    } else {
      dtnmt = JSON.parse(dtnmt);
      firetable.desktopNotifyMentions = dtnmt;
      $( "#desktopNotifyMentionsToggle" ).prop( "checked", dtnmt );
    }
    var screenControl = localStorage["firetableScreenControl"];
    if (typeof screenControl == "undefined") {
      localStorage["firetableScreenControl"] = "sync";
      firetable.screenControl = "sync";
      $( "#screenControlTog"+firetable.screenControl ).prop( "checked", true );
    } else {
      firetable.screenControl = screenControl;
      $( "#screenControlTog"+firetable.screenControl ).prop( "checked", true );
      if (screenControl == "on"){
        firetable.utilities.screenDown();
      } else if (screenControl == "off"){
        firetable.utilities.screenUp();
      } else if (screenControl == "sync"){
        if (firetable.screenSyncPos){
          firetable.utilities.screenDown();
        } else {
          firetable.utilities.screenUp();
        }
      }
    }
    var $historyItem = $('#thehistory .pvbar').remove();
    ftapi.events.on('newHistory', function(data) {
        var firstpart = "yt";
        if (data.type == 2) firstpart == "sc";
        var pkey = firstpart +"cid" + data.cid;
        var $histItem = $historyItem.clone();
        $histItem.attr('id', "pvbar"+pkey);
        $histItem.attr( "data-key", pkey );
        $histItem.attr( "data-cid", data.cid);
        $histItem.attr( "data-type", data.type);

        $histItem.find('.previewicon').attr('id', "pv"+pkey).on('click', function(){
          firetable.actions.pview(
            $(this).closest('.pvbar').attr('data-key'),
            true,
            $(this).closest('.pvbar').attr('data-type'),
            true
          );
        });
        $histItem.find('.histlink').attr({'href': data.url, 'tabindex': "-1"}).text(data.artist + " - "+ data.title);
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
        scrollits['thehistoryWrap'].update();
    });
    ftapi.events.on("newTheme", function(data) {
      if (!data){
        //no theme
        $("#currentTheme").text("!suggest a theme");
      } else {
        var txtOut = firetable.ui.strip(data);
        txtOut = firetable.ui.textToLinks(txtOut, true);
        txtOut = firetable.utilities.emojiShortnamestoUnicode(txtOut);
        txtOut = txtOut.replace(/\`(.*?)\`/g, function (x) {
          return "<code>"+x.replace(/\`/g, "") +"</code>";
        });
        $("#currentTheme").html(txtOut);
        twemoji.parse(document.getElementById("currentTheme"));
      }
    });
    ftapi.events.on("tagUpdate", function(data) {
      firetable.debug && console.log("TAG UPDATE", data);
      firetable.tagUpdate = data;
      if (firetable.song){
      if (firetable.song.cid == data.cid && data.adamData.track_name){
          $("#track").text(firetable.ui.strip(data.adamData.track_name));
          $("#artist").text(firetable.ui.strip(data.adamData.artist));
          var nicename = firetable.song.djname;
          var objDiv = document.getElementById("chatsWrap");
          scrollDown = false;
          if (firetable.utilities.isChatPrettyMuchAtBottom()) scrollDown = true;
          var showPlaycount = false;
          if (data.adamData.playcount){
            if (data.adamData.playcount > 0){
              showPlaycount = true;
            }
          }
          if (data.adamData.last_play){
            $("#lastPlay").text("last "+firetable.utilities.format_date(data.adamData.last_play)+" by "+data.adamData.last_play_dj);
          } else {
            $("#lastPlay").text("");
          }
          if (data.adamData.first_play){
            $("#firstPlay").text("first "+firetable.utilities.format_date(data.adamData.first_play)+" by "+data.adamData.first_play_dj);
          } else {
            $("#firstPlay").text("");
          }
          if (showPlaycount){
            $("#playCount").text(data.adamData.playcount+" plays");
            $(".npmsg"+data.cid).last().html("<div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing <strong>" + data.adamData.track_name + "</strong> by <strong>" + data.adamData.artist + "</strong><br/>This song has been played "+data.adamData.playcount+" times.</div>");
          } else {
            $("#playCount").text("");
            $(".npmsg"+data.cid).last().html("<div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing <strong>" + data.adamData.track_name + "</strong> by <strong>" + data.adamData.artist + "</strong></div>");
          }
          scrollits['chatsWrap'].update();
          if (scrollDown) objDiv.scrollTop = objDiv.scrollHeight - objDiv.clientHeight;
        }
      }
    });


    ftapi.events.on('newSong', function(data) {
      $("#playCount").text("");
      $("lastPlay").text("");
      $("firstPlay").text("");
      $("#cloud_with_rain").removeClass("on");
      $("#fire").removeClass("on");
      $("#timr").countdown("destroy");
      if (firetable.moveBar != null) {
        clearInterval(firetable.moveBar);
        firetable.moveBar = null;
      }
      $("#prgbar").css("background", "#151515");
      var showPlaycount = false;
      if (firetable.tagUpdate){
        if (data.cid == firetable.tagUpdate.cid && firetable.tagUpdate.adamData.track_name){
          data.title = firetable.tagUpdate.adamData.track_name;
          data.artist = firetable.tagUpdate.adamData.artist;
          if (firetable.tagUpdate.adamData.last_play){
            $("#lastPlay").text("last "+firetable.utilities.format_date(firetable.tagUpdate.adamData.last_play)+" by "+firetable.tagUpdate.adamData.last_play_dj);
          }
          if (firetable.tagUpdate.adamData.first_play){
            $("#firstPlay").text("first "+firetable.utilities.format_date(firetable.tagUpdate.adamData.first_play)+" by "+firetable.tagUpdate.adamData.first_play_dj);
          }
          if (firetable.tagUpdate.adamData.playcount){
            if (firetable.tagUpdate.adamData.playcount > 0){
              showPlaycount = true;
              $("#playCount").text(firetable.tagUpdate.adamData.playcount+" plays");
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
      if (timeSince <= 0 ) timeSince = 0;
      var secSince = Math.floor(timeSince / 1000);
      var timeLeft = data.duration - secSince;
      firetable.song = data;
      firetable.debug && console.log("NEW TRACK", data);
      firetable.debug && console.log('time since:',timeSince);
      if (data.type == 1){
          $("#scScreen").hide();
      } else if (data.type ==2){
        $("#scScreen").show();
        var biggerImg = data.image.replace('-large', '-t500x500');
        firetable.scImg = biggerImg;
        $("#albumArt").css("background-image", "url(" + biggerImg + ")")
        try{
          setup(biggerImg);
        } catch (e){
          firetable.debug && console.log('big image error:',e)
        }
      }
      if (data.type == 1 && firetable.ytLoaded) {
        if (!firetable.preview) {
          if (firetable.scLoaded) firetable.scwidget.pause();
          player.loadVideoById(data.cid, secSince, "large");
          var thevolactual = $("#slider").slider("value");
          player.setVolume(thevolactual);
          firetable.scwidget.setVolume(thevolactual);
        }
      } else if (data.type == 2 && firetable.scLoaded) {
        if (!firetable.preview) {
          if (firetable.ytLoaded) player.stopVideo();
          firetable.scSeek = timeSince;
          firetable.scwidget.load("http://api.soundcloud.com/tracks/" + data.cid, {
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
          scrollDown = false;
          var objDiv = document.getElementById("chatsWrap");
          if (firetable.utilities.isChatPrettyMuchAtBottom()) scrollDown = true;
          if (showPlaycount){
            $("#chats").append("<div class=\"newChat nowplayn npmsg"+data.cid+"\"><div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing <strong>" + data.title + "</strong> by <strong>" + data.artist + "</strong><br/>This song has been played "+firetable.tagUpdate.adamData.playcount+" times.</div>")
          } else {
            $("#chats").append("<div class=\"newChat nowplayn npmsg"+data.cid+"\"><div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing <strong>" + data.title + "</strong> by <strong>" + data.artist + "</strong></div>")
          }
          scrollits['chatsWrap'].update();
          if (scrollDown) objDiv.scrollTop = objDiv.scrollHeight - objDiv.clientHeight;
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
      firetable.debug && console.log('thescreen:',data);
      firetable.screenSyncPos = data;
      if (firetable.screenControl == "sync"){
      if (data) {
        firetable.utilities.screenDown();
      } else {
        firetable.utilities.screenUp();
      }
    }
    });
    ftapi.events.on("danceStateChanged", function(data) {
      firetable.debug && console.log('dance check:',data);
      if (data){
        $("#deck").addClass("dance");
      } else {
        $("#deck").removeClass("dance");
      }
    });
    ftapi.events.on("waitlistChanged", function(data) {
      var ok1 = "";
      var cnt = "0";
      if (data) {
        var countr = 1;
        for (var key in data) {
          firetable.debug && console.log('waitlist',data);
          if (data.hasOwnProperty(key)) {
            cnt = countr;
            ok1 += "<div class=\"prson\"><div class=\"botson\" style=\"background-image:url(https://indiediscotheque.com/robots/" + data[key].id + "" + data[key].name + ".png?size=110x110);\"></div><span class=\"prsnName\">" + countr + ". " + data[key].name + "</span></div>";
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
            ok1 += "<div id=\"spt" + countr + "\" class=\"spot\"><div class=\"avtr\" id=\"avtr" + countr + "\" style=\"background-image: url(https://indiediscotheque.com/robots/" + data[key].id + "" + data[key].name + ".png?size=110x110);\"></div><div id=\"djthing" + countr + "\" class=\"djplaque\"><div class=\"djname\">" + data[key].name + "</div><div class=\"playcount\">" + data[key].plays + "/<span id=\"plimit" + countr + "\">" + firetable.playlimit + "</span></div></div></div>";
            countr++;
          }
        }
        if (countr < 4) {
          ok1 += "<div class=\"spot empty\"><div class=\"djplaque\"><div class=\"djname\"></div><div class=\"playcount\">Type !addme</div></div></div>";
          countr++;
          for (var i = countr; i < 4; i++) {
            ok1 += "<div class=\"spot empty\"><div class=\"djplaque\">&nbsp;</div></div>";
          }
        }

      } else {
        ok1 += "<div class=\"spot empty\"><div class=\"djplaque\"><div class=\"djname\"></div><div class=\"playcount\">Type !addme</div></div></div>";
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
    ftapi.events.on("banListChanged", function(data){
      console.log(data);
      $("#activeSuspentions").html("");
      for (key in data) {
          if (data[key]){
            ftapi.actions.getUserByName(key, function(person){
              $("#activeSuspentions").append("<div class=\"importResult\"><div class=\"imtxt\">" + person.username + "</div><i role=\"button\" onclick=\"firetable.actions.unban('" + person.userid + "')\" class=\"material-icons\" title=\"Unsuspend\">&#xE5C9;</i></div>");
            });
          }
      }
    });
    ftapi.events.on("usersChanged", function(okdata) {
      if ($("#loggedInName").text() == ftapi.uid) {
        if (ftapi.users[ftapi.uid]) {
          if (ftapi.users[ftapi.uid].username){
            $("#loggedInName").text(ftapi.users[ftapi.uid].username);
          }
        }
      }
      if (ftapi.uid){
        if (ftapi.users[ftapi.uid]){
          if (ftapi.users[ftapi.uid].supermod){
            if ($("#ftSuperCopButton").is(":hidden")){
              $("#ftSuperCopButton").show();
            }
          }
        }
      }
      var newlist = "";
      var listBuild = [];
      var count = 0;
      for (var key in ftapi.users) {
        if (okdata.hasOwnProperty(key)) {
          var thisone = ftapi.users[key];
          var utitle = "";
            var thename = key;
            var rolenum = 0;
            count++;
            if (ftapi.users[key]) {
              if (ftapi.users[key].mod) {
                utitle = "cop";
                rolenum = 1;
              }
              if (ftapi.users[key].supermod) {
                utitle = "supercop";
                rolenum = 2;
              }
              if (ftapi.users[key].hostbot){
                utitle = "robocop";
                rolenum = 3;
              }
              if (ftapi.users[key].username) thename = ftapi.users[key].username;
            }
            var pguy = {
              id: key,
              name: thename,
              rolename: utitle,
              rolenum: rolenum
            };
            listBuild.push(pguy);

        }
      }
      listBuild.sort(function(a, b) {
            return b.rolenum - a.rolenum;
      });
      for (var i=0; i<listBuild.length; i++){
        newlist += "<div class=\"prson\"><div class=\"botson\" style=\"background-image:url(https://indiediscotheque.com/robots/" + listBuild[i].id + "" + listBuild[i].name + ".png?size=110x110);\"></div><span class=\"prsnName\">" + listBuild[i].name + "</span><span class=\"utitle\">" + listBuild[i].rolename + "</span></div>";
      }
      $("#allusers").html(newlist);
      $("#label1 .count").text(" (" + count + ")");
      firetable.debug && console.log('users:',okdata);
    });
    var $chatTemplate = $('#chatKEY').remove();
    ftapi.events.on("newChat", function(chatData){
      var namebo = chatData.id;
      var objDiv = document.getElementById("chatsWrap");
      var utitle = "";

      var you = ftapi.uid;
      if (ftapi.users[ftapi.uid]) {
        if (ftapi.users[ftapi.uid].username) you = ftapi.users[ftapi.uid].username;
      }

      if (ftapi.users[chatData.id]) {
        if (ftapi.users[chatData.id].username) namebo = ftapi.users[chatData.id].username;
        if (ftapi.users[chatData.id].mod) utitle = "cop";
        if (ftapi.users[chatData.id].supermod) utitle = "supercop";
        if (ftapi.users[chatData.id].hostbot) utitle = "robocop";
      } else if (chatData.name){
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
      scrollDown = false;
      if (firetable.utilities.isChatPrettyMuchAtBottom()) scrollDown = true;
      if (chatData.id == firetable.lastChatPerson && !badoop) {
        $("#chat" + firetable.lastChatId+" .chatContent").append("<div id=\"chattxt" + chatData.chatID + "\" class=\"chatText\"></div>");
        $("#chatTime" + firetable.lastChatId).text(firetable.utilities.format_time(chatData.time));
        var txtOut = firetable.ui.strip(chatData.txt);
        txtOut = firetable.ui.showImages(txtOut);
        txtOut = firetable.ui.textToLinks(txtOut);
        txtOut = firetable.utilities.emojiShortnamestoUnicode(txtOut);
        txtOut = txtOut.replace(/\`(.*?)\`/g, function (x) {
          return "<code>"+x.replace(/\`/g, "") +"</code>";
        });
        $("#chattxt"+chatData.chatID).html(txtOut);
        twemoji.parse(document.getElementById("chattxt"+chatData.chatID));

      } else {
        var $chatthing = $chatTemplate.clone();
        $chatthing.attr('id',"chat"+chatData.chatID);
        $chatthing.find('.botson').css('background-image',"url(https://indiediscotheque.com/robots/" + chatData.id + namebo + ".png?size=110x110");
        $chatthing.find('.utitle').html(utitle);
        $chatthing.find('.chatTime').attr('id',"chatTime" + chatData.chatID).html(firetable.utilities.format_time(chatData.time));
        if ( badoop ) $chatthing.addClass('badoop');
        var txtOut = firetable.ui.strip(chatData.txt);
        txtOut = firetable.ui.showImages(txtOut);
        txtOut = firetable.ui.textToLinks(txtOut);
        txtOut = firetable.utilities.emojiShortnamestoUnicode(txtOut);
        txtOut = txtOut.replace(/\`(.*?)\`/g, function (x) {
          return "<code>"+x.replace(/\`/g, "") +"</code>";
        });
        $chatthing.find(".chatText").html(txtOut).attr('id',"chattxt" + chatData.chatID);
        $chatthing.find(".chatName").text(namebo);
        twemoji.parse($chatthing.find(".chatText")[0]);
        $chatthing.appendTo("#chats");
        firetable.lastChatPerson = chatData.id;
        firetable.lastChatId = chatData.chatID;
      }

      if (chatData.card){
        $("#chattxt"+chatData.chatID).append("<canvas width=\"225\" height=\"300\" class=\"chatCard\" id=\"cardMaker"+chatData.chatID+"\"></canvas>");

        firetable.actions.showCard(chatData.card, chatData.chatID);
        firetable.debug && console.log("showin card");
      }
      scrollits['chatsWrap'].update();
      if (scrollDown) objDiv.scrollTop = objDiv.scrollHeight - objDiv.clientHeight;
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
          var plref = firebase.database().ref("playlists/" + ftapi.uid);
          var newlist = plref.push();
          var listid = newlist.key;
          var obj = {
            name: val,
            list: {}
          };
          newlist.set(obj);
          $("#listpicker").append("<option id=\"pdopt" + listid + "\" value=\"" + listid + "\">" + val + "</option>");
          $("#listpicker").val(listid).change();
          var uref = firebase.database().ref("users/" + ftapi.uid + "/selectedList");
          uref.set(listid);
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
          if (timeSince <= 0 ) timeSince = 0;

          var secSince = Math.floor(timeSince / 1000);
          var timeLeft = firetable.song.duration - secSince;
          if (firetable.song.type == 1) {
            if (!firetable.preview) {
              if (firetable.scLoaded) firetable.scwidget.pause();
              player.loadVideoById(firetable.song.cid, secSince, "large");
            }
          } else if (firetable.song.type == 2) {
            if (!firetable.preview) {
              if (firetable.ytLoaded) player.stopVideo();
              firetable.scSeek = timeSince;
              firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
                auto_play: true
              });
            }
          }
        }
      }
    });

    $("#grab").bind("click", function(){
      var isHidden = $("#stealContain").is( ":hidden" );
      if (isHidden){
        var allQueues = firebase.database().ref("playlists/" + ftapi.uid);
        allQueues.once('value')
          .then(function(allQueuesSnap) {
            var allPlaylists = allQueuesSnap.val();
            $("#stealpicker").html("<option value=\"-1\">Where to?</option><option value=\"0\">Default Queue</option>");
            for (var key in allPlaylists) {
              if (allPlaylists.hasOwnProperty(key)) {
                $("#stealpicker").append("<option value=\"" + key + "\">" + allPlaylists[key].name + "</option>");
              }
            }
            $('#grab').addClass('on');
            $( "#stealContain" ).css({ 'top': $('#grab').offset().top + $('#grab').height(), 'left': $('#grab').offset().left - 16 }).show();
          });

      } else {
        $('#grab').removeClass('on');
        $( "#stealContain" ).hide();
      }
    });
    $("#shuffleQueue").bind("click", firetable.actions.shuffleQueue);
    $("#history").bind("click", function() {
      $("#thehistoryWrap").slideToggle().css('top', $('#stage').outerHeight() + $('#topbar').outerHeight());
      $(this).toggleClass('on');
    });
    $("#startMerge").bind("click", function() {
        var source = $("#mergepicker").val();
        var sourceName = $( "#mergepicker option:selected" ).text();
        var dest = $("#mergepicker2").val();
        var destName = $( "#mergepicker2 option:selected" ).text();
        $("#mergeSetup").hide();
        $("#mergeHappening").show();
        firetable.debug && console.log(sourceName + " -> " + destName);
        firetable.actions.mergeLists(source, dest, sourceName);
    });
    $("#mergeOK").bind("click", function() {
        $("#mergeSetup").show();
        $("#mergeCompleted").hide();
        $("#mergeHappening").hide();
        $( "#mergeContain" ).hide();
    });
    $("#mergeLists").bind("click", function() {
      var $this = $(this);
       var isHidden = $("#mergeContain").is( ":hidden" );
       if (isHidden){
         var allQueues = firebase.database().ref("playlists/" + ftapi.uid);
         allQueues.once('value')
           .then(function(allQueuesSnap) {
             var allPlaylists = allQueuesSnap.val();
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
            $( "#mergeContain" ).show();
            $this.addClass('on');
           });

       } else {
         $( "#mergeContain" ).hide();
         $this.removeClass('on');
        }
    });
    $("#reloadtrack").bind("click", firetable.actions.reloadtrack);

    $("#volstatus").bind("click", function() {
      firetable.actions.muteToggle();
    });
    $(".openModal").bind("click", function() {
      var modalContentID = $(this).attr('data-modal');
      $(".modalThing").hide();
      $("#overlay").css("display","flex");
      $("#"+modalContentID).show();
    });
    $(".closeModal").bind("click", function() {
      $("#overlay").hide();
      $("#tagMachine").val("");
      $("#tagSongLink").attr("href", "https://youtube.com");
      firetable.songTagToEdit = null;
      $("#deletepicker").html("");
      firetable.actions.cardCase();
      $("#plMachine").val("");
    });
    $("#cardCaseButton").bind("click", function() {
      firetable.actions.cardCase();
      $("#cardsOverlay").show();
    });
    $("#pickerNav").on("click", "i", function() {
       try {
         var sec =$(this)[0].id;
         firetable.emojis.sec(sec);
       } catch (s) {}
    });
    $("#pickEmoji").bind("click", function() {
      //toggle emoji picker
      if ($("#emojiPicker").is(":hidden")){
        $(this).addClass('on');
        $("#emojiPicker").slideDown(function(){
          $('#pickerSearch').focus();
        });

        if (!firetable.pickerInit){
          const makeRequest = async () => {
            twemoji.parse(document.getElementById("pickerResults"));
            return true;
          }

          makeRequest()
        }
      } else {
        $(this).removeClass('on');
        $("#emojiPicker").slideUp(function(){
          $('#pickerSearch').val('').trigger('change');
          $('#newchat').focus();
        });
      }
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
$(document).on('click', '.hideImage', function(e){
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
  firetable.debug && console.log('screen control:',this.value);
  localStorage["firetableScreenControl"] = this.value;
  firetable.screenControl = this.value;
  if (this.value == "off"){
    firetable.utilities.screenUp();
  } else if (this.value == "on"){
    firetable.utilities.screenDown();
  } else if (this.value == "sync"){
    if (firetable.screenSyncPos){
      firetable.utilities.screenDown();
    } else {
      firetable.utilities.screenUp();
    }
  }
});


$("#stealpicker").change(function() {
  var dest = $("#stealpicker").val();
  if (dest == "-1") return;
  var destref;
  if (dest == 0){
    destref = firebase.database().ref("queues/" + ftapi.uid);
  } else {
    destref = firebase.database().ref("playlists/" + ftapi.uid + "/" + dest + "/list");
  }
  if (firetable.song.cid != 0) {
    var title = firetable.song.artist + " - " + firetable.song.title;
    $("#grab").removeClass('on');
    var info = {
      type: firetable.song.type,
      name: title,
      cid: firetable.song.cid
    };
    destref.push(info);
    $( "#stealContain" ).hide();
  }

});

    $("#pldeleteButton").bind("click", function() {
      var val = $("#deletepicker").val();
      firetable.debug && console.log('playlist delete:',val);
      if (ftapi.users[ftapi.uid]) {
        if (ftapi.users[ftapi.uid].selectedList) {
          if (ftapi.users[ftapi.uid].selectedList == val) {
            $("#listpicker").val("0").change();
          }
        }
      }
      var removeThis = firebase.database().ref("playlists/" + ftapi.uid + "/" + val);
      $("#pdopt" + val).remove();
      removeThis.remove()
        .then(function() {
          firetable.debug && console.log("pl remove went great.");

        })
        .catch(function(error) {
          firetable.debug && console.log("pl Remove failed: " + error.message);
        });
      $("#overlay").hide();
    });
    $("#plimportLauncher").bind("click", function() {
      $("#overlay").css("display", "flex");
      $(".modalThing").hide();
      $('#importPromptBox').show();
    });
    $("#pldeleteLauncher").bind("click", function() {
      var allQueues = firebase.database().ref("playlists/" + ftapi.uid);
      allQueues.once('value')
        .then(function(allQueuesSnap) {
          var allPlaylists = allQueuesSnap.val();
          $("#deletepicker").html("");
          for (var key in allPlaylists) {
            if (allPlaylists.hasOwnProperty(key)) {
              $("#deletepicker").append("<option value=\"" + key + "\">" + allPlaylists[key].name + "</option>");
            }
          }
          $("#overlay").css("display", "flex");
          $(".modalThing").hide();
          $('#deletePromptBox').show();
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
         var newval = oldval + ":"+ $(this).attr("title").trim() + ":";
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
    $("#tagMachine").bind("keyup", function(e) {
      if (e.which == 13) {
        if (firetable.songToEdit) {
          var val = $("#tagMachine").val();
          if (val != "") {
            var obj = firetable.songToEdit;
            obj.song.name = val;
            firetable.actions.editSongTag(obj);
            firetable.songToEdit = null;
            $("#tagMachine").val("");
            $("#tagSongLink").attr("href", "https://youtube.com");
            $("#overlay").hide();
          }
        }
      }
    });
    $("#supercopSearch").bind("keyup", function(e) {
      if (e.which == 13) {
          var val = $("#supercopSearch").val();
          $("#supercopResponse").html("");
          if (val != "") {
            //begin user search...
            ftapi.actions.getUserByName(val, function(person){
              console.log(person);
              //check search results
              if (person) {
                //found something!
                if (!person.supermod) {
                  ftapi.actions.banUser(person.userid);
                  $("#supercopResponse").html("<span style=\"color: " + firetable.orange + ";\">" + person.username + " suspended.</span>");

                } else {
                  $("#supercopResponse").html("<span style=\"color: red; \">Can not suspend that (or any) supercop.</span>");
                }
              } else {
                $("#supercopResponse").html("<span style=\"color: red;\">" + val + " not found...</span>");
              }
            });
          }
        }
    });
    $("#importSources .tab").bind( "click", function( e ) {
      var searchFrom = firetable.importSelectsChoice;
      if ( searchFrom == 2 ) {
        $("#byId").hide();
      } else {
        $("#byId").show();
      }
      $(this).siblings().removeClass('on');
      $(this).addClass('on');
    });
    $("#plMachineById").bind( "change keyup input", function( e ) {
      var searchFrom = firetable.importSelectsChoice;
      // YouTube playlist IDs are 34 characters. Full URL is 72 characters
      if ( (searchFrom == 1 && this.value.length === 18) || (searchFrom == 1 && this.value.length === 34) || (searchFrom == 1 && this.value.length === 56) || (searchFrom == 1 && this.value.length === 72) ) {
        $("#plMachineById + button").prop( 'disabled', false );
      } else {
        $("#plMachineById + button").prop( 'disabled', true );
      };
    });
    $("#plMachineById + button").bind( "click", function( e ) {
      var regex = /(?:list=)/
      var ytPlId = $("#plMachineById").val().split(regex);
      function keyWordsearch() {
        gapi.client.setApiKey('AIzaSyDCXzJ9gGLTF_BLcTzNUO2Zeh4HwPxgyds');
        gapi.client.load('youtube', 'v3', function() {
          makeRequest();
        });
      }

      function makeRequest() {
        var request = gapi.client.youtube.playlists.list({
          id: ytPlId[ytPlId.length - 1],
          part: 'snippet'
        });
        request.execute(function(response) {
          if (response.result) {
            if (response.result.items) {
              if (response.result.items.length === 1) {
                var playlistTitle = response.result.items[0].snippet.title;
                confirm("Importing playlist: "+playlistTitle);
                firetable.actions.importList( ytPlId[ytPlId.length - 1], playlistTitle, 1);
                $("#plMachineById + button").prop( 'disabled', true );
              } else {
                alert("There is no YouTube playlist with that ID.");
              }
            }
          }
        })
      }
      keyWordsearch();
    });
    $("#plMachine").bind("keyup", function(e) {
      if (e.which == 13) {
        var val = $("#plMachine").val();
        if (val != "") {
          $("#importResults").html("");
          $("#plMachine").val("");
          var searchFrom = firetable.importSelectsChoice;
          if (searchFrom == 1) {
            //youtube
            function keyWordsearch() {
              gapi.client.setApiKey('AIzaSyDCXzJ9gGLTF_BLcTzNUO2Zeh4HwPxgyds');
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
                firetable.debug && console.log('import search results:',response);
                $.each(srchItems, function(index, item) {
                  vidTitle = item.snippet.title;
                  $("#importResults").append("<div class=\"importResult\"><div class=\"imtxt\">" + item.snippet.title + " by " + item.snippet.channelTitle + "</div><a target=\"_blank\" href=\"https://www.youtube.com/playlist?list=" + item.id.playlistId + "\" class=\"importLinkCheck\"><i class=\"material-icons\">&#xE250;</i></a> <i role=\"button\" onclick=\"firetable.actions.importList('" + item.id.playlistId + "', '" + firetable.utilities.htmlEscape(item.snippet.title) + "', 1)\" class=\"material-icons\" title=\"Import\">&#xE02E;</i></div>");
                })
              })
            }
            keyWordsearch();

          } else if (searchFrom == 2) {
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
    });
    var $searchItemTemplate = $('#searchResults .pvbar').remove();
    $("#qsearch").bind("keyup", function(e) {
      if (e.which == 13) {
        var txt = $("#qsearch").val();
        if (firetable.searchSelectsChoice == 1) {
          function keyWordsearch() {
            gapi.client.setApiKey('AIzaSyDCXzJ9gGLTF_BLcTzNUO2Zeh4HwPxgyds');
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
              firetable.debug && console.log('queue search:',response);
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
                  if (timeSince <= 0 ) timeSince = 0;

                  var secSince = Math.floor(timeSince / 1000);
                  var timeLeft = firetable.song.duration - secSince;
                  if (firetable.song.type == 1) {
                    if (!firetable.preview) {
                      if (firetable.scLoaded) firetable.scwidget.pause();
                      player.loadVideoById(firetable.song.cid, secSince, "large");
                    }
                  } else if (firetable.song.type == 2) {
                    if (!firetable.preview) {
                      if (firetable.ytLoaded) player.stopVideo();
                      firetable.scSeek = timeSince;
                      firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
                        auto_play: true
                      });
                    }
                  }
                }
              }
              var srchItems = response.result.items;
              $.each(srchItems, function(index, item) {
                vidTitle = item.snippet.title;
                var pkey = "ytcid" + item.id.videoId;
                var $srli = $searchItemTemplate.clone();
                $srli.attr('id', "pvbar" + pkey);
                $srli.attr( "data-key", pkey );
                $srli.attr( "data-cid", item.id.videoId );
                $srli.find('.previewicon').attr('id', "pv" + pkey).on('click', function(){
                  firetable.actions.pview($(this).parent().attr('data-key'), true, 1);
                });
                $srli.find('.listwords').html(vidTitle);
                $srli.find('.queuetrack').on('click', function(){
                  firetable.actions.queueTrack(
                    $(this).parent().attr('data-cid'),
                    firetable.utilities.htmlEscape($(this).parent().find('.listwords').text()),
                    1
                  );
                });
                $("#searchResults").append($srli);
              })
            })
          }
          keyWordsearch();

        } else if (firetable.searchSelectsChoice == 2) {
          var q = $('#qsearch').val();
          $('#searchResults').html("Searching...");
          SC.get('/tracks', {
            q: q
          }).then(function(tracks) {
            firetable.debug && console.log('sc tracks:',tracks);
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
                if (timeSince <= 0 ) timeSince = 0;

                var secSince = Math.floor(timeSince / 1000);
                var timeLeft = firetable.song.duration - secSince;
                if (firetable.song.type == 1) {
                  if (!firetable.preview) {
                    firetable.scwidget.pause();
                    player.loadVideoById(firetable.song.cid, secSince, "large");
                  }
                } else if (firetable.song.type == 2) {
                  if (!firetable.preview) {
                    if (firetable.ytLoaded) player.stopVideo();
                    firetable.scSeek = timeSince;
                    firetable.scwidget.load("http://api.soundcloud.com/tracks/" + firetable.song.cid, {
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
              $srli.attr( "data-key", pkey );
              $srli.attr( "data-cid", item.id );
              $srli.find('.previewicon').attr('id', "pv" + pkey).on('click', function(){
                firetable.actions.pview(
                  $(this).parent().attr('data-key'),
                  true,
                  2
                );
              });
              $srli.find('.listwords').html(vidTitle);
              $srli.find('.queuetrack').on('click', function(){
                firetable.actions.queueTrack(
                  $(this).parent().attr('data-cid'),
                  firetable.utilities.htmlEscape($(this).parent().find('.listwords').text()),
                  2
                );
              });
              $("#searchResults").append($srli);
            })
          });
        }
      }
    });
    $("#newchat").bind("keyup", function(e) {
      if (e.which == 13) {
        var txt = $("#newchat").val();
        if (txt == "") return;
        var matches = txt.match(/^(?:[\/])(\w+)\s*(.*)/i);
        if (txt == ":fire:" || txt == "🔥"){
          $("#cloud_with_rain").removeClass("on");
          $("#fire").addClass("on");
        } else if (txt == ":cloud_with_rain:" || txt == "🌧"){
          $("#cloud_with_rain").addClass("on");
          $("#fire").removeClass("on");
        }
        if (matches) {
          var command = matches[1].toLowerCase();
          var args = matches[2];
          if (command == "mod") {
            var personToMod = firetable.actions.uidLookup(args);
            if (personToMod) {
              var modp = firebase.database().ref("users/" + personToMod + "/mod");
              modp.set(true);
            }
          } else if (command == "unmod") {
            var personToMod = firetable.actions.uidLookup(args);
            if (personToMod) {
              var modp = firebase.database().ref("users/" + personToMod + "/mod");
              modp.set(false);
            }
          } else if (command == "hot") {
            ftapi.actions.sendChat(":hot:");
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
        var objDiv = document.getElementById("chatsWrap");
        objDiv.scrollTop = objDiv.scrollHeight - objDiv.clientHeight;
    }

    });
    ftapi.events.on("colorsChanged", function(data){
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
      $("head").append("<style class='customColorStyles'>:focus { box-shadow: 0 0 0.5rem " + firetable.color + "; } .djActive, #addToQueueBttn, .butt:not(.graybutt), .ui-slider-horizontal .ui-slider-range-min { background-color: " + firetable.color + "; color: " + firetable.countcolor + "; } .iconbutt.on { color: " + firetable.color + "; border-bottom: 1px solid " + firetable.color + "66; box-shadow: inset 0 0 1rem " + firetable.color + "33; }</style>");
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
      if (!$.contains(document.getElementById("mainqueue"), event.target)) return;
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

var scrollits = [];
$('.scrollit').each(function(){
  scrollits[$(this).attr('id')] = new PerfectScrollbar($(this)[0], { minScrollbarLength: 30 });
});
firetable.debug && console.log('scrollits',scrollits);


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
        $can.data('ratio',canrat);
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
