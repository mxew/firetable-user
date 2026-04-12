/**
 * chat.js — Chat message rendering, slash commands, and @-mention keyboard UI.
 *
 * Handles:
 * - Rendering incoming chat messages (newChat event)
 * - Grouping consecutive messages from the same user
 * - Inline image rendering (when setting is enabled)
 * - Text → link conversion
 * - Emoji shortname conversion + twemoji parsing
 * - Mod delete button on messages
 * - Slash commands (/mod, /block, /shrug, /tableflip, etc.)
 * - @-mention autocomplete keyboard navigation
 * - Chat removal (chatRemoved event)
 */

firetable.actions = firetable.actions || {};

/**
 * Display a local-only response in chat (not sent to server).
 * Used for command feedback like block/unblock confirmations.
 * @param {string} txt - Message text
 */
firetable.actions.localChatResponse = function (txt) {
  if (txt.length) {
    $("#chats").append('<div class="newChat"><div class="lcrsp">' + txt + '</div></div>');
    firetable.utilities.scrollToBottom();
  }
};

// ─── Text Processing Helpers ─────────────────────────────────────────────────

firetable.ui = firetable.ui || {};

/**
 * Convert URLs in text to clickable <a> links.
 * When showImages is enabled and themeBox is false, image URLs are excluded
 * (they get handled separately by showImages()).
 * @param {string} text - Raw text
 * @param {boolean} [themeBox=false] - True when processing theme text (always linkify all)
 * @returns {string} Text with URLs wrapped in anchor tags
 */
firetable.ui.textToLinks = function (text, themeBox) {
  var re = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  if (firetable.showImages && !themeBox) {
    // Exclude image URLs — those are rendered inline by showImages()
    re = /(https?:\/\/(?![/|.|\w|\s|-]*(?:jpe?g|png|gif))[^" ]+)/g;
  }
  return text.replace(re, '<a href="$1" target="_blank" tabindex="-1">$1</a>');
};

/**
 * Find image URLs in chat text and replace them with inline <img> tags.
 * Auto-scrolls chat if user was already at the bottom when the image loads.
 * @param {string} chatTxt - Chat message text
 * @returns {string} Text with image URLs replaced by inline images
 */
firetable.ui.showImages = function (chatTxt) {
  if (!firetable.showImages) return chatTxt;

  var imageUrlRegex = /((http(s?):)([/|.|\w|\s|-])*\.(?:jpe?g|gif|png))/g;
  if (chatTxt.search(imageUrlRegex) >= 0) {
    chatTxt = chatTxt.replace(imageUrlRegex, function (imageUrl) {
      // Pre-load image to auto-scroll after it renders
      var chatImage = new Image();
      chatImage.onload = function () {
        if (firetable.utilities.isChatPrettyMuchAtBottom()) {
          firetable.utilities.scrollToBottom();
        }
      };
      chatImage.src = imageUrl;
      return '<a class="inlineImgLink" href="' + imageUrl + '" target="_blank" tabindex="-1">' +
             '<img src="' + imageUrl + '" class="inlineImage" />' +
             '<span role="button" class="hideImage">&times;</span></a>';
    });
  }
  return chatTxt;
};

/**
 * Strip HTML from a string using DOMParser.
 * @param {string} html - Raw HTML string
 * @returns {string} Plain text content
 */
firetable.ui.strip = function (html) {
  var doc = firetable.parser.parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

/**
 * Process raw chat text through the full formatting pipeline:
 * strip HTML → inline images → linkify → emoji → backtick code
 * @param {string} rawTxt - Unprocessed chat text
 * @returns {string} Formatted HTML string safe for insertion
 */
firetable.ui.formatChatText = function (rawTxt) {
  var txt = firetable.ui.strip(rawTxt);
  txt = firetable.ui.showImages(txt);
  txt = firetable.ui.textToLinks(txt);
  txt = firetable.utilities.emojiShortnamestoUnicode(txt);
  // Backtick → <code> blocks
  txt = txt.replace(/\`(.*?)\`/g, function (x) {
    return "<code>" + x.replace(/\`/g, "") + "</code>";
  });
  return txt;
};

// ─── Chat Event Binding ──────────────────────────────────────────────────────

/**
 * Set up all chat-related ftapi event listeners and keyboard handlers.
 * Called once from firetable.ui.init().
 */
firetable.ui.setupChatEvents = function () {
  var $chatTemplate = $('#chatKEY').remove();

  // ── Incoming Chat Messages ──
  ftapi.events.on("newChat", function (chatData) {
    if (chatData.botCmd) return;
    var namebo = chatData.id;
    var utitle = "";
    var atBottom = firetable.utilities.isChatPrettyMuchAtBottom();

    // Resolve current user's display name for @-mention detection
    var you = ftapi.uid;
    if (ftapi.users[ftapi.uid] && ftapi.users[ftapi.uid].username) {
      you = ftapi.users[ftapi.uid].username;
    }

    // Resolve sender's display name and role
    if (ftapi.users[chatData.id]) {
      if (ftapi.users[chatData.id].username) namebo = ftapi.users[chatData.id].username;
      if (ftapi.users[chatData.id].mod) utitle = "mod";
      if (ftapi.users[chatData.id].supermod) utitle = "supermod";
      if (ftapi.users[chatData.id].hostbot) utitle = "robot";
    } else if (chatData.name) {
      namebo = chatData.name;
    }

    // ── @-mention detection ──
    var badoop = false;
    if (chatData.txt.match("@" + you, 'i') || chatData.txt.match(/\@everyone/)) {
      var timeSinceMessage = Date.now() - chatData.time;
      if (timeSinceMessage < 10 * 1000) {
        firetable.utilities.playSound("sound");
        if (firetable.desktopNotifyMentions) {
          firetable.utilities.desktopNotify(chatData, namebo);
        }
        badoop = true;
      }
    }

    // ── Check if we can delete this message (mod powers) ──
    var canDelete = function () {
      try {
        if (!ftapi.users[ftapi.uid].mod && !ftapi.users[ftapi.uid].supermod) return false;
        if (ftapi.users[chatData.id]) {
          if (ftapi.users[chatData.id].mod || ftapi.users[chatData.id].supermod) return false;
        }
        return !chatData.hidden;
      } catch (e) {
        return false;
      }
    };

    // Format the message text
    var txtOut = firetable.ui.formatChatText(chatData.txt);
    if (chatData.hidden) txtOut = "[message removed]";

    if (chatData.id === firetable.lastChatPerson && !badoop) {
      // ── Group with previous message from same user ──
      $("#chat" + firetable.lastChatId + " .chatContent").append(
        '<div id="chattxt' + chatData.chatID + '" class="chatText"></div>'
      );
      $("#chatTime" + firetable.lastChatId).text(firetable.utilities.format_time(chatData.time));
      $("#chattxt" + chatData.chatID).html(txtOut);

      if (canDelete()) {
        $("#chattxt" + chatData.chatID).addClass("deleteMe");
        $("#chattxt" + chatData.chatID).append('<div class="modDelete">x</div>');
        $("#chattxt" + chatData.chatID).find(".modDelete").on('click', function () {
          ftapi.actions.deleteChat(chatData.feedID);
        });
      }
      twemoji.parse(document.getElementById("chattxt" + chatData.chatID));

    } else {
      // ── New message block (different user or @-mention break) ──
      var $chatthing = $chatTemplate.clone();
      $chatthing.attr('id', "chat" + chatData.chatID);
      $chatthing.find('.ft-avatar').css(
        'background-image',
        "url(" + firetable.utilities.avatarURL(chatData.id, namebo) + ")"
      );
      $chatthing.find('.utitle').html(utitle);
      $chatthing.find('.chatTime')
        .attr('id', "chatTime" + chatData.chatID)
        .html(firetable.utilities.format_time(chatData.time));
      if (badoop) $chatthing.addClass('badoop');

      $chatthing.find(".chatText").html(txtOut).attr('id', "chattxt" + chatData.chatID);
      $chatthing.find(".chatName").text(namebo);

      // Click-to-@ on avatar and name
      firetable.utilities.chatAt($chatthing.find('.ft-avatar'));
      firetable.utilities.chatAt($chatthing.find('.chatName'));
      twemoji.parse($chatthing.find(".chatText")[0]);
      $chatthing.appendTo("#chats");

      if (canDelete()) {
        $chatthing.find(".chatText").addClass("deleteMe");
        $chatthing.find(".chatText").append('<div class="modDelete">x</div>');
        $chatthing.find(".modDelete").on('click', function () {
          ftapi.actions.deleteChat(chatData.feedID);
        });
      }

      firetable.lastChatPerson = chatData.id;
      firetable.lastChatId = chatData.chatID;
    }

    // ── Inline card rendering ──
    if (chatData.card) {
      $("#chattxt" + chatData.chatID).append(
        '<canvas width="225" height="300" class="chatCard" id="cardMaker' + chatData.chatID + '"></canvas>'
      );
      firetable.actions.showCard(chatData.card, chatData.chatID);
    }

    // Auto-scroll if user was at bottom or is the sender
    if (atBottom || ftapi.uid === chatData.id) {
      firetable.utilities.scrollToBottom();
    }
  });

  // ── Chat Removal (mod delete) ──
  ftapi.events.on("chatRemoved", function (data) {
    $("#chattxt" + data.chatID).text("[message removed]");
    try {
      if (ftapi.users[ftapi.uid].mod || ftapi.users[ftapi.uid].supermod) {
        $("#chattxt" + data.chatID).removeClass("deleteMe");
      }
    } catch (e) {}
  });

  // ── Hide inline image button ──
  $(document).on('click', '.hideImage', function (e) {
    e.stopPropagation();
    e.preventDefault();
    $(this).closest('.chatText').toggleClass('hideImg');
  });

  // ── Chat Input: Send Message + Slash Commands ──
  $("#newchat").bind("keypress", function (e) {
    if (e.key === "Enter") {
      var txt = $("#newchat").val();
      if (txt === "") return;

      // Hot/Rain emoji toggle for quick reactions
      if (txt === ":fire:" || txt === "🔥") {
        $("#cloud_with_rain").removeClass("on");
        $("#fire").addClass("on");
      } else if (txt === ":cloud_with_rain:" || txt === "🌧") {
        $("#cloud_with_rain").addClass("on");
        $("#fire").removeClass("on");
      }

      // ── Slash Commands ──
      var matches = txt.match(/^(?:[\/])(\w+)\s*(.*)/i);
      if (matches) {
        var command = matches[1].toLowerCase();
        var args = matches[2];

        switch (command) {
          case "mod":
            var personToMod = firetable.actions.uidLookup(args);
            if (personToMod) ftapi.actions.modUser(personToMod);
            break;
          case "unmod":
            var personToUnmod = firetable.actions.uidLookup(args);
            if (personToUnmod) ftapi.actions.unmodUser(personToUnmod);
            break;
          case "block":
            if (args) {
              ftapi.actions.blockUser(args, function (response) {
                firetable.actions.localChatResponse(response);
              });
            }
            break;
          case "unblock":
            if (args) {
              ftapi.actions.unblockUser(args, function (response) {
                firetable.actions.localChatResponse(response);
              });
            }
            break;
          case "hot":
            ftapi.actions.sendChat(":fire:");
            $("#cloud_with_rain").removeClass("on");
            $("#fire").addClass("on");
            break;
          case "storm":
            ftapi.actions.sendChat(":cloud_with_rain:");
            $("#cloud_with_rain").addClass("on");
            $("#fire").removeClass("on");
            break;
          case "shrug":
            ftapi.actions.sendChat((args ? args + " " : "") + "¯\\_(ツ)_/¯");
            break;
          case "tableflip":
            ftapi.actions.sendChat((args ? args + " " : "") + "(╯°□°）╯︵ ┻━┻");
            break;
          case "unflip":
            ftapi.actions.sendChat((args ? args + " " : "") + "┬─┬ ノ( ゜-゜ノ)");
            break;
        }
      } else {
        // Regular chat message
        ftapi.actions.sendChat(txt);
      }

      $("#newchat").val("");
      $("#emojiPicker").slideUp();
      $("#pickEmoji").removeClass("on");
      firetable.utilities.exitAtLand();

    } else if (e.key === "@") {
      // ── @-mention autocomplete trigger ──
      if (firetable.atLand) {
        firetable.utilities.exitAtLand(); // double @@ cancels
      } else {
        firetable.utilities.initAtLand();
        $('#atPicker').addClass('show');
        for (var i = 0; i < firetable.atUsersFiltered.length; i++) {
          $('<div class="atPickerThing"><button class="butt graybutt" role="button">@' +
            firetable.atUsersFiltered[i] + '</button></div>').appendTo('#atPicker');
        }
      }

    } else if (firetable.atLand) {
      // ── @-mention: filter as user types ──
      if (e.key === " " || e.key === "Spacebar") {
        firetable.utilities.exitAtLand();
      } else if (!e.key.match(/[0-9a-zA-Z_]/)) {
        firetable.atString += e.key;
        $('#atPicker').html('');
        $('<div class="atPickerThing"><i>Usernames cannot contain "' + e.key + '"</i></div>').appendTo('#atPicker');
      } else {
        firetable.atString += e.key;
        firetable.utilities.updateAtLand();
      }
    }
  });

  // ── @-mention: backspace/arrow navigation ──
  $("#newchat").bind("keyup", function (e) {
    if (!firetable.atLand) return;
    if (e.key === "Backspace") {
      if (!firetable.atString) {
        firetable.utilities.exitAtLand();
      } else {
        firetable.atString = firetable.atString.slice(0, -1);
        firetable.utilities.updateAtLand();
      }
    } else if (e.key === "ArrowUp") {
      $('#atPicker .butt:last').focus();
    } else if (e.key === "ArrowDown") {
      $('#atPicker .butt:first').focus();
    }
  });

  // ── @-mention: Tab to auto-complete ──
  $("#newchat").bind("keydown", function (e) {
    if (e.key === "Tab") {
      if (firetable.atUsersFiltered.length === 1) {
        $("#newchat").one("blur", function () {
          $("#newchat").focus().val($("#newchat").val());
        });
        firetable.utilities.chooseAt(firetable.atUsersFiltered[0]);
      } else {
        firetable.utilities.exitAtLand();
      }
    }
  });

  // ── @-mention: click on dropdown item ──
  $(document).on('click', '#atPicker .butt', function (e) {
    e.preventDefault();
    firetable.utilities.chooseAt($(this).text().replace("@", ""));
    setTimeout(function () {
      var tempText = $("#newchat").val();
      $('#newchat').focus().val('');
      $('#newchat').val(tempText);
    }, 250);
  });

  // ── @-mention: arrow keys within dropdown ──
  $(document).on('keyup', '#atPicker .butt:focus', function (e) {
    if (e.key === "ArrowUp") {
      var $prev = $('#atPicker .butt:focus').parent().prev();
      if ($prev.length) {
        $prev.find('.butt').focus();
      } else {
        $('#atPicker .butt:last').focus();
      }
    } else if (e.key === "ArrowDown") {
      var $next = $('#atPicker .butt:focus').parent().next();
      if ($next.length) {
        $next.find('.butt').focus();
      } else {
        $('#atPicker .butt:first').focus();
      }
    }
  });

  // ── "More chats" scroll-to-bottom button ──
  $("#morechats .butt").bind("click", function () {
    firetable.utilities.scrollToBottom();
  });

  // ── Fire / Rain reaction buttons ──
  $("#fire").bind("click", function () {
    if (firetable.song) {
      var $fires = $(".npmsg" + firetable.song.cid).last().find(".npmsg-fires");
      if ($fires.text() === "") {
        $fires.text("🔥").css("font-size", "10px");
      } else {
        var currentSize = parseInt($fires.css("font-size")) || 10;
        $fires.css("font-size", (currentSize + 3) + "px");
      }
      if (firetable.utilities.isChatPrettyMuchAtBottom()) firetable.utilities.scrollToBottom();
    }
    $("#fire").addClass("on");
  });
  $("#cloud_with_rain").bind("click", function () {
    ftapi.actions.sendChat(":cloud_with_rain:");
    $("#cloud_with_rain").addClass("on");
    $("#fire").removeClass("on");
  });
};
