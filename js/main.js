var firetable = {
    started: false,
    uid: null,
    playdex: 0,
    users: {},
    queue: false,
    playlimit: 2
}

firetable.version = "00.00.01";

firetable.init = function() {
    console.log("Yo sup welcome to firetable my name is chris rohn.")
    firetable.started = true;
    var config = {
        apiKey: "AIzaSyDdshWtOPnY_0ACt6uJKmcI_qPpTfO4sJ4",
        authDomain: "firetable-e10fd.firebaseapp.com",
        databaseURL: "https://firetable-e10fd.firebaseio.com"
    };

    firebase.initializeApp(config);
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            firetable.uid = user.uid;
            console.log("user signed in!");
            if (firetable.users[firetable.uid]) {
                if (firetable.users[firetable.uid].username) {
                    $("#loggedInEmail").text(Object.keys(firetable.users[firetable.uid].username)[0]);
                } else {
                    $("#loggedInEmail").text(user.uid);
                }
            } else {
                $("#loggedInEmail").text(user.uid);
            }
            var ref0 = firebase.database().ref("users/" + user.uid + "/status");
            ref0.set(true);
            ref0.onDisconnect().set(false);
            var refq = firebase.database().ref("queues/" + firetable.uid);
            refq.on('value', function(dataSnapshot) {
                var okdata = dataSnapshot.val();
                firetable.queue = okdata;
                var newlist = "";
                console.log(okdata);
                for (var key in okdata) {
                    if (okdata.hasOwnProperty(key)) {
                        var thisone = okdata[key];
                        newlist += "<div class=\"qitem\"><div class=\"qtxt\">" + thisone.name + "</div><div class=\"delete\"><i onclick=\"firetable.actions.bumpSongInQueue('" + key + "')\" class=\"material-icons\">&#xE5D8;</i> <i onclick=\"firetable.actions.deleteSong('" + key + "')\" class=\"material-icons\">&#xE5C9;</i></div><div class=\"clear\"></div></div>";
                    }
                }
                $("#mainqueue").html(newlist);
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
    });
    firetable.ui.init();
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
    bumpSongInQueue(songid) {
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

            //now we have to rebuild the object keeping the oldkeys in the same order
            //we have to do it this way (i think) because firebase orders based on its ids
            for (var i = 0; i < qtemp.length; i++) {
                var theid = ids[i];
                console.log(theid);
                newobj[theid] = qtemp[i].data;
            }
            var qref = firebase.database().ref("queues/" + firetable.uid);
            qref.set(newobj); //send it off to firebase!
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
        var removeThis = firebase.database().ref('queues/' + firetable.uid + '/' + id);
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
                    if (Object.keys(firetable.users[key].username)[0] == name) {
                        match = key;
                    }
                }
            }
        }
        if (!match && firetable.users[name]) match = name;
        return match;
    },
    queueTrack: function(cid, name, type) {
        var qref = firebase.database().ref("queues/" + firetable.uid);
        var info = {
            type: type,
            name: name,
            cid: cid
        };
        qref.push(info);
        $("#mainqueue").css("display", "block");
        $("#addbox").css("display", "none");
    }
};

firetable.ui = {
    textToLinks: function(text) {

        var re = /(https?:\/\/(([-\w\.]+)+(:\d+)?(\/([\w/_\.]*(\?\S+)?)?)?))/g;
        return text.replace(re, "<a href=\"$1\" target=\"_blank\">$1</a>");
    },
    init: function() {
        var s2p = firebase.database().ref("songToPlay");
        s2p.on('value', function(dataSnapshot) {
            var data = dataSnapshot.val();
            $("#timr").countdown("destroy");
            $("#track").text(data.title);
            $("#artist").text(data.artist);
            var nownow = Date.now();
            var timeSince = nownow - data.started;
            var secSince = Math.floor(timeSince / 1000);
            var timeLeft = data.duration - secSince;
            if (data.type == 1) {
                $("#playerArea").html("<iframe src=\"https://www.youtube.com/embed/" + data.cid + "?autoplay=1&start=" + secSince + "\"></iframe>")
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
            if (data) {
                var countr = 1;
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        ok1 += "<div class=\"prson\">" + countr + ". " + data[key].name + "</div>";
                        countr++;
                    }
                }
            }
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
                        ok1 += "<div id=\"spt" + countr + "\" class=\"spot\"><div class=\"djname\">" + data[key].name + "</div><div class=\"playcount\">" + data[key].plays + "/<span id=\"plimit" + countr + "\">" + firetable.playlimit + "</span></div></div> ";
                        countr++;
                    }
                }
                if (countr < 4) {
                    ok1 += "<div class=\"spot\"><div class=\"djname\"><strong>EMPTY seat!</strong> <br/>Type !addme to DJ right now.</div></div> ";
                    countr++;
                    for (var i = countr; i < 4; i++) {
                        ok1 += "<div class=\"spot\"></div> ";
                    }
                }

            } else {
                ok1 += "<div class=\"spot\"><div class=\"djname\"><strong>EMPTY seat!</strong><br/>Type !addme to DJ right now.</div></div> ";
                for (var i = 0; i < 3; i++) {
                    ok1 += "<div class=\"spot\"></div> ";
                }
            }
            $("#deck").html(ok1);
            for (var i = 0; i < 4; i++) {
                if (i != firetable.playdex) {
                    $("#spt" + i).css("border", "1px solid #ccc");
                    $("#spt" + i).css("background-color", "#fff");
                    $("#spt" + i).css("color", "#000");
                } else {
                    $("#spt" + i).css("border", "1px solid #F4810B");
                    $("#spt" + i).css("background-color", "#F4810B");
                    $("#spt" + i).css("color", "#fff");
                }
            }
        });
        var pldx = firebase.database().ref("playdex");
        pldx.on('value', function(dataSnapshot) {
            var data = dataSnapshot.val();
            firetable.playdex = data;
            for (var i = 0; i < 4; i++) {
                if (i != data) {
                    $("#spt" + i).css("border", "1px solid #ccc");
                    $("#spt" + i).css("background-color", "#fff");
                    $("#spt" + i).css("color", "#000");
                } else {
                    $("#spt" + i).css("border", "1px solid #F4810B");
                    $("#spt" + i).css("background-color", "#F4810B");
                    $("#spt" + i).css("color", "#fff");
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
                    if (firetable.users[firetable.uid].username) $("#loggedInEmail").text(Object.keys(firetable.users[firetable.uid].username)[0]);
                }
            }
            var newlist = "";
            var count = 0;
            for (var key in okdata) {
                if (okdata.hasOwnProperty(key)) {
                    var thisone = okdata[key];
                    var utitle = "";
                    if (thisone.status) {
                        //THIS PERSON IS HERE
                        var thename = key;
                        count++;
                        if (firetable.users[key]) {
                            if (firetable.users[key].mod) utitle = "cop";
                            if (firetable.users[key].supermod) utitle = "supercop";
                            if (firetable.users[key].username) thename = Object.keys(firetable.users[key].username)[0];
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

            if (firetable.users[chatData.id]) {
                if (firetable.users[chatData.id].username) namebo = Object.keys(firetable.users[chatData.id].username)[0];
                if (firetable.users[chatData.id].mod) utitle = "cop";
                if (firetable.users[chatData.id].supermod) utitle = "supercop";
            }
            var txtOut = firetable.ui.textToLinks(chatData.txt);
            txtOut = emojione.shortnameToImage(txtOut);
            txtOut = emojione.unicodeToImage(txtOut);

            $("#actualChat").append("<div class=\"newChat\"><div class=\"chatName\">" + namebo + " <span class=\"utitle\">" + utitle + "</span></div><div class=\"chatText\">" + txtOut + "</div>")
            objDiv.scrollTop = objDiv.scrollHeight;
        });

        $("#label1").bind("click.lb1tab", firetable.ui.usertab1);
        $("#label2").bind("click.lb2tab", firetable.ui.usertab2);
        $("#addToQueueBttn").bind("click", function() {
            $("#mainqueue").css("display", "none");
            $("#addbox").css("display", "block");
        });
        $("#cancelqsearch").bind("click", function() {
            $("#mainqueue").css("display", "block");
            $("#addbox").css("display", "none");
        });
        $("#resetpass").bind("click", function() {
            $("#logscreen").css("display", "none");
            $("#createscreen").css("display", "none");
            $("#resetscreen").css("display", "block");
        });
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
                        part: 'snippet',
                        maxResults: 15
                    });
                    request.execute(function(response) {
                        $("#qsearch").val("");
                        $('#searchResults').html("");

                        var srchItems = response.result.items;
                        console.log(response);
                        $.each(srchItems, function(index, item) {
                            vidTitle = item.snippet.title;


                            $("#searchResults").append("<div onclick=\"firetable.actions.queueTrack('" + item.id.videoId + "', '" + vidTitle + "', 1)\" class=\"qresult\">" + vidTitle + "</div>");
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
                    if (command == "become") {
                        // TIME TO BECOME A NEW CHAT-A-ROO NAME DAWG
                        var nameclaimref = firebase.database().ref("usernames/" + args + "/" + firetable.uid);
                        nameclaimref.set(true);
                        var uref = firebase.database().ref("users/" + firetable.uid + "/username/" + args);
                        uref.set(true);
                    } else if (command == "mod") {
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
