var firetable = {
  started: false,
  uid: null,
  pvCount: 0,
  playdex: 0,
  users: {},
  queue: false,
  preview: false,
  movePvBar: null,
  moveBar: null,
  song: null,
  playBadoop: true,
  screenControl: "sync",
  screenSyncPos: false,
  scSeek: false,
  color: "#F4810B",
  countcolor: "#fff",
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
  scImg: ""
}

firetable.version = "00.04.41";
var player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('playerArea', {
    width: 500,
    height: 293,
    playerVars: {
      'autoplay': 1,
      'controls': 0
    },
    videoId: '0',
    events: {
      onReady: initialize
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
  }

  if (muted != "false") {
    var icon = "&#xE04E;";
    $("#volstatus").html(icon);

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
        $("#volstatus").html(icon);
      } else if (ui.value == 0) {
        firetable.actions.muteToggle(true);
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
  console.log("Yo sup welcome to firetable my name is chris rohn.")
  firetable.started = true;
  var config = {
    apiKey: "AIzaSyDdshWtOPnY_0ACt6uJKmcI_qPpTfO4sJ4",
    authDomain: "firetable-e10fd.firebaseapp.com",
    databaseURL: "https://firetable-e10fd.firebaseio.com"
  };
  firetable.parser = new DOMParser();
  var height = $(window).height(); // New height
  var w = $(window).width();
  console.log(w);
  if (w > 1199) {
    if (height > 520) {
      var morethan = height - 520;
      var newh = 128 + morethan;
      var chah = 451 + morethan;
      var newu = 455 + morethan;
      $("#queuelist").css("height", newh + "px");
      $("#userslist").css("height", newu + "px");
      $("#actualChat").css("height", chah + "px");
    } else {
      $("#queuelist").css("height", "128px");
      $("#userslist").css("height", "440px");
      $("#actualChat").css("height", "441px");

    }
    var histheight = height - 175;
    $("#recentHistory").css("height", histheight+ "px");
  } else if (w > 799) {
    var newh = height - 282;
    if (height > 520) {
      var morethan = height - 520;

      var chah = 451 + morethan;
      var newu = 455 + morethan;
      $("#queuelist").css("height", newh + "px");
      $("#userslist").css("height", newu + "px");
      $("#actualChat").css("height", chah + "px");
    } else {

      $("#queuelist").css("height", "146px");
      $("#queuelist").css("height", newh + "px");
      $("#actualChat").css("height", "441px");

    }
    var histheight = height - 175;
    $("#recentHistory").css("height", histheight+ "px");
  } else {
    var chah = height - 286;
    var newu = height - 95;
    var newq = height - 124;

    $("#actualChat").css("height", chah + "px");
    $("#queuelist").css("height", newq + "px");
    $("#userslist").css("height", newu + "px");
    var histheight = height - 205;
    $("#recentHistory").css("height", histheight+ "px");
  }
  $(window).resize(function() {
    // This will execute whenever the window is resized
    var height = $(window).height(); // New height
    var w = $(window).width();
    if (w > 1199) {
      if (height > 520) {
        var morethan = height - 520;
        var newh = 128 + morethan;
        var chah = 451 + morethan;
        var newu = 455 + morethan;
        $("#queuelist").css("height", newh + "px");
        $("#userslist").css("height", newu + "px");
        $("#actualChat").css("height", chah + "px");
      } else {
        $("#queuelist").css("height", "128px");
        $("#userslist").css("height", "458px");
        $("#actualChat").css("height", "441px");

      }
      var histheight = height - 175;
    //  console.log(histheight);
      $("#recentHistory").css("height", histheight+ "px");
      windowW =  $(window).width() * 0.75 - (($(window).width() * 0.75) * 0.25);
      setup();
    } else if (w > 799) {
      var newh = height - 282;
      if (height > 520) {
        var morethan = height - 520;

        var chah = 451 + morethan;
        var newu = 455 + morethan;
        $("#queuelist").css("height", newh + "px");
        $("#userslist").css("height", newu + "px");
        $("#actualChat").css("height", chah + "px");
      } else {

        $("#queuelist").css("height", "128px");
        $("#queuelist").css("height", newh + "px");
        $("#actualChat").css("height", "441px");

      }
      var histheight = height - 175;
      $("#recentHistory").css("height", histheight+ "px");
    } else {
      var chah = height - 286;
      var newu = height - 95;
      var newq = height - 124;
      $("#actualChat").css("height", chah + "px");
      $("#queuelist").css("height", newq + "px");
      $("#userslist").css("height", newu + "px");
      var histheight = height - 205;
      $("#recentHistory").css("height", histheight+ "px");
    }
  });
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


  firebase.initializeApp(config);
  SC.initialize({
    client_id: "27028829630d95b0f9d362951de3ba2c"
  });
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      firetable.uid = user.uid;
      console.log("user signed in!");
      if (firetable.users[firetable.uid]) {
        if (firetable.users[firetable.uid].username) {
          $("#loggedInEmail").text(firetable.users[firetable.uid].username);
        } else {
          $("#loggedInEmail").text(user.uid);
        }
      } else {
        $("#loggedInEmail").text(user.uid);
      }
      var ref0 = firebase.database().ref("users/" + user.uid + "/status");
      ref0.set(true);
      ref0.onDisconnect().set(false);
      var getSelect = firebase.database().ref("users/" + firetable.uid + "/selectedList");
      var allQueues = firebase.database().ref("playlists/" + firetable.uid);
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
                firetable.queueRef = firebase.database().ref("queues/" + firetable.uid);
              } else {
                firetable.queueRef = firebase.database().ref("playlists/" + firetable.uid + "/" + firetable.selectedListThing + "/list");
              }
              $("#listpicker").val(firetable.selectedListThing).change();
              $("#listpicker").change(function() {
                var val = $("#listpicker").val();
                if (val == "1") {
                  //ADD PLAYLIST SCREEN
                  $("#mainqueue").css("display", "none");
                  $("#addbox").css("display", "none");
                  $("#plmanager").css("display", "block");

                } else if (val != firetable.selectedListThing) {
                  //LOAD SELECTED LIST
                  //change selected list in user obj
                  $("#mainqueue").css("display", "block");
                  $("#addbox").css("display", "none");
                  $("#plmanager").css("display", "none");
                  var uref = firebase.database().ref("users/" + firetable.uid + "/selectedList");
                  uref.set(val);
                  firetable.selectedListThing = val;
                  firetable.queueRef.off("value", firetable.queueBind); //stop listening for changes on old list
                  if (firetable.selectedListThing == "0") {
                    firetable.queueRef = firebase.database().ref("queues/" + firetable.uid);
                  } else {
                    firetable.queueRef = firebase.database().ref("playlists/" + firetable.uid + "/" + firetable.selectedListThing + "/list");
                  }
                  firetable.queueBind = firetable.queueRef.on('value', function(dataSnapshot) {
                    var okdata = dataSnapshot.val();
                    firetable.queue = okdata;
                    var newlist = "";
                    console.log(okdata);
                    for (var key in okdata) {
                      if (okdata.hasOwnProperty(key)) {
                        var thisone = okdata[key];
                        var psign = "&#xE037;";
                        if (key == firetable.preview) {
                          psign = "&#xE034;";
                        }
                        newlist += "<div id=\"qid" + key + "\" class=\"qitem\"><div class=\"pvbar\" id=\"pvbar" + key + "\"><div class=\"qtxt\"><i id=\"pv" + key + "\" class=\"material-icons previewicon\" onclick=\"firetable.actions.pview('" + key + "', false,  " + thisone.type + ")\">" + psign + "</i> <span class=\"listwords\">" + thisone.name + "</span></div><div class=\"delete\"><i onclick=\"firetable.actions.bumpSongInQueue('" + key + "')\" class=\"material-icons\">&#xE5D8;</i> <i onclick=\"firetable.actions.editTagsPrompt('" + key + "')\" class=\"material-icons\">&#xE22B;</i> <i onclick=\"firetable.actions.deleteSong('" + key + "')\" class=\"material-icons\">&#xE5C9;</i></div><div class=\"clear\"></div></div></div>";
                      }
                    }
                    $("#mainqueue").html(newlist);

                  });
                } else {
                  //you selected the thing you already had selected.
                  $("#mainqueue").css("display", "block");
                  $("#addbox").css("display", "none");
                  $("#plmanager").css("display", "none");
                }
              });
              firetable.queueBind = firetable.queueRef.on('value', function(dataSnapshot) {
                var okdata = dataSnapshot.val();
                firetable.queue = okdata;
                var newlist = "";
                for (var key in okdata) {
                  if (okdata.hasOwnProperty(key)) {
                    var thisone = okdata[key];
                    var psign = "&#xE037;";
                    if (key == firetable.preview) {
                      psign = "&#xE034;";
                    }
                    newlist += "<div id=\"qid" + key + "\" class=\"qitem\"><div class=\"pvbar\" id=\"pvbar" + key + "\"><div class=\"qtxt\"><i id=\"pv" + key + "\" class=\"material-icons previewicon\" onclick=\"firetable.actions.pview('" + key + "', false,  " + thisone.type + ")\">" + psign + "</i> <span class=\"listwords\">" + thisone.name + "</span></div><div class=\"delete\"><i onclick=\"firetable.actions.bumpSongInQueue('" + key + "')\" class=\"material-icons\">&#xE5D8;</i> <i onclick=\"firetable.actions.editTagsPrompt('" + key + "')\" class=\"material-icons\">&#xE22B;</i> <i onclick=\"firetable.actions.deleteSong('" + key + "')\" class=\"material-icons\">&#xE5C9;</i></div><div class=\"clear\"></div></div></div>";
                  }
                }
                $('#mainqueue').sortable({
                  start: function(event, ui) {
                    var start_pos = ui.item.index();
                    ui.item.data('start_pos', start_pos);
                  },
                  change: function(event, ui) {

                  },
                  update: function(event, ui) {
                    console.log("UPDATE");
                    firetable.actions.updateQueue();
                  }
                });
                $("#mainqueue").html(newlist);
              });
            });
        });
      $("#signOut").html("<span onclick=\"firetable.actions.logOut()\" id=\"logOutButton\">Log Out</span>");
      $("#login").css("display", "none");
      $("#queuebox").css("display", "block");
      $("#actualChat").css("display", "block");
      $("#newchat").css("display", "block");
      $("#grab").css("display", "inline-block");
      $("#notloggedin").css("display", "none");
    } else {
      firetable.uid = null;
      $("#loggedInEmail").text("Not Logged In");
      $("#signOut").html("");
      $("#login").css("display", "block");
      $("#queuebox").css("display", "none");
      $("#actualChat").css("display", "none");
      $("#newchat").css("display", "none");
      $("#grab").css("display", "none");
      $("#notloggedin").css("display", "block");

    }
  });
  firetable.ui.init();
};

firetable.actions = {
  logOut: function() {
    var ref0 = firebase.database().ref("users/" + firetable.uid + "/status");
    firetable.uid = null;
    ref0.set(false);
    firebase.auth().signOut();
  },
  logIn: function(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      if (errorCode === 'auth/wrong-password') {
        alert('Wrong password.');
      } else {
        alert(errorMessage);
      }
      console.log(error);
    });
  },
  muteToggle: function(zeroMute) {

    var muted = localStorage["firetableMute"];
    var icon = "&#xE050;";
    console.log(muted);
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


    $("#volstatus").html(icon);
    localStorage["firetableMute"] = muted;
  },
  pview: function(id, fromSearch, type) {
    if (firetable.preview == id) {
      //already previewing this. stop and resume regular song
      clearTimeout(firetable.ptimeout);
      firetable.ptimeout = null;
      $("#pv" + firetable.preview).html("&#xE037;");
      $("#pvbar" + firetable.preview).css("background", "none");
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
        $("#pvbar" + firetable.preview).css("background", "none");
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
        $("#pvbar" + firetable.preview).css("background", "none");
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
        $("#pvbar" + firetable.preview).css("background", "linear-gradient(90deg, #2c4e61 " + pcnt + "%, #212121 " + pcnt + "%)");
      }, 200);
      if (type == 1) {
        if (firetable.scLoaded) firetable.scwidget.pause();
        player.loadVideoById(cid, "large")
      } else if (type == 2) {
        if (firetable.ytLoaded) player.stopVideo();
        firetable.scSeek = false;
        firetable.scwidget.load("http://api.soundcloud.com/tracks/" + cid, {
          auto_play: true
        });
      }


    }

  },
  queueFromLink(link) {
    if (link.match(/youtube.com\/watch/)) {
      //youtube
      console.log("yt");

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
            console.log(response);
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
      console.log("sc");
      var getComments = function(track) {
        return SC.get("tracks/" + track.id);
      };

      var listComments = function(tracks) {
        console.log(tracks);
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
      var idraw = theid.slice(3);
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
        console.log(changePv);
      }
    }
    if (changePv) firetable.preview = changePv;
    firetable.queueRef.set(newobj);
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

    console.log(songid);
    firetable.songToEdit = {
      song: song,
      key: songid
    };
    $("#tagPromptOverlay").css("display", "block");
  },
  importList(id, name, type) {
    //time to IMPORT SOME LISTS!
    $("#importPromptOverlay").css("display", "none");
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
            console.log(finalList);
            var plref = firebase.database().ref("playlists/" + firetable.uid);
            var newlist = plref.push();
            var listid = newlist.key;
            var obj = {
              name: name,
              list: {}
            };
            newlist.set(obj);
            $("#listpicker").append("<option id=\"pdopt" + listid + "\" value=\"" + listid + "\">" + name + "</option>");
            var nref = firebase.database().ref("playlists/" + firetable.uid + "/" + listid + "/list");
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
        console.log(listinfo.tracks);
        var plref = firebase.database().ref("playlists/" + firetable.uid);
        var newlist = plref.push();
        var listid = newlist.key;
        var obj = {
          name: name,
          list: {}
        };
        newlist.set(obj);
        $("#listpicker").append("<option id=\"pdopt" + listid + "\" value=\"" + listid + "\">" + name + "</option>");
        var nref = firebase.database().ref("playlists/" + firetable.uid + "/" + listid + "/list");
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
        console.log(theid);
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
        console.log("song remove went great.");

      })
      .catch(function(error) {
        console.log("Song Remove failed: " + error.message);
      });
  },
  uidLookup: function(name) {
    var match = false;
    var usrs = firetable.users;
    for (var key in usrs) {
      if (usrs.hasOwnProperty(key)) {
        if (firetable.users[key].username) {
          if (firetable.users[key].username == name) {
            match = key;
          }
        }
      }
    }
    if (!match && firetable.users[name]) match = name;
    return match;
  },
  grab: function() {
    if (firetable.song.cid != 0) {
      var title = firetable.song.artist + " - " + firetable.song.title;
      firetable.actions.queueTrack(firetable.song.cid, title, firetable.song.type, true);
      $("#grab").addClass("grabbed");
    }
  },
  reloadtrack: function() {
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
  },
  queueTrack: function(cid, name, type, tobottom) {
    var info = {
      type: type,
      name: name,
      cid: cid
    };
    $("#apv" + type + cid).text("check");
    $("#apv" + type + cid).css("color", "green");
    $("#apv" + type + cid).css("pointer-events", "none");
    var cuteid = firetable.queueRef.push(info, function() {
      console.log(cuteid.key);
      if (!tobottom) firetable.actions.bumpSongInQueue(cuteid.key);
    });

    if (firetable.preview) {
      if (firetable.preview.slice(0, 5) == "ytcid" || firetable.preview.slice(0, 5) == "sccid") {
        $("#pv" + firetable.preview).html("&#xE037;");
        clearTimeout(firetable.ptimeout);
        firetable.ptimeout = null;
        $("#pvbar" + firetable.preview).css("background", "none");
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
    $("#mainqueue").css("display", "block");
    $("#addbox").css("display", "none");
  }
};

firetable.utilities = {
  playSound: function(filename) {
    if (firetable.playBadoop){
      document.getElementById("alert").innerHTML = '<audio autoplay="autoplay"><source src="' + filename + '.mp3" type="audio/mpeg" /><source src="' + filename + '.ogg" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + filename + '.mp3" /></audio>';
    }
  },
  screenUp: function(){
    $("#screenBox").animate({
      'top': '-300px'
    }, 2000);
    $("#volandthings").animate({
      'bottom': '0'
    }, 2000);
    $("#volplace").animate({
      'padding-left': '15px'
    }, 1000);
    $("#recentHistory").animate({
      'top': '175px'
    }, 1000);
    $("#track").animate({
      'margin-left': '0'
    }, 1000);
    $("#artist").animate({
      'margin-left': '0'
    }, 1000);
    $("#screenStyles").remove();
  },
  screenDown: function(){
    $("#screenBox").animate({
      'top': '36px'
    }, 5000);
    $("#volandthings").animate({
      'bottom': '123px'
    }, 1000);
    $("#volandthings").animate({
      'bottom': '123px'
    }, 1000);
    $("#volplace").animate({
      'padding-left': '55px'
    }, 1000);
    $("#recentHistory").animate({
      'top': '55px'
    }, 1000);
    $("#track").animate({
      'margin-left': '-120px'
    }, 2500);
    $("#artist").animate({
      'margin-left': '-120px'
    }, 2500);
    if($('#screenStyles').length == 0) {
      $("head").append("<style id=\"screenStyles\">#artist, #track, #timr, .djname{text-shadow: 1px 1px 0 black;}</style>")
    }
  },
  isChatPrettyMuchAtBottom: function() {
    var objDiv = document.getElementById("actualChat");
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
  }
};

firetable.ui = {
  textToLinks: function(text) {
    var re = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(re, "<a href=\"$1\" target=\"_blank\">$1</a>");
  },
  strip: function(html){
    var doc = firetable.parser.parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  },
  init: function() {
    //GET SETTINGS FROM LOCALSTORAGE
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
    var recentz = firebase.database().ref("songHistory");
    recentz.on('child_added', function(dataSnapshot, prev) {
        var data = dataSnapshot.val();
        var key = dataSnapshot.key;
        console.log("NEW HISTORY", data);

        var firstpart = "yt";
        if (data.type == 2) firstpart == "sc";
        var pkey = firstpart +"cid" + data.cid;

        $("#thehistory").prepend("<div id=\"recentthing"+key+"\" class=\"historyItem qresult\"><div class=\"histart\"><i id=\"pv" + pkey + "\" class=\"material-icons previewicon\" onclick=\"firetable.actions.pview('" + pkey + "', true, "+data.type+")\">&#xE037;</i></div><div class=\"pvbar\" id=\"pvbar" + pkey + "\"> <div class=\"qtxt\"><span class=\"listwords\"><a target=\"_blank\" href=\"" + data.url + "\">" + data.artist + " - "+data.title + "</a></span><div id=\"histmoreinfo\">played by "+data.dj+" on "+firetable.utilities.format_date(data.when)+" at "+firetable.utilities.format_time(data.when)+"</div></div><div class=\"delete\"><i id=\"apv" +data.type + data.cid + "\" class=\"material-icons\" onclick=\"firetable.actions.queueTrack('" + data.cid + "', '"+firetable.utilities.htmlEscape(data.artist + " - "+ data.title)+"', "+data.type+", true)\">&#xE03B;</i></div></div><div class=\"clear\"></div></div>");

        $($("#recentthing" + key).find(".histart")[0]).css("background-image", "url(" + data.img + ")");

    });
    var themeChange = firebase.database().ref("theme");
    themeChange.on('value', function(dataSnapshot) {
      var data = dataSnapshot.val();
      if (!data){
        //no theme
        $("#currentTheme").text("none");
        $("#actualChat").removeClass("themeTime");
        $("#themebox").hide();
      } else {
        $("#currentTheme").text(data);
        $("#actualChat").addClass("themeTime");
        $("#themebox").show();
      }
    });
    var tagUpdate = firebase.database().ref("tagUpdate");
    tagUpdate.on('value', function(dataSnapshot) {
      var data = dataSnapshot.val();
      console.log("TAG UPDATE", data);
      firetable.tagUpdate = data;
      if (firetable.song){
      if (firetable.song.cid == data.cid){
          $("#track").text(data.adamData.track_name);
          $("#artist").text(data.adamData.artist);
          var nicename = firetable.song.djname;
          var objDiv = document.getElementById("actualChat");
          scrollDown = false;
          if (firetable.utilities.isChatPrettyMuchAtBottom()) scrollDown = true;
          var showPlaycount = false;
          if (data.adamData.playcount){
            if (data.adamData.playcount > 0){
              showPlaycount = true;
            }
          }
          if (showPlaycount){
            $(".npmsg"+data.cid).last().html("<div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing<br/><strong>" + data.adamData.track_name + "</strong> by <strong>" + data.adamData.artist + "</strong><br/>This song has been played "+data.adamData.playcount+" times.</div>");
          } else {
            $(".npmsg"+data.cid).last().html("<div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing<br/><strong>" + data.adamData.track_name + "</strong> by <strong>" + data.adamData.artist + "</strong></div>");
          }
          if (scrollDown) objDiv.scrollTop = objDiv.scrollHeight - objDiv.clientHeight;
        }
      }
    });
    var s2p = firebase.database().ref("songToPlay");
    s2p.on('value', function(dataSnapshot) {
      var data = dataSnapshot.val();

      $("#timr").countdown("destroy");
      if (firetable.moveBar != null) {
        clearInterval(firetable.moveBar);
        firetable.moveBar = null;
      }
      $("#prgbar").css("background", "#151515");
      $("#grab").removeClass("grabbed");
      var showPlaycount = false;
      if (firetable.tagUpdate){
        if (data.cid == firetable.tagUpdate.cid){
          data.title = firetable.tagUpdate.adamData.track_name;
          data.artist = firetable.tagUpdate.adamData.artist;
          if (firetable.tagUpdate.adamData.playcount){
            if (firetable.tagUpdate.adamData.playcount > 0){
              showPlaycount = true;
            }
          }
        }
      }
      $("#track").text(data.title);
      $("#artist").text(data.artist);
      $("#albumArt").css("background-image", "url(" + data.image + ")")
      var nownow = Date.now();
      var timeSince = nownow - data.started;
      if (timeSince <= 0 ) timeSince = 0;
      var secSince = Math.floor(timeSince / 1000);
      var timeLeft = data.duration - secSince;
      firetable.song = data;
      console.log("NEW TRACK", data);
      console.log(timeSince);
      if (data.type == 1){
          $("#scScreen").hide();
      } else if (data.type ==2){
        $("#scScreen").show();
        var biggerImg = data.image.replace('-large', '-t500x500');
        firetable.scImg = biggerImg;
        try{
          setup(biggerImg);
        } catch (e){
          console.log(e)
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
        if (firetable.users[data.djid]) {
          if (firetable.users[data.djid].username) nicename = firetable.users[data.djid].username;
        }
        if (firetable.nonpmsg) {
          firetable.nonpmsg = false;
        } else {
          scrollDown = false;
          var objDiv = document.getElementById("actualChat");
          if (firetable.utilities.isChatPrettyMuchAtBottom()) scrollDown = true;
          if (showPlaycount){
            $("#actualChat").append("<div class=\"newChat nowplayn npmsg"+data.cid+"\"><div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing<br/><strong>" + data.title + "</strong> by <strong>" + data.artist + "</strong><br/>This song has been played "+firetable.tagUpdate.adamData.playcount+" times.</div>")
          } else {
            $("#actualChat").append("<div class=\"newChat nowplayn npmsg"+data.cid+"\"><div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing<br/><strong>" + data.title + "</strong> by <strong>" + data.artist + "</strong></div>")
          }
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
    var thescreen = firebase.database().ref("thescreen");
    thescreen.on('value', function(dataSnapshot) {
      var data = dataSnapshot.val();
      console.log(data);
      firetable.screenSyncPos = data;
      if (firetable.screenControl == "sync"){
      if (data) {
        firetable.utilities.screenDown();
      } else {
        firetable.utilities.screenUp();
      }
    }
    });
    var wl = firebase.database().ref("waitlist");
    wl.on('value', function(dataSnapshot) {
      var data = dataSnapshot.val();
      var ok1 = "";
      var lbl = "Waitlist (0)";
      if (data) {
        var countr = 1;
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            lbl = "Waitlist (" + countr + ")";
            ok1 += "<div class=\"prson\">" + countr + ". " + data[key].name + "</div>";
            countr++;
          }
        }
      }
      $("#label2").text(lbl);
      $("#justwaitlist").html(ok1);
    });
    var tbl = firebase.database().ref("table");
    tbl.on('value', function(dataSnapshot) {
      var data = dataSnapshot.val();
      var ok1 = "";
      if (data) {
        var countr = 0;
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            ok1 += "<div id=\"spt" + countr + "\" class=\"spot\"><div class=\"djname\">" + data[key].name + "</div><div class=\"avtr\" id=\"avtr" + countr + "\" style=\"background-repeat: no-repeat; background-position: bottom 18px center; background-image: url(https://robohash.org/" + data[key].id + "" + data[key].name + ".png?size=110x110);\"></div><div id=\"djthing" + countr + "\" class=\"playcount\">" + data[key].plays + "/<span id=\"plimit" + countr + "\">" + firetable.playlimit + "</span></div></div> ";
            countr++;
          }
        }
        if (countr < 4) {
          ok1 += "<div class=\"spot\"><div class=\"djname\"><br/><br/><strong>EMPTY seat!</strong> <br/>Type !addme to DJ right now.</div><div class=\"playcount\"></div></div> ";
          countr++;
          for (var i = countr; i < 4; i++) {
            ok1 += "<div class=\"spot\"><div class=\"playcount\"></div></div> ";
          }
        }

      } else {
        ok1 += "<div class=\"spot\"><div class=\"djname\"><br/><br/><strong>EMPTY seat!</strong><br/>Type !addme to DJ right now.</div><div class=\"playcount\"></div></div> ";
        for (var i = 0; i < 3; i++) {
          ok1 += "<div class=\"spot\"><div class=\"playcount\"></div></div> ";
        }
      }
      $("#deck").html(ok1);
      for (var i = 0; i < 4; i++) {
        if (i != firetable.playdex) {
          $("#djthing" + i).css("background-color", "#151515");
          $("#djthing" + i).css("color", "#eee");
          $("#avtr" + i).css("animation", "none");

        } else {
          $("#djthing" + i).css("background-color", firetable.color);
          $("#djthing" + i).css("color", firetable.countcolor);
          $("#avtr" + i).css("animation", "MoveUpDown 1s linear infinite");
        }
      }
    });
    var pldx = firebase.database().ref("playdex");
    pldx.on('value', function(dataSnapshot) {
      var data = dataSnapshot.val();
      firetable.playdex = data;
      for (var i = 0; i < 4; i++) {
        if (i != data) {
          $("#djthing" + i).css("background-color", "#151515");
          $("#djthing" + i).css("color", "#eee");
          $("#avtr" + i).css("animation", "none");

        } else {
          $("#djthing" + i).css("background-color", firetable.color);
          $("#djthing" + i).css("color", "#fff");
          $("#avtr" + i).css("animation", "MoveUpDown 1s linear infinite");

        }
      }
    });
    var plc = firebase.database().ref("playlimit");
    plc.on('value', function(dataSnapshot) {
      var data = dataSnapshot.val();
      firetable.playlimit = data;
      for (var i = 0; i < 4; i++) {
        $("#plimit" + i).text(data);
      }
    });
    var ref2 = firebase.database().ref("users");
    ref2.on('value', function(dataSnapshot) {
      var okdata = dataSnapshot.val();
      firetable.users = okdata;
      if ($("#loggedInEmail").text() == firetable.uid) {
        if (firetable.users[firetable.uid]) {
          if (firetable.users[firetable.uid].username) $("#loggedInEmail").text(firetable.users[firetable.uid].username);
        }
      }
      var newlist = "";
      var count = 0;
      for (var key in okdata) {
        if (okdata.hasOwnProperty(key)) {
          var thisone = okdata[key];
          var utitle = "";
          if (key == firetable.uid) {
            if (!thisone.status) {
              //Firebase thinks you are not here (but you are totally here!)
              var ref0 = firebase.database().ref("users/" + firetable.uid + "/status");
              ref0.set(true);
            }
          }
          if (thisone.status || key == firetable.uid) {
            //THIS PERSON IS HERE
            var thename = key;
            count++;
            if (firetable.users[key]) {
              if (firetable.users[key].mod) utitle = "cop";
              if (firetable.users[key].supermod) utitle = "supercop";
              if (firetable.users[key].username) thename = firetable.users[key].username;
            }
            newlist += "<div class=\"prson\">" + thename + " <span class=\"utitle\">" + utitle + "</span></div>";
          }
        }
      }
      $("#allusers").html(newlist);
      $("#label1").text("Everyone (" + count + ")");
      console.log(okdata);
    });
    var ref = firebase.database().ref("chat");
    ref.on('child_added', function(childSnapshot, prevChildKey) {
      var chatData = childSnapshot.val();
      var namebo = chatData.id;
      var objDiv = document.getElementById("actualChat");
      var utitle = "";

      var you = firetable.uid;
      if (firetable.users[firetable.uid]) {
        if (firetable.users[firetable.uid].username) you = firetable.users[firetable.uid].username;
      }

      if (firetable.users[chatData.id]) {
        if (firetable.users[chatData.id].username) namebo = firetable.users[chatData.id].username;
        if (firetable.users[chatData.id].mod) utitle = "cop";
        if (firetable.users[chatData.id].supermod) utitle = "supercop";
      }

      var badoop = false;
      if (chatData.txt.match("@" + you, 'i') || chatData.txt.match(/\@everyone/)) {
        var oknow = Date.now();
        if (oknow - chatData.time < (10 * 1000)) {
          firetable.utilities.playSound("sound");
          badoop = true;
        }
      }
      scrollDown = false;
      if (firetable.utilities.isChatPrettyMuchAtBottom()) scrollDown = true;
      if (chatData.id == firetable.lastChatPerson && !badoop) {
        $("#chat" + firetable.lastChatId).append("<div id=\"chattxt" + childSnapshot.key + "\" class=\"chatText\"></div>");
        $("#chatTime" + firetable.lastChatId).text(firetable.utilities.format_time(chatData.time));

        var txtOut = firetable.ui.textToLinks(firetable.ui.strip(chatData.txt));
        txtOut = emojione.shortnameToImage(txtOut);
        txtOut = emojione.unicodeToImage(txtOut);
        var res = txtOut.replace(/\`(.*?)\`/g, function (x) {
          return "<code>"+x.replace(/\`/g, "") +"</code>";
        });
        $("#chattxt"+childSnapshot.key).html(res);
      } else {
        if (badoop) {
          var thing = $("#actualChat").append("<div id=\"chat"+childSnapshot.key+"\" class=\"newChat badoop\"><div class=\"chatName\"><span class=\"chatNameName\"></span> <span class=\"utitle\">" + utitle + "</span><div class=\"chatTime\" id=\"chatTime" + childSnapshot.key + "\">" + firetable.utilities.format_time(chatData.time) + "</div><divclass=\"clear\"></dov></div><div id=\"chattxt" + childSnapshot.key + "\" class=\"chatText\"></div>");
          $("#chat"+childSnapshot.key).find(".chatNameName").text(namebo);
          var txtOut = firetable.ui.textToLinks(firetable.ui.strip(chatData.txt));
          txtOut = emojione.shortnameToImage(txtOut);
          txtOut = emojione.unicodeToImage(txtOut);
          var res = txtOut.replace(/\`(.*?)\`/g, function (x) {
            return "<code>"+x.replace(/\`/g, "") +"</code>";
          });
          $("#chattxt"+childSnapshot.key).html(res);
        } else {
          var thing = $("#actualChat").append("<div id=\"chat"+childSnapshot.key+"\" class=\"newChat\"><div class=\"chatName\"><span class=\"chatNameName\"></span> <span class=\"utitle\">" + utitle + "</span><div class=\"chatTime\" id=\"chatTime" + childSnapshot.key + "\">" + firetable.utilities.format_time(chatData.time) + "</div><divclass=\"clear\"></dov></div><div id=\"chattxt" + childSnapshot.key + "\" class=\"chatText\"></div>");
          $("#chat"+childSnapshot.key).find(".chatNameName").text(namebo);
          var txtOut = firetable.ui.textToLinks(firetable.ui.strip(chatData.txt));

          txtOut = emojione.shortnameToImage(txtOut);
          txtOut = emojione.unicodeToImage(txtOut);
          var res = txtOut.replace(/\`(.*?)\`/g, function (x) {
            return "<code>"+x.replace(/\`/g, "") +"</code>";
          });
          $("#chattxt"+childSnapshot.key).html(res);

        }
        firetable.lastChatPerson = chatData.id;
        firetable.lastChatId = childSnapshot.key;
      }

      if (scrollDown) objDiv.scrollTop = objDiv.scrollHeight - objDiv.clientHeight;

    });

    firetable.ui.LinkGrabber.start();

    $("#label1").bind("click.lb1tab", firetable.ui.usertab1);
    $("#label2").bind("click.lb2tab", firetable.ui.usertab2);
    $("#addToQueueBttn").bind("click", function() {
      $("#mainqueue").css("display", "none");
      $("#addbox").css("display", "block");
      $("#plmanager").css("display", "none");
    });

    $("#minimodeoptions").bind("click", function(event) {
      var oldthingid = $("#minimodeoptions").find(".mmselected").attr('id');
      $("#minimodeoptions").find(".mmselected").removeClass("mmselected");
      $(event.target).addClass("mmselected");
      var thingid = $(event.target).attr('id');


      if (oldthingid == "mmchat") {
        $("#rightbox").addClass("mmhidden");
        $("#upperpart").addClass("mmhidden");
      } else if (oldthingid == "mmqueue") {
        $("#queuebox").addClass("mmhidden");
      } else if (oldthingid == "mmusrs") {
        $("#usrarea").addClass("mmhidden")
      }
      if (thingid == "mmchat") {
        $("#rightbox").removeClass("mmhidden");
        $("#upperpart").removeClass("mmhidden");
      } else if (thingid == "mmqueue") {
        $("#queuebox").removeClass("mmhidden");
      } else if (thingid == "mmusrs") {
        $("#usrarea").removeClass("mmhidden");
      }
    });

    $("#plmaker").bind("keyup", function(e) {
      if (e.which == 13) {
        var val = $("#plmaker").val();
        if (val != "") {
          var plref = firebase.database().ref("playlists/" + firetable.uid);
          var newlist = plref.push();
          var listid = newlist.key;
          var obj = {
            name: val,
            list: {}
          };
          newlist.set(obj);
          $("#listpicker").append("<option id=\"pdopt" + listid + "\" value=\"" + listid + "\">" + val + "</option>");
          $("#listpicker").val(listid).change();
          var uref = firebase.database().ref("users/" + firetable.uid + "/selectedList");
          uref.set(listid);
        }
      }
    });
    $("#cancelqsearch").bind("click", function() {
      $("#mainqueue").css("display", "block");
      $("#addbox").css("display", "none");
      if (firetable.preview) {
        if (firetable.preview.slice(0, 5) == "ytcid" || firetable.preview.slice(0, 5) == "sccid") {
          $("#pv" + firetable.preview).html("&#xE037;");
          clearTimeout(firetable.ptimeout);
          firetable.ptimeout = null;
          $("#pvbar" + firetable.preview).css("background", "none");
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
    $("#resetpass").bind("click", function() {
      $("#logscreen").css("display", "none");
      $("#createscreen").css("display", "none");
      $("#resetscreen").css("display", "block");
    });
    $("#grab").bind("click", firetable.actions.grab);
    $("#history").bind("click", function() {
       var isHidden = $("#recentHistory").is( ":hidden" );
       if (isHidden){
         $( "#recentHistory" ).show();
       } else {
         $( "#recentHistory" ).hide();
       }
    });
    $("#reloadtrack").bind("click", firetable.actions.reloadtrack);
    $("#loginlink").bind("click", function() {
      $("#logscreen").css("display", "block");
      $("#createscreen").css("display", "none");
      $("#resetscreen").css("display", "none");
    });
    $("#volstatus").bind("click", function() {
      firetable.actions.muteToggle();
    });
    $("#tagPromptClose").bind("click", function() {
      $("#tagPromptOverlay").css("display", "none");
      $("#tagMachine").val("");
      $("#tagSongLink").attr("href", "https://youtube.com");
      firetable.songTagToEdit = null;
    });
    $("#deletePromptClose").bind("click", function() {
      $("#deletePromptOverlay").css("display", "none");
      $("#deletepicker").html("");
    });
    $("#settingsClose").bind("click", function() {
      $("#settingsOverlay").css("display", "none");
    });
    $("#ftSettings").bind("click", function() {
      $("#settingsOverlay").toggle();
    });
    //SETTINGS TOGGLES
$('#badoopToggle').change(function() {
    if (this.checked) {
        console.log("badoop on");
        localStorage["firetableBadoop"] = true;
        firetable.playBadoop = true;
    } else {
        console.log("badoop off");
        localStorage["firetableBadoop"] = false;
        firetable.playBadoop = false;

    }
});
$('input[type=radio][name=screenControl]').change(function() {
  console.log(this.value);
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
    $("#pldeleteButton").bind("click", function() {
      var val = $("#deletepicker").val();
      console.log(val);
      if (firetable.users[firetable.uid]) {
        if (firetable.users[firetable.uid].selectedList) {
          if (firetable.users[firetable.uid].selectedList == val) {
            $("#listpicker").val("0").change();
          }
        }
      }
      var removeThis = firebase.database().ref("playlists/" + firetable.uid + "/" + val);
      $("#pdopt" + val).remove();
      removeThis.remove()
        .then(function() {
          console.log("pl remove went great.");

        })
        .catch(function(error) {
          console.log("pl Remove failed: " + error.message);
        });
      $("#deletePromptOverlay").css("display", "none");
    });
    $("#plimportLauncher").bind("click", function() {
      $("#importPromptOverlay").css("display", "block");
    });
    $("#pldeleteLauncher").bind("click", function() {
      var allQueues = firebase.database().ref("playlists/" + firetable.uid);
      allQueues.once('value')
        .then(function(allQueuesSnap) {
          var allPlaylists = allQueuesSnap.val();
          $("#deletepicker").html("");
          for (var key in allPlaylists) {
            if (allPlaylists.hasOwnProperty(key)) {
              $("#deletepicker").append("<option value=\"" + key + "\">" + allPlaylists[key].name + "</option>");
            }
          }
          $("#deletePromptOverlay").css("display", "block");
        });
    });
    $("#importPromptClose").bind("click", function() {
      $("#importPromptOverlay").css("display", "none");
      $("#plMachine").val("");
    });
    $("#loginlink2").bind("click", function() {
      $("#logscreen").css("display", "block");
      $("#createscreen").css("display", "none");
      $("#resetscreen").css("display", "none");
    });
    $("#signuplink").bind("click", function() {
      $("#logscreen").css("display", "none");
      $("#createscreen").css("display", "block");
      $("#resetscreen").css("display", "none");
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
        firebase.auth().sendPasswordResetEmail(email).catch(function(error) {
          var errorCode = error.code;
          var errorMessage = error.message;
          if (errorCode === 'auth/wrong-password') {
            alert('Wrong password.');
          } else {
            alert(errorMessage);
          }
          console.log(error);
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
      firebase.auth().sendPasswordResetEmail(email).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
          alert('Wrong password.');
        } else {
          alert(errorMessage);
        }
        console.log(error);
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
    $("#ytsearchSelect").bind("click", function() {
      $("#scsearchSelect").removeClass("searchSelectsSelected");
      $("#ytsearchSelect").addClass("searchSelectsSelected");
      firetable.searchSelectsChoice = 1;
    });
    $("#scsearchSelect").bind("click", function() {
      $("#ytsearchSelect").removeClass("searchSelectsSelected");
      $("#scsearchSelect").addClass("searchSelectsSelected");
      firetable.searchSelectsChoice = 2;
    });
    $("#ytimportchoice").bind("click", function() {
      console.log("a");
      $("#scimportchoice").removeClass("importChoice");
      $("#ytimportchoice").addClass("importChoice");
      firetable.importSelectsChoice = 1;
    });
    $("#scimportchoice").bind("click", function() {
      console.log("b");
      $("#ytimportchoice").removeClass("importChoice");
      $("#scimportchoice").addClass("importChoice");
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
            $("#tagPromptOverlay").css("display", "none");
          }
        }
      }
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
                console.log(response);
                $.each(srchItems, function(index, item) {
                  vidTitle = item.snippet.title;
                  $("#importResults").append("<div class=\"importResult\"><div class=\"imtxt\">" + item.snippet.title + " by " + item.snippet.channelTitle + "</div><div class=\"delete\"><a target=\"_blank\" href=\"https://www.youtube.com/playlist?list=" + item.id.playlistId + "\" class=\"importLinkCheck\"><i class=\"material-icons\">&#xE250;</i></a> <i onclick=\"firetable.actions.importList('" + item.id.playlistId + "', '" + firetable.utilities.htmlEscape(item.snippet.title) + "', 1)\" class=\"material-icons\" title=\"Import\">&#xE02E;</i></div><div class=\"clear\"></div></div>");
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
                  $("#importResults").append("<div class=\"importResult\"><div class=\"imtxt\">" + item.title + " by " + item.user.username + " (" + item.track_count + " songs)</div><div class=\"delete\"><a target=\"_blank\" href=\"" + item.permalink_url + "\" class=\"importLinkCheck\"><i class=\"material-icons\">&#xE250;</i></a> <i onclick=\"firetable.actions.importList('" + item.id + "', '" + firetable.utilities.htmlEscape(item.title) + "', 2)\" class=\"material-icons\" title=\"Import\">&#xE02E;</i></div><div class=\"clear\"></div></div>");

                }
              }
            });
          }
        }
      }
    });
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
            $('#searchResults').html("<div id=\"seachin\">Searching...</div>");

            var request = gapi.client.youtube.search.list({
              q: q,
              type: 'video',
              part: 'snippet',
              maxResults: 15
            });
            request.execute(function(response) {
              //  $("#qsearch").val("");
              $('#searchResults').html("");

              if (firetable.preview) {
                if (firetable.preview.slice(0, 5) == "ytcid" || firetable.preview.slice(0, 5) == "sccid") {
                  $("#pv" + firetable.preview).html("&#xE037;");
                  clearTimeout(firetable.ptimeout);
                  firetable.ptimeout = null;
                  $("#pvbar" + firetable.preview).css("background", "none");
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
              console.log(response);
              $.each(srchItems, function(index, item) {
                vidTitle = item.snippet.title;

                var pkey = "ytcid" + item.id.videoId;

                $("#searchResults").append("<div class=\"qresult\"><div class=\"pvbar\" id=\"pvbar" + pkey + "\"> <div class=\"qtxt\"><i id=\"pv" + pkey + "\" class=\"material-icons previewicon\" onclick=\"firetable.actions.pview('" + pkey + "', true, 1)\">&#xE037;</i><span class=\"listwords\">" + vidTitle + "</span></div><div class=\"delete\"><i id=\"pv" + pkey + "\" class=\"material-icons\" onclick=\"firetable.actions.queueTrack('" + item.id.videoId + "', '" + firetable.utilities.htmlEscape(vidTitle) + "', 1)\">&#xE03B;</i></div></div></div>");
              })
            })
          }
          keyWordsearch();

        } else if (firetable.searchSelectsChoice == 2) {
          var q = $('#qsearch').val();
          $('#searchResults').html("<div id=\"seachin\">Searching...</div>");
          SC.get('/tracks', {
            q: q
          }).then(function(tracks) {
            console.log(tracks);
            // $("#qsearch").val("");
            $('#searchResults').html("");

            if (firetable.preview) {
              if (firetable.preview.slice(0, 5) == "ytcid" || firetable.preview.slice(0, 5) == "sccid") {
                $("#pv" + firetable.preview).html("&#xE037;");
                clearTimeout(firetable.ptimeout);
                firetable.ptimeout = null
                $("#pvbar" + firetable.preview).css("background", "none");
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

              $("#searchResults").append("<div class=\"qresult\"><div class=\"pvbar\" id=\"pvbar" + pkey + "\"><div class=\"qtxt\"><i id=\"pv" + pkey + "\" class=\"material-icons previewicon\" onclick=\"firetable.actions.pview('" + pkey + "', true, 2)\">&#xE037;</i><span class=\"listwords\">" + vidTitle + "</span></div><div class=\"delete\"><i id=\"pv" + pkey + "\" class=\"material-icons\" onclick=\"firetable.actions.queueTrack('" + item.id + "', '" + firetable.utilities.htmlEscape(vidTitle) + "', 2)\">&#xE03B;</i></div></div></div>");
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
            var chat = firebase.database().ref("chat");
            var chooto = {
              time: firebase.database.ServerValue.TIMESTAMP,
              id: firetable.uid,
              txt: ":fire:"
            };
            console.log(chooto);
            chat.push(chooto);
          } else if (command == "storm") {
            var chat = firebase.database().ref("chat");
            var chooto = {
              time: firebase.database.ServerValue.TIMESTAMP,
              id: firetable.uid,
              txt: ":cloud_with_rain:"
            };
            console.log(chooto);
            chat.push(chooto);
          } else if (command == "shrug") {
            var chat = firebase.database().ref("chat");
            var thingtosay = "¯\\_(ツ)_/¯";
            if (args) thingtosay = args + " ¯\\_(ツ)_/¯";
            var chooto = {
              time: firebase.database.ServerValue.TIMESTAMP,
              id: firetable.uid,
              txt: thingtosay
            };
            console.log(chooto);
            chat.push(chooto);
          } else if (command == "tableflip") {
            var chat = firebase.database().ref("chat");
            var thingtosay = "(╯°□°）╯︵ ┻━┻";
            if (args) thingtosay = args + " (╯°□°）╯︵ ┻━┻";
            var chooto = {
              time: firebase.database.ServerValue.TIMESTAMP,
              id: firetable.uid,
              txt: thingtosay
            };
            console.log(chooto);
            chat.push(chooto);
          } else if (command == "unflip") {
            var chat = firebase.database().ref("chat");
            var thingtosay = "┬─┬ ノ( ゜-゜ノ)";
            if (args) thingtosay = args + " ┬─┬ ノ( ゜-゜ノ)";
            var chooto = {
              time: firebase.database.ServerValue.TIMESTAMP,
              id: firetable.uid,
              txt: thingtosay
            };
            console.log(chooto);
            chat.push(chooto);
          }
        } else {
          var chat = firebase.database().ref("chat");
          var chooto = {
            time: firebase.database.ServerValue.TIMESTAMP,
            id: firetable.uid,
            txt: txt
          };
          console.log(chooto);
          chat.push(chooto);
        }
        $("#newchat").val("");
      }

    });
    var colors = firebase.database().ref("colors");
    colors.on('value', function(dataSnapshot) {
      var data = dataSnapshot.val();
      console.log("COLOR CHANGE!", data);

      firetable.color = data.color;
      firetable.countcolor = data.txt;
      if (data.color == "#fff") {
        firetable.color = "#F4810B";
        //firetable.countcolor = "#000";
      }
      $("#upperpart").css("background-color", data.color);
      /*
      if (firetable.countcolor == "#fff"){
        firetable.countcolor = "#ffffffc9";
      } else if (firetable.countcolor == "#000"){
        console.log("a")
        firetable.countcolor = "#000000c9";
      }
      $("#upperpart").css("color", firetable.countcolor);
      */
      $("#djthing" + firetable.playdex).css("background-color", firetable.color);
      $("#djthing" + firetable.playdex).css("color", firetable.countcolor);
      $("#volstylebox").html("<style>.ui-slider-horizontal .ui-slider-range-min{ background-color: " + firetable.color + "; } .grabbed { color: " + firetable.color + " !important; } </style>");
    });
  },
  usertab1: function() {
    $("#allusers").css("display", "block");
    $("#justwaitlist").css("display", "none");
    $("#usertabs").find(".selected").removeClass("selected");
    $("#label1").addClass("selected");
  },
  usertab2: function() {
    $("#usertabs").find(".selected").removeClass("selected");
    $("#label2").addClass("selected");
    $("#allusers").css("display", "none");
    $("#justwaitlist").css("display", "block");

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
      console.log("NEW LINK RECEIVED VIA THE DRAGON'S DROP. " + link);
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

let windowW =  $(window).width() * 0.75 - (($(window).width() * 0.75) * 0.25);
let windowH = 293;
let isLoaded = false;
let glitch;
let imgSrc = '';

function setup(useThis) {
    if (!useThis) useThis = firetable.scImg;
    background(0);
    let cnv = createCanvas(windowW, windowH);
    cnv.parent('scScreen');
    loadImage(useThis, function(img) {
        glitch = new Glitch(img);
        isLoaded = true;
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
