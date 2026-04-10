/**
 * glitch.js — p5.js album art glitch effect for SoundCloud tracks.
 *
 * Uses p5.js in global mode to create a canvas inside #scScreen.
 * When a SoundCloud track loads, setup(biggerImg) is called from room.js
 * to load the high-res album art and apply real-time pixel effects.
 *
 * Effects applied:
 * - Flow Line:   A horizontal bright stripe that scrolls downward
 * - Shift Line:  Random horizontal slices shifted left/right
 * - Shift RGB:   Random per-channel offset (chromatic aberration)
 * - Scat Image:  Random rectangular fragments repositioned
 *
 * Globals exposed (required by p5.js global mode):
 *   setup(useThis) — called automatically by p5 and from room.js newSong
 *   draw()         — called every frame by p5
 *   Glitch         — class instantiated in setup()
 *
 * Depends on: p5.js (loaded from CDN), firetable.scImg (set by room.js)
 */

/* jshint esversion: 6 */

// ─── State ───────────────────────────────────────────────────────────────────

/** @type {boolean} Whether the image has been loaded and Glitch is ready */
let isLoaded = false;

/** @type {Glitch|null} Current glitch instance */
let glitch = null;

/** @type {string} URL of the current SoundCloud album art */
let imgSrc = '';

// ─── p5.js Entry Points ─────────────────────────────────────────────────────

/**
 * p5.js setup — creates the canvas and loads the album art.
 * Also called directly from the newSong handler when a SC track starts.
 * @param {string} [useThis] - Image URL to load (defaults to firetable.scImg)
 */
function setup(useThis) {
  // Guard: p5.js may not have bound its globals yet (e.g. if called from
  // a Firebase event before p5 auto-initializes). Bail out — p5 will call
  // setup() itself once ready.
  if (typeof createCanvas === 'undefined') return;

  if (!useThis) useThis = firetable.scImg;
  background(0);

  var cnv = createCanvas($('#djStage').outerWidth(), $('#djStage').outerHeight());
  cnv.parent('scScreen');

  loadImage(useThis, function (img) {
    glitch = new Glitch(img);
    isLoaded = true;
    var $can = $('#scScreen canvas');
    var canrat = $can.width() / $can.height();
    $can.data('ratio', canrat);
  });
}

/**
 * p5.js draw loop — runs every frame.
 * Clears the canvas and renders the glitch effect if the image is loaded.
 */
function draw() {
  clear();
  background(0);
  if (isLoaded) {
    glitch.show();
  }
}

// ─── Glitch Class ────────────────────────────────────────────────────────────

/**
 * Pixel-level glitch effect engine.
 * Operates on the raw pixel buffer of a p5.Image to create visual distortions.
 */
class Glitch {
  /**
   * @param {p5.Image} img - The source image to apply effects to
   */
  constructor(img) {
    /** Number of channels per pixel (RGBA) */
    this.channelLen = 4;

    /** The p5 image being manipulated */
    this.imgOrigin = img;
    this.imgOrigin.loadPixels();

    /** Pristine copy of the original pixel data for restoration each frame */
    this.copyData = new Uint8ClampedArray(this.imgOrigin.pixels);

    /** Flow line effect objects — each one is a scrolling bright stripe */
    this.flowLineImgs = [];
    for (let i = 0; i < 1; i++) {
      this.flowLineImgs.push({
        pixels: null,
        t1: floor(random(0, 1000)),
        speed: floor(random(4, 24)),
        randX: floor(random(24, 80))
      });
    }

    /** Shift line effect buffers — horizontal slice displacement */
    this.shiftLineImgs = [];
    for (let i = 0; i < 6; i++) {
      this.shiftLineImgs.push(null);
    }

    /** Shift RGB effect buffers — per-channel offset (chromatic aberration) */
    this.shiftRGBs = [];
    for (let i = 0; i < 1; i++) {
      this.shiftRGBs.push(null);
    }

    /** Scattered image fragments — random rectangles repositioned */
    this.scatImgs = [];
    for (let i = 0; i < 3; i++) {
      this.scatImgs.push({ img: null, x: 0, y: 0 });
    }

    /** When false, effects are temporarily paused (shows clean image) */
    this.throughFlag = true;
  }

  /**
   * Overwrite pixel data of a destination image with source pixels.
   * @param {p5.Image}          destImg   - Image whose pixels are replaced
   * @param {Uint8ClampedArray} srcPixels - Source pixel buffer
   */
  replaceData(destImg, srcPixels) {
    for (let y = 0; y < destImg.height; y++) {
      for (let x = 0; x < destImg.width; x++) {
        let index = (y * destImg.width + x) * this.channelLen;
        destImg.pixels[index]     = srcPixels[index];     // R
        destImg.pixels[index + 1] = srcPixels[index + 1]; // G
        destImg.pixels[index + 2] = srcPixels[index + 2]; // B
        destImg.pixels[index + 3] = srcPixels[index + 3]; // A
      }
    }
    destImg.updatePixels();
  }

  /**
   * Flow Line effect — adds brightness to a single horizontal scan line
   * that scrolls vertically through the image.
   * @param {p5.Image} srcImg - Source image
   * @param {Object}   obj    - Effect state (t1, speed, randX)
   * @returns {Uint8ClampedArray} Modified pixel buffer
   */
  flowLine(srcImg, obj) {
    let destPixels = new Uint8ClampedArray(srcImg.pixels);
    obj.t1 %= srcImg.height;
    obj.t1 += obj.speed;
    let tempY = floor(obj.t1);

    for (let y = 0; y < srcImg.height; y++) {
      if (tempY === y) {
        for (let x = 0; x < srcImg.width; x++) {
          let index = (y * srcImg.width + x) * this.channelLen;
          destPixels[index]     = srcImg.pixels[index]     + obj.randX; // R
          destPixels[index + 1] = srcImg.pixels[index + 1] + obj.randX; // G
          destPixels[index + 2] = srcImg.pixels[index + 2] + obj.randX; // B
          // A stays the same
        }
      }
    }
    return destPixels;
  }

  /**
   * Shift Line effect — displaces a random horizontal band left or right.
   * @param {p5.Image} srcImg - Source image
   * @returns {Uint8ClampedArray} Modified pixel buffer
   */
  shiftLine(srcImg) {
    let destPixels = new Uint8ClampedArray(srcImg.pixels);
    let rangeH = srcImg.height;
    let rangeMin = floor(random(0, rangeH));
    let rangeMax = rangeMin + floor(random(1, rangeH - rangeMin));
    let offsetX = this.channelLen * floor(random(-40, 40));

    for (let y = 0; y < srcImg.height; y++) {
      if (y > rangeMin && y < rangeMax) {
        for (let x = 0; x < srcImg.width; x++) {
          let index = (y * srcImg.width + x) * this.channelLen;
          destPixels[index]     = srcImg.pixels[index + offsetX];     // R
          destPixels[index + 1] = srcImg.pixels[index + 1 + offsetX]; // G
          destPixels[index + 2] = srcImg.pixels[index + 2 + offsetX]; // B
          // A stays the same
        }
      }
    }
    return destPixels;
  }

  /**
   * Shift RGB effect — offsets each color channel independently to create
   * a chromatic aberration / color-split look.
   * @param {p5.Image} srcImg - Source image
   * @returns {Uint8ClampedArray} Modified pixel buffer
   */
  shiftRGB(srcImg) {
    let range = 16;
    let destPixels = new Uint8ClampedArray(srcImg.pixels);

    let randR = (floor(random(-range, range)) * srcImg.width + floor(random(-range, range))) * this.channelLen;
    let randG = (floor(random(-range, range)) * srcImg.width + floor(random(-range, range))) * this.channelLen;
    let randB = (floor(random(-range, range)) * srcImg.width + floor(random(-range, range))) * this.channelLen;

    for (let y = 0; y < srcImg.height; y++) {
      for (let x = 0; x < srcImg.width; x++) {
        let index = (y * srcImg.width + x) * this.channelLen;
        destPixels[index]     = srcImg.pixels[(index + randR) % srcImg.pixels.length];     // R
        destPixels[index + 1] = srcImg.pixels[(index + 1 + randG) % srcImg.pixels.length]; // G
        destPixels[index + 2] = srcImg.pixels[(index + 2 + randB) % srcImg.pixels.length]; // B
        // A stays the same
      }
    }
    return destPixels;
  }

  /**
   * Extract a random rectangular region from the source image.
   * @param {p5.Image} srcImg - Source image
   * @returns {p5.Image} Cropped sub-image
   */
  getRandomRectImg(srcImg) {
    let startX = floor(random(0, srcImg.width - 30));
    let startY = floor(random(0, srcImg.height - 50));
    let rectW  = floor(random(30, srcImg.width - startX));
    let rectH  = floor(random(1, 50));
    let destImg = srcImg.get(startX, startY, rectW, rectH);
    destImg.loadPixels();
    return destImg;
  }

  /**
   * Main render — called every frame from draw().
   * Restores original pixels, randomly applies effects, then draws to canvas.
   */
  show() {
    // Restore pristine pixel data
    this.replaceData(this.imgOrigin, this.copyData);

    // Randomly pause effects for short intervals (creates a "clean" flash)
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

    // Apply flow line
    this.flowLineImgs.forEach((v, i, arr) => {
      arr[i].pixels = this.flowLine(this.imgOrigin, v);
      if (arr[i].pixels) {
        this.replaceData(this.imgOrigin, arr[i].pixels);
      }
    });

    // Apply shift line
    this.shiftLineImgs.forEach((v, i, arr) => {
      if (floor(random(100)) > 50) {
        arr[i] = this.shiftLine(this.imgOrigin);
        this.replaceData(this.imgOrigin, arr[i]);
      } else if (arr[i]) {
        this.replaceData(this.imgOrigin, arr[i]);
      }
    });

    // Apply shift RGB
    this.shiftRGBs.forEach((v, i, arr) => {
      if (floor(random(100)) > 65) {
        arr[i] = this.shiftRGB(this.imgOrigin);
        this.replaceData(this.imgOrigin, arr[i]);
      }
    });

    // Draw the processed image centered on the canvas
    push();
    translate((width - this.imgOrigin.width) / 2, (height - this.imgOrigin.height) / 2);
    image(this.imgOrigin, 0, 0);
    pop();

    // Scatter random rectangular fragments
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
    });
  }
}
