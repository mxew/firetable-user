/**
 * users.js — Authentication, login/signup UI, and user-list rendering.
 *
 * Handles:
 * - Login, signup, password reset flows
 * - Login form event binding/unbinding (loginEventsInit / loginEventsDestroy)
 * - Post-login UI setup (loggedIn: playlist picker, grab button, etc.)
 * - Logout + "show login screen" transition
 * - User lookup by name → UID (uidLookup)
 * - Grab current song to a playlist
 * - Unban
 * - ftapi events: loggedIn, loggedOut, authReconnected, authDisconnected,
 *   userBanned, userUnbanned, userJoined, userLeft, userChanged, usersChanged
 */

firetable.actions = firetable.actions || {};
firetable.ui = firetable.ui || {};

// ─── Authentication Actions ──────────────────────────────────────────────────

/**
 * Log in with email+password via Firebase Auth.
 * @param {string} email
 * @param {string} password
 */
firetable.actions.logIn = function (email, password) {
  firetable.debug && console.log("login");
  ftapi.actions.logIn(email, password, function (error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    if (errorCode === 'auth/wrong-password') {
      alert('Wrong password.');
    } else {
      alert(errorMessage);
    }
    firetable.debug && console.log("log in error:", error);
  });
};

/** Sign out. */
firetable.actions.logOut = function () {
  ftapi.actions.logOut();
  firetable.debug && console.log("logout");
};

/**
 * Create a new account via Firebase Auth.
 * @param {string} email
 * @param {string} password
 * @param {string} username - Display name
 */
firetable.actions.signUp = function (email, password, username) {
  firetable.debug && console.log("signup");
  ftapi.actions.signUp(email, password, username, function (error) {
    alert(error);
  });
};

/**
 * Show the login screen — called on logout or when not authenticated.
 * Saves the login form HTML so it can be restored later.
 */
firetable.actions.showLoginScreen = function () {
  // Detach all logged-in panels so they're not in the DOM while logged out
  var $shell = $('#appShell');
  if ($shell.length) { firetable.$appShell = $shell.detach(); }

  $("#cardCaseButton").hide();
  $("#loggedInName").hide();
  $("#logOutButton").hide().off();
  $('#mainGrid').removeClass().addClass('login');
  $("#grab").css("display", "none");

  if (firetable.loginForm && !$("#login").html()) {
    $("#mainGrid").append('<div id="login">' + firetable.loginForm + '</div>');
    firetable.ui.loginEventsInit();
  }
};

/**
 * Post-login setup: load playlists, show grab button, hide login form.
 * @param {Object} user - Firebase user object
 */
firetable.actions.loggedIn = function (user) {
  firetable.debug && console.log("user signed in!");

  // Preserve login form HTML before removing
  if ($("#login").html()) {
    firetable.loginForm = $("#login").html();
    firetable.ui.loginEventsDestroy();
    $("#login").remove();
  }

  // Re-attach logged-in panels if they were detached
  if (firetable.$appShell && !$('#appShell').length) {
    $('#mainGrid').append(firetable.$appShell);
  }

  // Set display name and avatar
  var displayName = user.uid;
  if (ftapi.users[ftapi.uid] && ftapi.users[ftapi.uid].username) {
    displayName = ftapi.users[ftapi.uid].username;
  }
  $("#loggedInName").text(displayName);
  $("#loggedInUser .botson").css("background-image", "url(" + firetable.utilities.avatarURL(ftapi.uid, displayName) + ")");
  $("#avatarStylePicker").val(firetable.avatarStyle);

  // Load all playlists into the picker
  ftapi.lookup.allLists(function (allPlaylists) {
    $("#listpicker").off("change");
    $("#listpicker").html('<option value="1">Add/Delete Playlist</option><option value="0">Default Queue</option>');
    for (var key in allPlaylists) {
      if (allPlaylists.hasOwnProperty(key)) {
        $("#listpicker").append('<option id="pdopt' + key + '" value="' + key + '">' + allPlaylists[key].name + '</option>');
      }
    }

    ftapi.lookup.selectedList(function (selectedList) {
      $("#listpicker").val(selectedList).change();
      $("#listpicker").change(function () {
        var val = $("#listpicker").val();
        if (val === "1") {
          // Show playlist manager
          $("#mainqueuestuff, #filterMachine, #addbox").css("display", "none");
          $("#cancelqsearch").hide();
          $("#qControlButtons").hide();
          $("#plmanager").css("display", "flex");
        } else if (val !== ftapi.selectedListThing) {
          // Switch to selected playlist
          $("#mainqueuestuff, #filterMachine").css("display", "block");
          $("#addbox").css("display", "none");
          $("#cancelqsearch").hide();
          $("#qControlButtons").show();
          $("#plmanager").css("display", "none");
          ftapi.actions.switchList(val);
        } else {
          // Already on this playlist
          $("#mainqueuestuff, #filterMachine").css("display", "block");
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
  $('#mainGrid').removeClass('login').removeClass('pre-auth').addClass('mmusrs');
  firetable.ui.showView(firetable.ui.getViewFromPath(), false);
  firetable.ui.syncNavState();
  $("#grab").css("display", "inline-block");
};

// ─── User Lookup ─────────────────────────────────────────────────────────────

/**
 * Find a user's UID by their display name.
 * Falls back to checking if `name` is itself a valid UID.
 * @param {string} name - Display name to search for
 * @returns {string|false} UID if found, false otherwise
 */
firetable.actions.uidLookup = function (name) {
  var match = false;
  var usrs = ftapi.users;
  for (var key in usrs) {
    if (usrs.hasOwnProperty(key) && ftapi.users[key].username === name) {
      match = key;
    }
  }
  if (!match && ftapi.users[name]) match = name;
  return match;
};

/**
 * Grab (copy) the currently-playing song into the user's queue.
 */
firetable.actions.grab = function () {
  if (firetable.song.cid !== 0) {
    var title = firetable.song.artist + " - " + firetable.song.title;
    firetable.actions.queueTrack(firetable.song.cid, title, firetable.song.type, true);
  }
};

/**
 * Unban a user by UID.
 * @param {string} userid
 */
firetable.actions.unban = function (userid) {
  ftapi.actions.unbanUser(userid);
};

// ─── Login Form Events ──────────────────────────────────────────────────────

/**
 * Bind click/keyup handlers on the login, signup, and password reset forms.
 */
firetable.ui.loginEventsInit = function () {
  // Tab switching
  $("#resetpass").bind("click", function () {
    $("#logscreen, #createscreen").css("display", "none");
    $("#resetscreen").css("display", "block");
    firetable.ui.loginLinkToggle(this.id);
  });
  $("#loginlink").bind("click", function () {
    $("#logscreen").css("display", "block");
    $("#createscreen, #resetscreen").css("display", "none");
    firetable.ui.loginLinkToggle(this.id);
  });
  $("#signuplink").bind("click", function () {
    $("#createscreen").css("display", "block");
    $("#logscreen, #resetscreen").css("display", "none");
    firetable.ui.loginLinkToggle(this.id);
  });

  // Login via Enter
  $("#loginpass").bind("keyup", function (e) {
    if (e.which === 13) {
      var email = $("#loginemail").val();
      var pass = $("#loginpass").val();
      $("#loginemail, #loginpass").val("");
      firetable.actions.logIn(email, pass);
    }
  });

  // Signup via Enter
  $("#newpass2").bind("keyup", function (e) {
    if (e.which === 13) {
      var email = $("#newemail").val();
      var pass = $("#newpass").val();
      var pass2 = $("#newpass2").val();
      var username = $("#newusername").val();
      if (pass === pass2) {
        firetable.actions.signUp(email, pass, username);
      } else {
        alert("Those passwords do not match!");
      }
    }
  });

  // Password reset via Enter
  $("#theAddress").bind("keyup", function (e) {
    if (e.which === 13) {
      var email = $(this).val();
      firetable.debug && console.log("reset email return");
      ftapi.actions.resetPassword(email, function (error) {
        if (error.code === 'auth/wrong-password') {
          alert('Wrong password.');
        } else {
          alert(error.message);
        }
        firetable.debug && console.log('send pass reset error:', error);
      });
      alert("Reset email sent. Click the reset link when it arrives thanks.");
    }
  });

  // Create Account button
  $("#createAccountBttn").bind("click", function () {
    var email = $("#newemail").val();
    var pass = $("#newpass").val();
    var pass2 = $("#newpass2").val();
    var termsAgreedTo = $("#agreetoterms").is(":checked");
    var username = $("#newusername").val();
    if (!termsAgreedTo) {
      alert("You must read and agree to the Terms of Service and Privacy Policy before you can create an account.");
    } else if (pass !== pass2) {
      alert("Those passwords do not match!");
    } else {
      firetable.actions.signUp(email, pass, username);
    }
  });

  // Reset Password button
  $("#resetPassBttn").bind("click", function () {
    var email = $("#theAddress").val();
    firetable.debug && console.log("reset email click button");
    ftapi.actions.resetPassword(email, function (error) {
      if (error.code === 'auth/wrong-password') {
        alert('Wrong password.');
      } else {
        alert(error.message);
      }
      firetable.debug && console.log('send pass reset error:', error);
    });
    alert("Reset email sent. Click the reset link when it arrives thanks.");
  });

  // Login button
  $("#loginBttn").bind("click", function () {
    var email = $("#loginemail").val();
    var pass = $("#loginpass").val();
    $("#loginemail, #loginpass").val("");
    firetable.actions.logIn(email, pass);
  });
};

/**
 * Unbind all login form event handlers (before removing the form from DOM).
 */
firetable.ui.loginEventsDestroy = function () {
  $("#resetpass, #loginlink, #signuplink").off("click");
  $("#loginpass, #newpass2, #theAddress").off("keyup");
  $("#createAccountBttn, #resetPassBttn, #loginBttn").off("click");
};

/**
 * Toggle the active state of login/signup/reset links.
 * @param {string} id - ID of the link to mark as selected
 */
firetable.ui.loginLinkToggle = function (id) {
  $("#formlinks").find(".selected").removeClass("selected");
  $("#" + id).addClass("selected");
};

// ─── User Event Binding ──────────────────────────────────────────────────────

/**
 * Build a user-list HTML string for a user object (used by userJoined / userChanged).
 * @param {Object} data - User data from ftapi
 * @returns {string} Inner HTML for the user row
 */
function buildUserHTML(data) {
  var blockcon = data.blocked ? "block" : "";
  var herecon = "lens";
  var isIdle = "";

  if (data.idle) {
    if (data.idle.isIdle && !data.hostbot) isIdle = "idle";
    if (data.idle.audio === 2) herecon = "label_important";
  }

  if (!data.username) data.username = data.userid;
  var roleicon = "person";
  var roleiconclass = "material-icons";
  if (data.mod) { roleicon = "shield"; roleiconclass = "material-icons-outlined"; }
  if (data.supermod) { roleicon = "local_police"; roleiconclass = "material-icons"; }
  if (data.hostbot) { roleicon = "smart_toy"; roleiconclass = "material-icons"; }

  return '<div class="botson" style="background-image:url(' + firetable.utilities.avatarURL(data.userid, data.username, null, data.avatarStyle) + ');">' +
         '<span class="material-icons blockon">' + blockcon + '</span>' +
         '</div>' +
         '<span class="' + roleiconclass + ' prsnRole">' + roleicon + '</span>' +
         '<div class="prsnNameRole" title="Joined ' + firetable.utilities.format_date(data.joined) + '">' +
         '<span class="prsnName">' + data.username + '</span>' +
         '</div>';
}

/**
 * Determine which user list section a user belongs to.
 * @param {Object} data - User data
 * @returns {string} jQuery selector for the container
 */
function getUserDestination(data) {
  if (data.hostbot) return "#usersBot";
  if (data.supermod) return "#usersSuper";
  if (data.mod) return "#usersMod";
  return "#usersRegular";
}

/**
 * Set up all ftapi user-related event handlers.
 * Called once from firetable.ui.init().
 */
firetable.ui.setupUserEvents = function () {

  // ── Auth state events (already bound in init.js, but user-list events here) ──

  ftapi.events.on("userJoined", function (data) {
    console.log(data);
    var isIdle = "";
    if (data.idle && data.idle.isIdle && !data.hostbot) isIdle = "idle";
    var $el = $("<div></div>")
      .addClass("prson" + (data.blocked ? " blockd" : "") + (isIdle ? " " + isIdle : ""))
      .attr("id", "user" + data.userid)
      .html(buildUserHTML(data));
    firetable.utilities.chatAt($el);
    $(getUserDestination(data)).append($el);
  });

  ftapi.events.on("userLeft", function (data) {
    $("#user" + data.userid).remove();
  });

  ftapi.events.on("userChanged", function (data) {
    console.log("CHANGE", data);
    $("#user" + data.userid).html(buildUserHTML(data));
  });

  ftapi.events.on("usersChanged", function (okdata) {
    // Update own display name and avatar if it was showing UID
    if (ftapi.uid && ftapi.users[ftapi.uid] && ftapi.users[ftapi.uid].username) {
      var ownUsername = ftapi.users[ftapi.uid].username;
      if ($("#loggedInName").text() === ftapi.uid) {
        $("#loggedInName").text(ownUsername);
      }
      $("#loggedInUser .botson").css("background-image", "url(" + firetable.utilities.avatarURL(ftapi.uid, ownUsername) + ")");
    }
    // Show supermod controls if applicable
    if (ftapi.uid && ftapi.users[ftapi.uid] && ftapi.users[ftapi.uid].supermod) {
      if ($("#ftSuperCopButton").is(":hidden")) {
        $("#ftSuperCopButton").show();
      }
      $("#modTab").show();
    }
    var count = Object.keys(okdata).length;
    $("#label1 .count").text(" (" + count + ")");
    firetable.debug && console.log('users:', okdata);
  });

  // ── User tab switching ──
  $("#label1").bind("click.lb1tab", firetable.ui.usertab1);
  $("#label2").bind("click.lb2tab", firetable.ui.usertab2);

  // ── Username change ──
  $("#changeUsername").bind("keyup", function (e) {
    if (e.which !== 13) return;
    var newDjName = $(this).val();
    $("#usernameResponse").html("");
    if (newDjName) {
      ftapi.actions.changeName(newDjName, function (error) {
        if (error) {
          alert(error);
          $("#usernameResponse").text(error);
        } else {
          $("#usernameResponse").text("Great job! Your name is now " + newDjName);
          $("#loggedInName").text(newDjName);
        }
      });
    }
  });

  // ── Supermod ban search ──
  $("#supercopSearch").bind("keyup", function (e) {
    if (e.which !== 13) return;
    var val = $(this).val();
    $("#supercopResponse").html("");
    if (val) {
      ftapi.lookup.userByName(val, function (person) {
        if (person) {
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
  });
};

// ─── User Tab Helpers ────────────────────────────────────────────────────────

/** Show the "All Users" tab, hide the "Waitlist" tab. */
firetable.ui.usertab1 = function () {
  $("#allusersWrap").css("display", "block");
  $("#justwaitWrap").css("display", "none");
  $("#usertabs").find(".on").removeClass("on");
  $("#label1").addClass("on");
};

/** Show the "Waitlist" tab, hide the "All Users" tab. */
firetable.ui.usertab2 = function () {
  $("#usertabs").find(".on").removeClass("on");
  $("#label2").addClass("on");
  $("#allusersWrap").css("display", "none");
  $("#justwaitWrap").css("display", "block");
};
