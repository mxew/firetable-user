/*
firetable.js
firetable API wrapper
*/

var ftapi = {
  started: false
};

var player;

ftapi.init = function() {
  console.log("Powered by firetable. \n" +
    "For more information, head to firetable.org");
  ftapi.started = true;

  /*
  NON-AUTHENTICATED FIRETABLE EVENT BINDINGS
  All realtime events for the non-authenticated user
  These will persist regardless of auth state changes
  */
  ftapi.events = new EventEmitter();

  // chat event emitter
  var chatRef = firebase.database().ref("chat");
  chatRef.on('child_added', function(childSnapshot, prevChildKey) {
    var chatData = childSnapshot.val();
    chatData.chatID = childSnapshot.key;
    ftapi.events.emit("newChat", chatData);
  });

  // users change event emitter
  var ref2 = firebase.database().ref("users");
  ref2.orderByChild('status').equalTo(true).on('value', function(dataSnapshot) {
    var okdata = dataSnapshot.val();
    ftapi.events.emit("usersChanged", okdata);
  });

  // new song event emitter
  var s2p = firebase.database().ref("songToPlay");
  s2p.on('value', function(dataSnapshot) {
    var songData = dataSnapshot.val();
    ftapi.events.emit("newSong", songData);
  });

  // song tag update emitter
  var tagUpdate = firebase.database().ref("tagUpdate");
  tagUpdate.on('value', function(dataSnapshot) {
    var data = dataSnapshot.val();
    ftapi.events.emit("tagUpdate", data);
  });

  // history emitter
  var recentz = firebase.database().ref("songHistory");
  recentz.on('child_added', function(dataSnapshot, prev) {
    var data = dataSnapshot.val();
    data.histID = dataSnapshot.key;
    ftapi.events.emit("newHistory", data);
  });

  // table change emitter
  var tbl = firebase.database().ref("table");
  tbl.on('value', function(dataSnapshot) {
    var data = dataSnapshot.val();
    ftapi.events.emit("tableChanged", data);
  });

  // spotlight state changed emitter
  var pldx = firebase.database().ref("playdex");
  pldx.on('value', function(dataSnapshot) {
    var data = dataSnapshot.val();
    ftapi.events.emit("spotlightStateChanged", data);
  });

  // playlimit change emitter
  var plc = firebase.database().ref("playlimit");
  plc.on('value', function(dataSnapshot) {
    var data = dataSnapshot.val();
    ftapi.events.emit("playLimitChanged", data);
  });

  // waitlist change emitter
  var wl = firebase.database().ref("waitlist");
  wl.on('value', function(dataSnapshot) {
    var data = dataSnapshot.val();
    ftapi.events.emit("waitlistChanged", data);
  });

  // new theme emitter
  var themeChange = firebase.database().ref("theme");
  themeChange.on('value', function(dataSnapshot) {
    var data = dataSnapshot.val();
    ftapi.events.emit("newTheme", data);
  });

  // dance state emitter
  var danceCheck = firebase.database().ref("dance");
  danceCheck.on('value', function(dataSnapshot) {
    var data = dataSnapshot.val();
    ftapi.events.emit("danceStateChanged", data);
  });

  // screen sync change emitter
  var thescreen = firebase.database().ref("thescreen");
  thescreen.on('value', function(dataSnapshot) {
    var data = dataSnapshot.val();
    ftapi.events.emit("screenStateChanged", data);
  });


};

/*
ACTIONS
*/
ftapi.actions = {
  /*
  GENERAL USER ACTIONS
  */
  sendChat: function(txt, cardid) {
    var chat = firebase.database().ref("chat");
    var chooto = {
      time: firebase.database.ServerValue.TIMESTAMP,
      id: firetable.uid,
      txt: "Check out my card...",
      name: firetable.uname
    };
    if (cardid) chatoo.card = cardid;
    chat.push(chooto);
  },

  /*
  ADMIN ACTIONS
  */
  unbanUser: function(userid) {
    var ref = firebase.database().ref("banned/" + userid);
    ref.set(false);
  },
  banUser: function(userid) {
    var ref = firebase.database().ref("banned/" + userid);
    ref.set(true);
  },

  /*
  DATA LOOKUP FUNCTIONS
  */
  getCard: function(cardid, callback) {
    var thecard = firebase.database().ref("cards/" + cardid);
    thecard.once('value')
      .then(function(allQueuesSnap) {
        var data = allQueuesSnap.val();
        return callback(data);
      });
  },
  getUserByName: function(name, callback) {
    var searchByName = firebase.database().ref("users");
    var ppl = [];
    searchByName.orderByChild('username').equalTo(name).once("value")
      .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var key = childSnapshot.key;
          var childData = childSnapshot.val();
          childData.userid = key;
          ppl.push(childData);
        });
        if (ppl[0]){
          return callback(ppl[0]);
        } else {
          ftapi.actions.getUserByID(name, callback);
        }
      });
  },
  getUserByID: function(userid, callback) {
    var searchByID = firebase.database().ref("users/" + userid);
    var person = null;
    searchByID.once("value")
      .then(function(snapshot2) {
        var childData2 = snapshot2.val();
        if (childData2) {
          var key2 = snapshot2.key;
          childData2.userid = key2;
          person = childData2;
        }
        return callback(person);
      });
  }
};

/*
POLYFILL EVENT EMITTER
*/
var indexOf;

if (typeof Array.prototype.indexOf === 'function') {
  indexOf = function(haystack, needle) {
    return haystack.indexOf(needle);
  };
} else {
  indexOf = function(haystack, needle) {
    var i = 0,
      length = haystack.length,
      idx = -1,
      found = false;

    while (i < length && !found) {
      if (haystack[i] === needle) {
        idx = i;
        found = true;
      }

      i++;
    }

    return idx;
  };
};


var EventEmitter = function() {
  this.events = {};
};

EventEmitter.prototype.on = function(event, listener) {
  if (typeof this.events[event] !== 'object') {
    this.events[event] = [];
  }

  this.events[event].push(listener);
};

EventEmitter.prototype.removeListener = function(event, listener) {
  var idx;

  if (typeof this.events[event] === 'object') {
    idx = indexOf(this.events[event], listener);

    if (idx > -1) {
      this.events[event].splice(idx, 1);
    }
  }
};

EventEmitter.prototype.emit = function(event) {
  var i, listeners, length, args = [].slice.call(arguments, 1);

  if (typeof this.events[event] === 'object') {
    listeners = this.events[event].slice();
    length = listeners.length;

    for (i = 0; i < length; i++) {
      listeners[i].apply(this, args);
    }
  }
};

EventEmitter.prototype.once = function(event, listener) {
  this.on(event, function g() {
    this.removeListener(event, g);
    listener.apply(this, arguments);
  });
};
