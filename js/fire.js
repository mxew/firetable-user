
let pixelate = false;
let fireBackground = false;

var fyreStage = null;


class Ember
{
	constructor(colors, app, pixelate = false)
	{
		this.emberBlobs = [];
		
		this.embers = new PIXI.Container();
		
		if(pixelate && PIXI.filters && PIXI.filters.PixelateFilter)
		{
			this.embers.filters = [new PIXI.filters.PixelateFilter()]
		}
		
		colors.map(color => {
			var circle = new PIXI.Graphics();
			circle.lineStyle(0);
			circle.beginFill(color, 1);
			circle.drawCircle(0, 0, 10);
			circle.endFill();

			this.emberBlobs.push(app.renderer.generateTexture(circle));
		})
		
		
		setInterval(() => {
			this.addEmber();
		}, 300)
	}
	
	stoke(multiplier)
	{
		multiplier = multiplier || 1;
		let amount = Math.round((40 + Math.round(Math.random() * 20)) * multiplier);
		for(let i = 0; i < amount; i++)
		{
			this.addEmber();
		}
	}
	
	makeBlob()
	{
		let texture = this.emberBlobs[Math.floor(Math.random() * this.emberBlobs.length)]
		let blob = new PIXI.Sprite(texture);
		blob.anchor.set(0.5);
		let scaleScale = Math.random();
		blob.scale.set(0.4 * scaleScale, .5 * scaleScale);
		return blob;
	}
	
	addEmber()
	{
		let time = this.time * (0.3 + (Math.random() * 0.6));
		let blob = this.makeBlob();
		this.embers.addChild(blob);
		
		
		let bezier = [
			{
				x: (Math.random() * 160) - 80,
				y: -100
			},
			{
				x: Math.random() * 260 - 130, 
				y: -100 + Math.random() * -20
			},
			{
				x: Math.random() * 280 - 140, 
				y: -100 + (Math.random() * -50)
			},
			{
				x: Math.random() * 320 - 160, 
				y: -200 + (Math.random() * -50)
			},
			{
				x: Math.random() * 380 - 190, 
				y: -250 + (Math.random() * -100)
			},
			{	x: Math.random() * 620 - 310,  
			 	y: -500 + (Math.random() * -150)
			}]
		TweenMax.to(blob, time / 2, { delay: time/2, ease: Power1.easeOut, alpha: 0});
		TweenMax.to(blob.position, time, {
			ease: Power1.easeOut, 
			bezier: bezier, 
			onComplete: () => {
				this.embers.removeChild(blob);
				blob = null;
		}})
		
		
	}
	
	get time()
	{
		return 2 + Math.random() * 1.5;
	}
}

class Fire
{
	constructor(color, app, pixelate = false, opts = {})
	{
		opts = opts || {};
		this.radius = opts.radius || 35;
		this.spread = opts.spread || 60;
		this.wobble = opts.wobble || 1;
		this.flame = new PIXI.Container();
		this.cutout = new PIXI.Container();
		this.fire = new PIXI.Container();
		
		this.flame.addChild(this.fire);
		this.flame.addChild(this.cutout);
		
		this.fire.alpha = 0.7;
		
		var circle = new PIXI.Graphics();
		circle.lineStyle(0);
		circle.beginFill(color, 1);
		circle.drawCircle(0, 0, this.radius);
		circle.endFill();
		this.fireBlob = app.renderer.generateTexture(circle);
		
		var cutoutCircle = new PIXI.Graphics();
		cutoutCircle.lineStyle(0);
		cutoutCircle.beginFill(0x000000, 1);
		cutoutCircle.drawCircle(0, 0, this.radius + 5);
		cutoutCircle.endFill();
		this.cutoutBlob = app.renderer.generateTexture(cutoutCircle);

		this.flame.filters = [];
		if (PIXI.filters && PIXI.filters.AdvancedBloomFilter) {
			this.flame.filters.push(new PIXI.filters.AdvancedBloomFilter(0.45, 0.5, 0.5));
		}
		if (pixelate && PIXI.filters && PIXI.filters.PixelateFilter) {
			this.flame.filters.push(new PIXI.filters.PixelateFilter());
		}
		
		setInterval(() => {
			this.addFlame();
		}, 50)
		
	}
	
	makeBlob(texture)
	{
		let blob = new PIXI.Sprite(texture);
		blob.anchor.set(0.5);
		return blob;
	}
	
	addCutout(left)
	{
		let time = this.time * (0.7 + (Math.random() * 0.2));
		let blob = this.makeBlob(this.cutoutBlob);
		this.cutout.addChild(blob);
		let scale = [
			1,
			0.75 + (Math.random() * 1)
		]
		blob.position.x = (130 + (Math.random() * 50)) * (left ? -1 : 1);
		let targetX = (5 + (Math.random() * 60)) * (left ? -1 : 1);
		blob.scale.set(scale[0]);
		TweenMax.to(blob, time, {ease: Power1.easeIn, x: targetX, y: -270, onComplete: () => {
			this.cutout.removeChild(blob);
			blob = null;
		}})
		TweenMax.to(blob.scale, time, {ease: Power1.easeIn, x: scale[1], y: scale[1]})
	}
	
	addFlame()
	{
		let time = this.time;
		let blob = this.makeBlob(this.fireBlob);
		this.fire.addChild(blob);
		var motionScale = this.intensityMotion || 1;
		let scale = [
			1 + Math.random() * (1.4 * this.wobble), 
			0.45 + Math.random() * (0.9 * this.wobble)
		]
		let bezier = [
			{
				x: 0,
				y: 0
			},
			{
				x: Math.random() * (this.spread * 2 * motionScale) - (this.spread * motionScale), 
				y: Math.random() * -20
			},
			{
				x: Math.random() * (this.spread * 2.4 * motionScale) - (this.spread * 1.2 * motionScale), 
				y: Math.random() * -50 + -50
			},
			{	x: Math.random() * (this.spread * motionScale) - ((this.spread * motionScale) / 2), 
			 	y: (-150 + Math.random() * -100) * Math.min(1.35, 1 + ((motionScale - 1) * 0.6))
			}]
		blob.scale.set(scale[0]);
		TweenMax.to(blob, time, {ease: Power1.easeIn, bezier: bezier, ease: Power0.easeOut})
		TweenMax.to(blob.scale, time, {x: scale[1], y: scale[1], onComplete: () => {
			this.fire.removeChild(blob);
			blob = null;
		}})
	}
	
	get time()
	{
		return 1 + Math.random() * .4;
	}
	
	set y(y){ this.flame.position.y = y };
	set x(x){ this.flame.position.x = x };
	set scale(s){ this.flame.scale.set(s)};
}

class Stage
{
	constructor(canvas, pixelate = false, backgroundEnabled = false)
	{
		this.canvas = canvas;
		this.flames = [];
		this.app = new PIXI.Application(this.canvas.clientWidth || 320, this.canvas.clientHeight || 224, {
			antialias: true,
			transparent: true,
			backgroundAlpha: 0
		});
		canvas.appendChild(this.app.view);
		this.app.view.style.width = '100%';
		this.app.view.style.height = '100%';
		this.app.view.style.display = 'block';
		
		this.stage = new PIXI.Container();
		this.flamesContainer = new PIXI.Container();
		
		if(backgroundEnabled)
		{
			var bgSprite = PIXI.Sprite.fromImage('https://assets.ste.vg/codepen/fire-background.png')
			var light = PIXI.Sprite.fromImage('https://assets.ste.vg/codepen/light.png');

			this.add(bgSprite);
			this.add(light, this.flamesContainer);

			bgSprite.anchor.set(0.5);
			bgSprite.scale.set(0.8);
			bgSprite.position.y = -150;

			light.anchor.set(0.5);
			light.scale.set(1);
			light.position.y = 20;
			
			setInterval(() => {
				light.alpha = 0.3 + Math.random() * 0.2;
			}, 50)
		}
		
		this.add(this.stage, this.app.stage);
		this.add(this.flamesContainer);
		
		this.flamesContainer.scale.set(0.75);
		
		
		let flames = [
			{color: 0xA91F00, scale: 1.18, offset: -34, x: -30, radius: 50, spread: 92, wobble: 1.12},
			{color: 0xA91F00, scale: 1.18, offset: -34, x: 30, radius: 50, spread: 92, wobble: 1.12},
			{color: 0xE23B00, scale: 1.08, offset: -22, x: -18, radius: 42, spread: 82, wobble: 1.05},
			{color: 0xE23B00, scale: 1.08, offset: -22, x: 18, radius: 42, spread: 82, wobble: 1.05},
			{color: 0xFE8200, scale: 0.98, offset: -8, x: -8, radius: 34, spread: 66, wobble: 0.96},
			{color: 0xFE8200, scale: 0.98, offset: -8, x: 8, radius: 34, spread: 66, wobble: 0.96},
			{color: 0xFBE416, scale: 0.92, offset: 8, x: 0, radius: 30, spread: 50, wobble: 0.9, coreBoost: 1.95},
			{color: 0xFFF27A, scale: 0.84, offset: 15, x: 0, radius: 24, spread: 40, wobble: 0.86, coreBoost: 2.25},
			{color: 0xFDFDB4, scale: 0.76, offset: 24, x: 0, radius: 22, spread: 34, wobble: 0.82, coreBoost: 2.55}
		]
		
		let ember = new Ember([0xFE9C00, 0xFEA600, 0xE27100], this.app, pixelate);
		this.add(ember.embers, this.flamesContainer);
		
		flames.map((settings) => {
			
			let fire = new Fire(settings.color, this.app, pixelate, settings);
			this.flames.push(fire);
			fire.baseOffset = settings.offset;
			fire.coreBoost = settings.coreBoost || 1;
			fire.y = settings.offset;
			fire.x = settings.x || 0;
			fire.scale = settings.scale;
			fire.flame.pivot.set(0, 10);
			
			this.add(fire.flame, this.flamesContainer);
		})
		
		
		
		this.onResize();
		let f = this.flames.map(fire => fire.flame.scale);
		f.pop();
		this.stokeAnimation = new TimelineMax();
		this.stokeAnimation.to(f, 0.3, {ease: Power2.easeOut, x: 1.15, y: 1.2})
		this.stokeAnimation.to(f, 1.4, {ease: Bounce.easeOut, x: 1, y: 1})
		this.stokeAnimation.stop();
		
		window.addEventListener('resize', e => { this.onResize() });
		this.ember = ember;
		this.baseScale = 0.75;
		this.widthScale = this.baseScale * 0.59;
		this.intensityMotion = 1;
		this.setIntensity(0);
	}

	setIntensity(count)
	{
		this.intensityCount = Math.max(0, count || 0);
		var baseCap = 8;
		var overdriveCap = 40;
		var capped = Math.min(this.intensityCount, baseCap);
		var normalized = capped / baseCap;
		var overdrive = Math.max(0, this.intensityCount - baseCap);
		var overdriveNorm = Math.min(overdrive / (overdriveCap - baseCap), 1);
		var visible = this.intensityCount > 0;
		var heightProgress = 0.32 + (normalized * 0.68) + (overdriveNorm * 0.35);
		this.intensityMotion = 1 + (overdriveNorm * 0.9);

		this.flamesContainer.visible = visible;
		this.flamesContainer.alpha = visible ? Math.min(1, 0.28 + (normalized * 0.58) + (overdriveNorm * 0.28)) : 0;
		this.flamesContainer.scale.set(this.widthScale);

		for (var i = 0; i < this.flames.length; i++) {
			this.flames[i].y = this.flames[i].baseOffset * heightProgress;
			var layerWeight = 1 - (i / (this.flames.length * 1.35));
			var alpha = visible ? ((0.08 + (normalized * 0.62) + (overdriveNorm * 0.28)) * layerWeight * this.flames[i].coreBoost) : 0;
			this.flames[i].fire.alpha = Math.min(alpha, 1);
			this.flames[i].flame.alpha = visible ? Math.min(1, 0.88 + (overdriveNorm * 0.18)) : 0;
		}
	}

	ignite(count)
	{
		if (typeof count === 'number') {
			this.setIntensity(count);
		}
		this.ember.stoke(Math.max(0.5, Math.min((this.intensityCount || 1) / 2.6, 6)));
		this.stokeAnimation.restart();
	}
	
	
	
	onResize()
	{
		var width = this.canvas.clientWidth || 320;
		var height = this.canvas.clientHeight || 224;
		this.app.renderer.resize(width, height);
		this.stage.position.x = width / 2;
		this.stage.position.y = height * 0.9;
	}
	
	add(element, container = this.stage)
	{
		container.addChild(element);
	}
	
	remove(element, container = this.stage)
	{
		container.removeChild(element);
	}
}


if (document.getElementById('fyre') && typeof PIXI !== 'undefined' && typeof TweenMax !== 'undefined') {
	fyreStage = new Stage(document.getElementById('fyre'), pixelate, fireBackground);
	window.firetableIgniteFyre = function (count) {
		fyreStage.ignite(count);
	};
	window.firetableSetFyreIntensity = function (count) {
		fyreStage.setIntensity(count);
	};
	if (typeof firetable !== 'undefined') {
		firetable.fyreStage = fyreStage;
	}
}