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
  scSeek: false,
  color: "#F4810B",
  countcolor: "#fff",
  ytLoaded: null,
  scLoaded: null,
  selectedListThing: "0",
  queueBind: null,
  songTagToEdit: null,
  scwidget: null,
  searchSelectsChoice: 1,
  importSelectsChoice: 1,
  queueRef: null,
  lastChatPerson: false,
  lastChatId: false,
  nonpmsg: true,
  playlimit: 2
}

firetable.version = "00.03.3";
var player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('playerArea', {
    width: 500,
    height: 268,
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
  var height = $(window).height(); // New height
  var w = $(window).width();
  console.log(w);
  if (w > 1199) {
    if (height > 520) {
      var morethan = height - 520;
      var newh = 146 + morethan;
      var chah = 451 + morethan;
      var newu = 458 + morethan;
      $("#queuelist").css("height", newh + "px");
      $("#userslist").css("height", newu + "px");
      $("#actualChat").css("height", chah + "px");
    } else {
      $("#queuelist").css("height", "146px");
      $("#userslist").css("height", "440px");
      $("#actualChat").css("height", "441px");

    }
  } else if (w > 799) {
    var newh = height - 262;
    if (height > 520) {
      var morethan = height - 520;

      var chah = 451 + morethan;
      var newu = 458 + morethan;
      $("#queuelist").css("height", newh + "px");
      $("#userslist").css("height", newu + "px");
      $("#actualChat").css("height", chah + "px");
    } else {

      $("#queuelist").css("height", "146px");
      $("#queuelist").css("height", newh + "px");
      $("#actualChat").css("height", "441px");

    }
  } else {
    var chah = height - 282;
    var newu = height - 91;

    $("#actualChat").css("height", chah + "px");
    $("#queuelist").css("height", newu + "px");
    $("#userslist").css("height", newu + "px");
  }
  $(window).resize(function() {
    // This will execute whenever the window is resized
    var height = $(window).height(); // New height
    var w = $(window).width();
    if (w > 1199) {
      if (height > 520) {
        var morethan = height - 520;
        var newh = 146 + morethan;
        var chah = 451 + morethan;
        var newu = 458 + morethan;
        $("#queuelist").css("height", newh + "px");
        $("#userslist").css("height", newu + "px");
        $("#actualChat").css("height", chah + "px");
      } else {
        $("#queuelist").css("height", "146px");
        $("#userslist").css("height", "458px");
        $("#actualChat").css("height", "441px");

      }
    } else if (w > 799) {
      var newh = height - 262;
      if (height > 520) {
        var morethan = height - 520;

        var chah = 451 + morethan;
        var newu = 458 + morethan;
        $("#queuelist").css("height", newh + "px");
        $("#userslist").css("height", newu + "px");
        $("#actualChat").css("height", chah + "px");
      } else {

        $("#queuelist").css("height", "128px");
        $("#queuelist").css("height", newh + "px");
        $("#actualChat").css("height", "441px");

      }
    } else {
      var chah = height - 282;
      var newu = height - 91;

      $("#actualChat").css("height", chah + "px");
      $("#queuelist").css("height", newu + "px");
      $("#userslist").css("height", newu + "px");
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
                        newlist += "<div id=\"qid" + key + "\" class=\"qitem\"><div class=\"pvbar\" id=\"pvbar" + key + "\"><div class=\"qtxt\"><i id=\"pv" + key + "\" class=\"material-icons\" onclick=\"firetable.actions.pview('" + key + "', false,  " + thisone.type + ")\">" + psign + "</i> " + thisone.name + "</div><div class=\"delete\"><i onclick=\"firetable.actions.bumpSongInQueue('" + key + "')\" class=\"material-icons\">&#xE5D8;</i> <i onclick=\"firetable.actions.editTagsPrompt('" + key + "')\" class=\"material-icons\">&#xE22B;</i> <i onclick=\"firetable.actions.deleteSong('" + key + "')\" class=\"material-icons\">&#xE5C9;</i></div><div class=\"clear\"></div></div></div>";
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
                    newlist += "<div id=\"qid" + key + "\" class=\"qitem\"><div class=\"pvbar\" id=\"pvbar" + key + "\"><div class=\"qtxt\"><i id=\"pv" + key + "\" class=\"material-icons\" onclick=\"firetable.actions.pview('" + key + "', false,  " + thisone.type + ")\">" + psign + "</i> " + thisone.name + "</div><div class=\"delete\"><i onclick=\"firetable.actions.bumpSongInQueue('" + key + "')\" class=\"material-icons\">&#xE5D8;</i> <i onclick=\"firetable.actions.editTagsPrompt('" + key + "')\" class=\"material-icons\">&#xE22B;</i> <i onclick=\"firetable.actions.deleteSong('" + key + "')\" class=\"material-icons\">&#xE5C9;</i></div><div class=\"clear\"></div></div></div>";
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
        $("#pvbar" + firetable.preview).css("background", "linear-gradient(90deg, #d7edf9 " + pcnt + "%, #fff " + pcnt + "%)");
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
          var info = {
            type: 2,
            name: listinfo.tracks[i].title,
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
    document.getElementById("alert").innerHTML = '<audio autoplay="autoplay"><source src="' + filename + '.mp3" type="audio/mpeg" /><source src="' + filename + '.ogg" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + filename + '.mp3" /></audio>';
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

    var formatted_date = month + "-" + day + "-" + year;
    return formatted_date;
  },
  format_time: function(d) {

    var date = new Date(d);

    var hours1 = date.getHours();
    var ampm = "am";
    var hours = hours1;
    if (hours1 > 12) {
      ampm = "pm";
      hours = hours1 - 12;
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
  init: function() {

    var s2p = firebase.database().ref("songToPlay");
    s2p.on('value', function(dataSnapshot) {
      var data = dataSnapshot.val();
      $("#timr").countdown("destroy");
      if (firetable.moveBar != null) {
        clearInterval(firetable.moveBar);
        firetable.moveBar = null;
      }
      $("#prgbar").css("background", "#ccc");
      $("#grab").removeClass("grabbed");
      $("#track").text(data.title);
      $("#artist").text(data.artist);
      $("#albumArt").css("background-image", "url(" + data.image + ")")
      var nownow = Date.now();
      var timeSince = nownow - data.started;
      var secSince = Math.floor(timeSince / 1000);
      var timeLeft = data.duration - secSince;
      firetable.song = data;
      if (data.type == 1 && firetable.ytLoaded) {
        if (!firetable.preview) {
          if (firetable.scLoaded) firetable.scwidget.pause();
          player.loadVideoById(data.cid, secSince, "large");
        }
      } else if (data.type == 2 && firetable.scLoaded) {
        if (!firetable.preview) {
          if (firetable.ytLoaded) player.stopVideo();
          firetable.scSeek = timeSince;
          firetable.scwidget.load("http://api.soundcloud.com/tracks/" + data.cid, {
            auto_play: true
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
          $("#actualChat").append("<div class=\"newChat nowplayn\"><div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing<br/><strong>" + data.title + "</strong> by <strong>" + data.artist + "</strong></div>")

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
        $("#prgbar").css("background", "linear-gradient(90deg, " + firetable.color + " " + pcnt + "%, #ccc " + pcnt + "%)");
      }, 500);
    });
    var thescreen = firebase.database().ref("thescreen");
    thescreen.on('value', function(dataSnapshot) {
      var data = dataSnapshot.val();
      console.log(data);
      if (data) {
        $("#playerArea").animate({
          'top': '36px'
        }, 5000);
        $("#volandthings").animate({
          'bottom': '123px'
        }, 1000);
      } else {
        $("#playerArea").animate({
          'top': '-300px'
        }, 2000);
        $("#volandthings").animate({
          'bottom': '0'
        }, 2000);
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
          $("#djthing" + i).css("background-color", "#ccc");
          $("#djthing" + i).css("color", "#000");
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
          $("#djthing" + i).css("background-color", "#ccc");
          $("#djthing" + i).css("color", "#000");
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
      var txtOut = firetable.ui.textToLinks(chatData.txt);
      txtOut = emojione.shortnameToImage(txtOut);
      txtOut = emojione.unicodeToImage(txtOut);
      var badoop = false;
      if (chatData.txt.match(you, 'i') || chatData.txt.match(/\@everyone/)) {
        var oknow = Date.now();
        if (oknow - chatData.time < (10 * 1000)) {
          firetable.utilities.playSound("sound");
          badoop = true;
        }
      }
      scrollDown = false;
      if (firetable.utilities.isChatPrettyMuchAtBottom()) scrollDown = true;
      if (chatData.id == firetable.lastChatPerson && !badoop) {
        $("#chat" + firetable.lastChatId).append("<div>" + txtOut + "</div>");
        $("#chatTime" + firetable.lastChatId).text(firetable.utilities.format_time(chatData.time));
      } else {
        if (badoop) {
          $("#actualChat").append("<div class=\"newChat badoop\"><div class=\"chatName\">" + namebo + " <span class=\"utitle\">" + utitle + "</span><div class=\"chatTime\" id=\"chatTime" + childSnapshot.key + "\">" + firetable.utilities.format_time(chatData.time) + "</div><divclass=\"clear\"></dov></div><div id=\"chat" + childSnapshot.key + "\" class=\"chatText\">" + txtOut + "</div>")
        } else {
          $("#actualChat").append("<div class=\"newChat\"><div class=\"chatName\">" + namebo + " <span class=\"utitle\">" + utitle + "</span><div class=\"chatTime\" id=\"chatTime" + childSnapshot.key + "\">" + firetable.utilities.format_time(chatData.time) + "</div><divclass=\"clear\"></dov></div><div id=\"chat" + childSnapshot.key + "\" class=\"chatText\">" + txtOut + "</div>")
        }
        firetable.lastChatPerson = chatData.id;
        firetable.lastChatId = childSnapshot.key;
      }

      if (scrollDown) objDiv.scrollTop = objDiv.scrollHeight - objDiv.clientHeight;

    });

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
            var request = gapi.client.youtube.search.list({
              q: q,
              type: 'video',
              part: 'snippet',
              maxResults: 15
            });
            request.execute(function(response) {
              $("#qsearch").val("");
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

                $("#searchResults").append("<div class=\"qresult\"><div class=\"pvbar\" id=\"pvbar" + pkey + "\"> <div class=\"qtxt\"><i id=\"pv" + pkey + "\" class=\"material-icons\" onclick=\"firetable.actions.pview('" + pkey + "', true, 1)\">&#xE037;</i>" + vidTitle + "</div><div class=\"delete\"><i id=\"pv" + pkey + "\" class=\"material-icons\" onclick=\"firetable.actions.queueTrack('" + item.id.videoId + "', '" + firetable.utilities.htmlEscape(vidTitle) + "', 1)\">&#xE03B;</i></div></div></div>");
              })
            })
          }
          keyWordsearch();

        } else if (firetable.searchSelectsChoice == 2) {
          var q = $('#qsearch').val();
          SC.get('/tracks', {
            q: q
          }).then(function(tracks) {
            console.log(tracks);
            $("#qsearch").val("");
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

              var pkey = "sccid" + item.id;

              $("#searchResults").append("<div class=\"qresult\"><div class=\"pvbar\" id=\"pvbar" + pkey + "\"><div class=\"qtxt\"><i id=\"pv" + pkey + "\" class=\"material-icons\" onclick=\"firetable.actions.pview('" + pkey + "', true, 2)\">&#xE037;</i>" + vidTitle + "</div><div class=\"delete\"><i id=\"pv" + pkey + "\" class=\"material-icons\" onclick=\"firetable.actions.queueTrack('" + item.id + "', '" + firetable.utilities.htmlEscape(vidTitle) + "', 2)\">&#xE03B;</i></div></div></div>");
            })
          });
        }
      }
    });
    $("#newchat").bind("keyup", function(e) {
      if (e.which == 13) {
        var txt = $("#newchat").val();
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
      }
      $("#upperpart").css("background-color", data.color);
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

  }


}

if (!firetable.started) firetable.init();
