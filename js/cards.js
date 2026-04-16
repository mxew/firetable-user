/**
 * cards.js — DJ card rendering on HTML5 Canvas.
 *
 * DJ cards are collectible items showing a song that was played, the DJ who
 * played it, album art, and a unique card number. They can be shared in chat
 * or gifted to the current DJ.
 *
 * Special edition cards (id8, id9) have custom artwork for anniversary events.
 */

firetable.actions = firetable.actions || {};

$(document)
  .off('click.cardStatsToggle')
  .on('click.cardStatsToggle', '#cardStats .hist-day-header', function () {
    var $group = $(this).closest('.hist-day-group');
    $group.toggleClass('collapsed');
    $(this).attr('aria-expanded', String(!$group.hasClass('collapsed')));
  });

/**
 * Build a stats panel for the current card collection.
 * @param {Object} data - Card collection keyed by card ID
 * @returns {string} HTML for the stats panel
 */
firetable.actions.renderCardStats = function (data) {
  var keys = Object.keys(data || {});
  var total = keys.length;
  var minTemp = null;
  var maxTemp = null;
  var perDj = {};

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  keys.forEach(function (key) {
    var card = data[key] || {};
    var dj = (card.djname || 'Unknown DJ').trim() || 'Unknown DJ';
    var temp = Number(card.temp);

    perDj[dj] = (perDj[dj] || 0) + 1;

    if (!isNaN(temp)) {
      if (minTemp === null || temp < minTemp) minTemp = temp;
      if (maxTemp === null || temp > maxTemp) maxTemp = temp;
    }
  });

  var djRows = Object.keys(perDj).sort(function (a, b) {
    if (perDj[b] !== perDj[a]) return perDj[b] - perDj[a];
    return a.localeCompare(b);
  }).map(function (name) {
    return (
      '<span class="cardStatDjRow">' +
      '<span class="cardStatDjName">' + escapeHtml(name) + '</span>' +
      '<span class="cardStatDjCount">' + perDj[name] + '</span>' +
      '</span>'
    );
  }).join('');

  return (
    '<section id="cardStats">' +
    '<div class="cardStatsSummary">' +
    '<div class="cardStatTile"><span class="cardStatLabel">Total Cards</span><span class="cardStatValue">' + total + '</span></div>' +
    '<div class="cardStatTile"><span class="cardStatLabel">Unique DJs</span><span class="cardStatValue">' + Object.keys(perDj).length + '</span></div>' +
    '<div class="cardStatTile"><span class="cardStatLabel">Lowest Temp</span><span class="cardStatValue">' + (minTemp === null ? '--' : (minTemp + '°')) + '</span></div>' +
    '<div class="cardStatTile"><span class="cardStatLabel">Highest Temp</span><span class="cardStatValue">' + (maxTemp === null ? '--' : (maxTemp + '°')) + '</span></div>' +
    '</div>' +
    '<div class="cardStatDjBreakdown hist-day-group collapsed">' +
    '<div class="hist-day-header" role="button" aria-expanded="false">Cards Per DJ</div>' +
    '<div class="hist-day-items cardStatDjList">' + djRows + '</div>' +
    '</div>' +
    '</section>'
  );
};

/**
 * Open the card case modal and render all cards the user owns.
 */
firetable.actions.cardCase = function () {
  $("#cardsMain").html("");
  ftapi.lookup.cardCollection(function (data) {
    if (!data) {
      var $empty = $('<p class="cardsEmpty"><span class="emoji">📭</span><br />You don\'t have any cards yet.</p>');
      $("#cardsMain").html($empty);
      twemoji.parse($("#cardsMain")[0]);
      return;
    }
    $("#cardsMain").append(firetable.actions.renderCardStats(data));
    for (var key in data) {
      if (!data.hasOwnProperty(key)) continue;
      var childData = data[key];
      firetable.debug && console.log('card:', childData);
      $("#cardsMain").append(
        '<span id="caseCardSpot' + key + '" class="caseCardSpot">' +
        '<canvas width="225" height="300" class="caseCard" id="cardMaker' + key + '"></canvas>' +
        '<span role="button" onclick="firetable.actions.giftCard(\'' + key + '\')" class="cardGiftChat">Gift to DJ</span>' +
        '<span role="button" onclick="firetable.actions.chatCard(\'' + key + '\')" class="cardShareChat">Share In Chat</span>' +
        '<span role="button" onclick="firetable.actions.viewLargerCard(\'' + key + '\')" class="cardViewLarger">View Larger</span>' +
        '</span>'
      );
      firetable.actions.displayCard(childData, key);
    }
  });
};

/**
 * Share a card in chat (sends a message with the card ID attached).
 * @param {string} cardid - Card key
 */
firetable.actions.chatCard = function (cardid) {
  ftapi.actions.sendChat("Check out my card...", cardid);
};

/**
 * Open a near-fullscreen modal showing just the card canvas.
 * @param {string} cardid - Card key
 */
firetable.actions.viewLargerCard = function (cardid) {
  var $src = $('#cardMaker' + cardid);
  if (!$src.length) return;
  // Clone the canvas and draw the source into it at native resolution
  var srcCanvas = $src[0];
  var $dest = $('#cardViewLargerCanvas');
  var dest = $dest[0];
  dest.width  = srcCanvas.width;
  dest.height = srcCanvas.height;
  dest.getContext('2d').drawImage(srcCanvas, 0, 0);
  $('#overlay').addClass('show');
  $('#cardViewLargerModal').addClass('show');
};

/**
 * Gift a card to the current DJ (removes it from your collection).
 * @param {string} cardid - Card key
 */
firetable.actions.giftCard = function (cardid) {
  ftapi.actions.sendChat("!giftcard :gift:", cardid);
  $("#caseCardSpot" + cardid).remove();
};

/**
 * Fetch card data from the server and render it on a canvas.
 * Used when a card is shared in chat.
 * @param {string} cardid - Card key
 * @param {string} chatid - Chat element ID (for the canvas target)
 */
firetable.actions.showCard = function (cardid, chatid) {
  ftapi.lookup.card(cardid, function (data) {
    firetable.actions.displayCard(data, chatid);
  });
};

/**
 * Render a DJ card onto a canvas element.
 *
 * Layout (225×300px):
 * - Top bar: DJ name + coloured circle with card number
 * - Centre: Avatar image overlaid on gradient
 * - Accent stripe: Card metadata (number, temperature)
 * - Bottom: Song title, artist, album art thumbnail, date
 *
 * @param {Object} data - Card data from the server
 * @param {string} data.djname - DJ's display name
 * @param {string} data.djid - DJ's user ID
 * @param {string} data.title - Song title
 * @param {string} data.artist - Artist name
 * @param {string} data.image - Album art URL
 * @param {Object} data.colors - {color, txt} accent colours
 * @param {number} data.cardnum - Unique card serial number
 * @param {string} data.num - Display number (single digit on circle badge)
 * @param {number} data.temp - "Max operating temperature" gag value
 * @param {number} data.date - Timestamp when the card was created
 * @param {string} [data.set] - Robohash set override
 * @param {string} [data.special] - Special edition identifier ("id8", "id9")
 * @param {string} chatid - Suffix for the canvas element ID ("cardMaker" + chatid)
 */
firetable.actions.displayCard = function (data, chatid) {
  firetable.debug && console.log("display card");

  // ── Normalize colours ──
  var defaultScheme = false;
  if (data.colors) {
    if (data.colors.color === "#fff" || data.colors.color === "#7f7f7f") {
      data.colors.color = firetable.orange;
      data.colors.txt = "#000";
      defaultScheme = true;
    }
  }

  // ── Default album art fallback ──
  if (data.image === "img/idlogo.png" && ftconfigs.defaultAlbumArtUrl.length) {
    data.image = ftconfigs.defaultAlbumArtUrl;
  }

  var set = data.set || "set1";
  var canvas = document.getElementById('cardMaker' + chatid);
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ── Background ──
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 225, 300);

  // ── Centre image area with gradient overlay ──
  ctx.fillStyle = defaultScheme ? "#fff" : data.colors.color;
  ctx.fillRect(1, 30, 223, 175);

  var grd = ctx.createLinearGradient(0, 0, 0, 175);
  grd.addColorStop(0, "rgba(0, 0, 0, 0.75)");
  grd.addColorStop(1, "rgba(0, 0, 0, 0.55)");
  ctx.fillStyle = grd;
  ctx.fillRect(1, 30, 223, 175);

  // ── Accent stripe ──
  ctx.fillStyle = data.colors.color;
  ctx.fillRect(1, 205, 223, 10);

  // ── Bottom info area ──
  ctx.fillStyle = "#151515";
  ctx.fillRect(1, 216, 223, 75);

  // ── DJ name (top left) ──
  ctx.fillStyle = "#eee";
  ctx.font = "700 11px Helvetica, Arial, sans-serif";
  ctx.fillText(data.djname, 10, 20);

  // ── Print date + room name (bottom centre) ──
  ctx.font = "400 8px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "Printed " + firetable.utilities.format_date(data.date) + " | " + ftconfigs.roomNameShort,
    112.5, 299
  );

  // ── Song title (wraps) ──
  ctx.font = "700 10px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  var linez = firetable.utilities.wrapText(ctx, data.title, 66, 240, 160, 15);

  // ── Artist ──
  ctx.font = "400 8px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  firetable.utilities.wrapText(ctx, data.artist, 66, 253 + (15 * linez), 160, 15);

  // ── Metadata stripe text ──
  ctx.fillStyle = data.colors.txt;
  ctx.font = "400 9px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Card No. " + data.cardnum + " | DJ Card | Max Operating Temp " + data.temp + "°", 112.5, 214);

  // ── Number badge circle (top right) ──
  ctx.beginPath();
  ctx.arc(205, 15, 12, 0, 2 * Math.PI, false);
  ctx.fillStyle = data.colors.color;
  ctx.fill();

  ctx.fillStyle = data.colors.txt;
  ctx.font = "700 15px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(data.num, 200.5, 20);

  // ── Image Drawing ─────────────────────────────────────────────────────
  /**
   * Default image loader: draws avatar + album art thumbnail.
   */
  var doImages = function () {
    var avatarImg = new Image();
    avatarImg.onload = function () {
      ctx.drawImage(this, 20, 30, 175, 175);
      var albumImg = new Image();
      albumImg.onload = function () {
        var height = data.image.match(/ytimg.com/) ? 28 : 50;
        ctx.drawImage(this, 10, 230, 50, height);
        ctx = null; // release context
      };
      albumImg.src = data.image;
    };
    avatarImg.src = firetable.utilities.avatarURL(data.djid, data.djname, "175x175");
  };

  // ── Special Edition Cards ─────────────────────────────────────────────
  if (data.special === "id8") {
    // 8th anniversary card
    ctx.fillStyle = data.colors.color;
    ctx.fillRect(1, 30, 223, 10);
    ctx.fillStyle = data.colors.txt;
    ctx.font = "400 10px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Celebrating 8 Years of Indie Discotheque", 112.5, 38);

    var cake = new Image();
    cake.onload = function () {
      ctx.drawImage(this, 10, 50, 35, 35);
      var eight = new Image();
      eight.onload = function () {
        ctx.drawImage(this, 180, 50, 35, 35);
        doImages();
      };
      eight.src = 'img/8.png';
    };
    cake.src = 'img/cake.png';

  } else if (data.special === "id9") {
    // 9th anniversary card — rotated robot avatar + custom background
    ctx.fillStyle = data.colors.color;
    ctx.fillRect(1, 30, 223, 10);
    ctx.fillStyle = data.colors.txt;
    ctx.font = "400 10px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Celebrating 9 Years of Indie Discotheque", 112.5, 38);

    var arnold = new Image();
    arnold.onload = function () {
      ctx.drawImage(this, 5, 50, 45, 45);
      var avatar = new Image();
      avatar.onload = function () {
        // Draw rotated avatar
        ctx.save();
        ctx.translate(75 * 0.5, 75 * 0.5);
        ctx.rotate(0.959931); // ~55 degrees
        ctx.translate(-75 * 0.5, -75 * 0.5);
        ctx.drawImage(this, 125, -81, 75, 75);
        ctx.restore();

        var bgImg = new Image();
        bgImg.onload = function () {
          ctx.drawImage(this, 25, 40, 170, 170);
          var albumImg = new Image();
          albumImg.onload = function () {
            var height = data.image.match(/ytimg.com/) ? 28 : 50;
            ctx.drawImage(this, 10, 230, 50, height);
            ctx = null;
          };
          albumImg.src = data.image;
        };
        bgImg.src = 'img/id9.png';
      };
      avatar.src = firetable.utilities.avatarURL(data.djid, data.djname);
    };
    arnold.src = 'img/arnold.png';

  } else {
    // Standard card
    doImages();
  }
};
