var firetable = {
  started: false,
  uid: null,
  playdex: 0,
  users: {},
  queue: false,
  preview: false,
  song: null,
  playerLoaded: null,
  selectedListThing: "0",
  queueBind: null,
  queueRef: null,
  lastChatPerson: false,
  lastChatId: false,
  nonpmsg: true,
  playlimit: 2
}

firetable.version = "00.00.03";
var player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('playerArea', {
    width: 600,
    height: 400,
    videoId: '0',
    events: {
      onReady: initialize
    }
  });
}

function initialize(event) {
  firetable.playerLoaded = true;
  var vol = localStorage["firetableVol"];
  if (!vol) {
    vol = 80;
    localStorage["firetableVol"] = 80;
  } else {
    player.setVolume(vol);
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
      localStorage["firetableVol"] = ui.value;
    }
  });
  $("#playerArea").toggle();
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
    if (height > 690) {
      var morethan = height - 690;
      var newh = 335 + morethan;
      var chah = 578 + morethan;
      $("#queuelist").css("height", newh + "px");
      $("#userslist").css("height", newh + "px");
      $("#actualChat").css("height", chah + "px");
    } else {
      $("#queuelist").css("height", "335px");
      $("#userslist").css("height", "335px");
      $("#actualChat").css("height", "578px");

    }
    $(window).resize(function() {
      // This will execute whenever the window is resized
      var height = $(window).height(); // New height
      if (height > 690) {
        var morethan = height - 690;
        var newh = 335 + morethan;
        var chah = 578 + morethan;
        $("#queuelist").css("height", newh + "px");
        $("#userslist").css("height", newh + "px");
        $("#actualChat").css("height", chah + "px");
      } else {
        $("#queuelist").css("height", "335px");
        $("#userslist").css("height", "335px");
        $("#actualChat").css("height", "578px");

      }
    });

    firebase.initializeApp(config);
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
              for (var key in allPlaylists) {
                if (allPlaylists.hasOwnProperty(key)) {
                  $("#listpicker").append("<option value=\"" + key + "\">" + allPlaylists[key].name + "</option>");
                }
              }
              getSelect.once('value')
                .then(function(snappy) {
                  firetable.selectedListThing = snappy.val();

                  if (!firetable.selectedListThing) firetable.selectedListThing = "0";
                  if (firetable.selectedListThing == 0) {
                    firetable.queueRef = firebase.database().ref("queues/" + firetable.uid);
                  } else {
                    firetable.queueRef = firebase.database().ref("playlists/" + firetable.uid + "/" + firetable.selectedListThing +"/list");
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
                        firetable.queueRef = firebase.database().ref("playlists/" + firetable.uid + "/" + firetable.selectedListThing +"/list");
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
                            newlist += "<div id=\"qid" + key + "\" class=\"qitem\"><div class=\"qtxt\"><i id=\"pv" + key + "\" class=\"material-icons\" onclick=\"firetable.actions.pview('" + key + "')\">" + psign + "</i> " + thisone.name + "</div><div class=\"delete\"><i onclick=\"firetable.actions.bumpSongInQueue('" + key + "')\" class=\"material-icons\">&#xE5D8;</i> <i onclick=\"firetable.actions.deleteSong('" + key + "')\" class=\"material-icons\">&#xE5C9;</i></div><div class=\"clear\"></div></div>";
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
                    console.log(okdata);
                    for (var key in okdata) {
                      if (okdata.hasOwnProperty(key)) {
                        var thisone = okdata[key];
                        var psign = "&#xE037;";
                        if (key == firetable.preview) {
                          psign = "&#xE034;";
                        }
                        newlist += "<div id=\"qid" + key + "\" class=\"qitem\"><div class=\"qtxt\"><i id=\"pv" + key + "\" class=\"material-icons\" onclick=\"firetable.actions.pview('" + key + "')\">" + psign + "</i> " + thisone.name + "</div><div class=\"delete\"><i onclick=\"firetable.actions.bumpSongInQueue('" + key + "')\" class=\"material-icons\">&#xE5D8;</i> <i onclick=\"firetable.actions.deleteSong('" + key + "')\" class=\"material-icons\">&#xE5C9;</i></div><div class=\"clear\"></div></div>";
                      }
                    }
                    $("#mainqueue").html(newlist);
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
                  });
                });
            });
            $("#signOut").html("<span onclick=\"firetable.actions.logOut()\" id=\"logOutButton\">Log Out</span>");
            $("#login").css("display", "none");
            $("#mainThing").css("display", "block");
          } else {
            firetable.uid = null;
            $("#loggedInEmail").text("Not Logged In");
            $("#signOut").html("");
            $("#login").css("display", "block");
            $("#mainThing").css("display", "none");

          }
        }); firetable.ui.init();
    };

    firetable.actions = {
      logOut: function() {
        var ref0 = firebase.database().ref("users/" + firetable.uid + "/status");
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
      pview: function(id, fromSearch) {
        if (firetable.preview == id) {
          //already previewing this. stop and resume regular song
          clearTimeout(firetable.ptimeout);
          firetable.ptimeout = null;
          $("#pv" + firetable.preview).html("&#xE037;");
          firetable.preview = false;
          //start regular song
          var nownow = Date.now();
          var timeSince = nownow - firetable.song.started;
          var secSince = Math.floor(timeSince / 1000);
          var timeLeft = firetable.song.duration - secSince;
          if (firetable.song.type == 1) {
            if (!firetable.preview) player.loadVideoById(firetable.song.cid, secSince, "large")
          }
        } else {
          if (firetable.preview) $("#pv" + firetable.preview).html("&#xE037;");
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
          firetable.ptimeout = setTimeout(function() {
            firetable.ptimeout = null;
            $("#pv" + firetable.preview).html("&#xE037;");
            firetable.preview = false;

            //start regular song
            var nownow = Date.now();
            var timeSince = nownow - firetable.song.started;
            var secSince = Math.floor(timeSince / 1000);
            var timeLeft = firetable.song.duration - secSince;
            if (firetable.song.type == 1) {
              if (!firetable.preview) player.loadVideoById(firetable.song.cid, secSince, "large")
            }
          }, 30 * 1000);
          $("#pv" + id).html("&#xE034;");
          player.loadVideoById(cid, "large")

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
          firetable.actions.queueTrack(firetable.song.cid, title, firetable.song.type);
          $("#grab").addClass("grabbed");
        }
      },
      queueTrack: function(cid, name, type) {
        var info = {
          type: type,
          name: name,
          cid: cid
        };
        firetable.queueRef.push(info);
        if (firetable.preview) {
          if (firetable.preview.slice(0, 5) == "ytcid") {
            $("#pv" + firetable.preview).html("&#xE037;");
            clearTimeout(firetable.ptimeout);
            firetable.ptimeout = null;
            firetable.preview = false;
            //start regular song
            var nownow = Date.now();
            var timeSince = nownow - firetable.song.started;
            var secSince = Math.floor(timeSince / 1000);
            var timeLeft = firetable.song.duration - secSince;
            if (firetable.song.type == 1) {
              if (!firetable.preview) player.loadVideoById(firetable.song.cid, secSince, "large")
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
      htmlEscape: function(str) {
        return str.replace(/'/g, '\\\'')
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
          $("#grab").removeClass("grabbed");
          $("#track").text(data.title);
          $("#artist").text(data.artist);
          var nownow = Date.now();
          var timeSince = nownow - data.started;
          var secSince = Math.floor(timeSince / 1000);
          var timeLeft = data.duration - secSince;
          firetable.song = data;
          if (firetable.playerLoaded) {
            if (data.type == 1) {
              if (!firetable.preview) {
                player.loadVideoById(data.cid, secSince, "large")
              }
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
              $("#actualChat").append("<div class=\"newChat\"><div class=\"npmsg\">DJ <strong>" + nicename + "</strong> started playing <strong>" + data.title + "</strong> by <strong>" + data.artist + "</strong></div>")
              var objDiv = document.getElementById("actualChat");
              objDiv.scrollTop = objDiv.scrollHeight;
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
                ok1 += "<div style=\"background-repeat: no-repeat; background-position: bottom 18px center; background-image: url(https://robohash.org/" + data[key].id + "" + data[key].name + ".png?size=90x90);\" id=\"spt" + countr + "\" class=\"spot\"><div class=\"djname\">" + data[key].name + "</div><div id=\"djthing" + countr + "\" class=\"playcount\">" + data[key].plays + "/<span id=\"plimit" + countr + "\">" + firetable.playlimit + "</span></div></div> ";
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
            } else {
              $("#djthing" + i).css("background-color", "#F4810B");
              $("#djthing" + i).css("color", "#fff");
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
            } else {
              $("#djthing" + i).css("background-color", "#F4810B");
              $("#djthing" + i).css("color", "#fff");
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
                  var ref0 = firebase.database().ref("users/" +firetable.uid + "/status");
                  ref0.set(true);
                }
              }
              if (thisone.status) {
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
          $("#label1").text("Users (" + count + ")");
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

          objDiv.scrollTop = objDiv.scrollHeight;

        });

        $("#label1").bind("click.lb1tab", firetable.ui.usertab1);
        $("#label2").bind("click.lb2tab", firetable.ui.usertab2);
        $("#addToQueueBttn").bind("click", function() {
          $("#mainqueue").css("display", "none");
          $("#addbox").css("display", "block");
          $("#plmanager").css("display", "none");
        });

        $("#plmaker").bind("keyup", function() {
          if (event.which == 13) {
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
              $("#listpicker").append("<option value=\"" + listid + "\">" + val + "</option>");
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
            if (firetable.preview.slice(0, 5) == "ytcid") {
              $("#pv" + firetable.preview).html("&#xE037;");
              clearTimeout(firetable.ptimeout);
              firetable.ptimeout = null;
              firetable.preview = false;
              //start regular song
              var nownow = Date.now();
              var timeSince = nownow - firetable.song.started;
              var secSince = Math.floor(timeSince / 1000);
              var timeLeft = firetable.song.duration - secSince;
              if (firetable.song.type == 1) {
                if (!firetable.preview) player.loadVideoById(firetable.song.cid, secSince, "large")
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
        $("#loginlink").bind("click", function() {
          $("#logscreen").css("display", "block");
          $("#createscreen").css("display", "none");
          $("#resetscreen").css("display", "none");
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
        $("#loginpass").bind("keyup", function() {
          if (event.which == 13) {
            var email = $("#loginemail").val();
            var pass = $("#loginpass").val();
            firetable.actions.logIn(email, pass);
          }
        });
        $("#newpass").bind("keyup", function() {
          if (event.which == 13) {
            var email = $("#newemail").val();
            var pass = $("#newpass").val();
            firetable.actions.signUp(email, pass);
          }
        });
        $("#theAddress").bind("keyup", function() {
          if (event.which == 13) {
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
        $("#qsearch").bind("keyup", function() {
          if (event.which == 13) {
            var txt = $("#qsearch").val();

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
                  if (firetable.preview.slice(0, 5) == "ytcid") {
                    $("#pv" + firetable.preview).html("&#xE037;");
                    clearTimeout(firetable.ptimeout);
                    firetable.ptimeout = null;
                    firetable.preview = false;
                    //start regular song
                    var nownow = Date.now();
                    var timeSince = nownow - firetable.song.started;
                    var secSince = Math.floor(timeSince / 1000);
                    var timeLeft = firetable.song.duration - secSince;
                    if (firetable.song.type == 1) {
                      if (!firetable.preview) player.loadVideoById(firetable.song.cid, secSince, "large")
                    }
                  }
                }
                var srchItems = response.result.items;
                console.log(response);
                $.each(srchItems, function(index, item) {
                  vidTitle = item.snippet.title;

                  var pkey = "ytcid" + item.id.videoId;

                  $("#searchResults").append("<div class=\"qresult\"><div class=\"qtxt\"><i id=\"pv" + pkey + "\" class=\"material-icons\" onclick=\"firetable.actions.pview('" + pkey + "', true)\">&#xE037;</i>" + vidTitle + "</div><div class=\"delete\"><i id=\"pv" + pkey + "\" class=\"material-icons\" onclick=\"firetable.actions.queueTrack('" + item.id.videoId + "', '" + firetable.utilities.htmlEscape(vidTitle) + "', 1)\">&#xE03B;</i></div></div>");
                })
              })
            }
            keyWordsearch();

          }

        });
        $("#newchat").bind("keyup", function() {
          if (event.which == 13) {
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
