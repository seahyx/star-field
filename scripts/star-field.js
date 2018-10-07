/*
Javascript running pixi.min.js to display an interactive side-scrolling list of items that freely floats around.
*/
//Initiation ritual
let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}
PIXI.utils.sayHello(type)


//Create a Pixi Application
let app = new PIXI.Application({
	width: 1920,
	height: 1080,
	backgroundColor: 0x000000,
	antialias: true,
	transparent: false,
	resolution: 1
});

//Add the canvas that Pixi automatically created for you to the HTML document
document.getElementById("canvas").appendChild(app.view);

//Make the canvas fill the browser window proportionately
scaleToWindow(app.view);
//...and whenever the window is resized
window.addEventListener("resize", function(event){ 
	scaleToWindow(app.view);
});

//Get the scaling factor
let scale = scaleToWindow(app.view);



/* It all starts here */

//Global variables
var num_stars = 1000;
var min_size = 1;
var max_size = 5;
var min_speed = -1;
var max_speed = 1;
var min_lifetime = 100;
var max_lifetime = 300;
var fade_factor = 0.2;
var min_shimmer_opacity = 1;
var shimmer_rate = 4;
var stars;


/* Star object */

function StarObj(x, y, size, speed, lifetime) {
	this.x = x;
	this.y = y;
	this.size = size;
	this.speed = speed;
	this.lifetime = lifetime;	//original lifetime
	this.life = lifetime;	//current lifetime
	this.opacity = 0;	//opacity value from 0 to 1
	this.max_opacity = 0;
	//when lifetime is over, regenerate self into a new star
	this.regenerate = function() {
		this.x = generateXPosition(0, app.renderer.width);
		this.y = generateYPosition(0, app.renderer.height);
		this.size = generateSize(min_size, max_size);
		this.speed = generateSpeed(min_speed, max_speed);
		this.lifetime = generateLifetime(min_lifetime, max_lifetime);
		this.life = this.lifetime;
		this.generateOpacity();
	}
	//self-cycle checking
	this.cycle = function(dt) {

		//Life always tick down
		this.life -= dt;

		if (this.life <= 0) {
			//When star dies
			this.opacity = 0;
			this.regenerate();
		} else if (this.life <= this.lifetime * fade_factor) {
			//When the star is about to die
			this.fadeOut();
			this.move(dt);
		} else if (this.lifetime - this.life <= this.lifetime * fade_factor) {
			//When the star is just created
			this.fadeIn();
			this.move(dt);
		} else {
			//When star is alive
			this.aliveOpacity();
			this.move(dt);
		}

		this.opacityModifier();

		if (this.x > app.renderer.width + this.size
			|| this.x < 0 - this.size
			|| this.y > app.renderer.height + this.size
			|| this.y < 0 - this.size) {
			//If went out of bounds
			this.regenerate();
		}

		//Update canvas object
		this.canvasObj.alpha = this.opacity;
		this.canvasObj.x = this.x;
		this.canvasObj.y = this.y;
	}
	this.fadeOut = function() {
		//Fades star out when it is about to die
		let fadeAmount = this.life / (this.lifetime * fade_factor);
		if (fadeAmount < 1 && fadeAmount > 0) {
			this.opacity = fadeAmount * this.max_opacity;
		} else {
			console.log("StarObj object fadeOut() error: fadeAmount is not between 0 and 1.");
		}
	}
	this.fadeIn = function() {
		//Fades in star
		let fadeAmount = (this.lifetime - this.life) / (this.lifetime * fade_factor);
		if (fadeAmount < 1 && fadeAmount > 0) {
			this.opacity = fadeAmount * this.max_opacity;
		} else {
			console.log("StarObj object fadeIn() error: fadeAmount is not between 0 and 1.");
		}
	}
	this.aliveOpacity = function() {
		this.opacity = this.max_opacity;
	}
	this.opacityModifier = function() {
		this.opacity = this.opacity *
		(min_shimmer_opacity + ((1 - min_shimmer_opacity) * Math.cos(this.life / (Math.PI * 2 * shimmer_rate))));
	}
	this.move = function(dt) {
		this.x += this.speed * dt;
	}
	this.canvasObj = new PIXI.Graphics();
	this.canvasObjInit = function() {
		this.canvasObj = new PIXI.Graphics();
		this.canvasObj.lineStyle(0);
		this.canvasObj.beginFill(0xFFFFFF, 1);
		this.canvasObj.drawCircle(0, 0, this.size);
		this.canvasObj.endFill();
		this.canvasObj.pivot.set(this.size / 2, this.size / 2);
	}
	this.generateOpacity = function() {
		if (min_speed < 0) {
			this.max_opacity = (this.speed - min_speed) / (max_speed - min_speed);
		} else {
			this.max_opacity = this.speed / max_speed;
		}
	}
}


/* Functions */

//Star field initializer
function starFieldInit(num_stars, container) {
	let stars = [];
	for(x = 0; x < num_stars; x++) {
		//Add star objects to stars array
		stars.push(new StarObj(
			generateXPosition(0, app.renderer.width),	//x position
			generateYPosition(0, app.renderer.height),	//y position
			generateSize(min_size, max_size),	//size
			generateSpeed(min_speed, max_speed),	//speed
			generateLifetime(min_lifetime, max_lifetime)	//lifetime
			));
		stars[x].canvasObjInit();
		stars[x].generateOpacity();
		container.addChild(stars[x].canvasObj);
	}
	return stars;
}

function generateXPosition(min_x, max_x) {
	return randomInt(min_x, max_x);
}

function generateYPosition(min_y, max_y) {
	return randomInt(min_y, max_y);
}

function generateSize(min_size, max_size) {
	return randomInt(min_size, max_size);
}

function generateSpeed(min_speed, max_speed) {
	return randomFloat(min_speed, max_speed);
}

function generateLifetime(min_lifetime, max_lifetime) {
	return randomFloat(min_lifetime, max_lifetime);
}

function randomFloat(min, max) {
	if (min > max) {
		console.log("randomFloat error: lower random limit larger than higher random limit.");
		return 0;
	}
	return (Math.random() * (max - (min - 1))) + min;
}

function randomInt(min, max) {
	if (min > max) {
		console.log("randomInt error: lower random limit larger than higher random limit.");
		return 0;
	}
	return Math.floor(randomFloat(min, max));
}



/* Update function */


var container_main = new PIXI.Container();
app.stage.addChild(container_main);

stars = starFieldInit(num_stars, container_main);

//Define deltaTime ticker -- update function
let update = app.ticker.add(function(deltaTime) {
	//Update stars
	stars.forEach(function(star) {
		star.cycle(deltaTime);
	});
});