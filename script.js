const canvas = document.getElementById("animationCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Configuration
const CONFIG = {
  NUM_OBJECTS: 50, // Total number of objects
  SIZE_RANGE: { min: .4, max: 2 }, // Size multiplier range
  OBJECT_SIZE: { min: 100, max: 100 }, // Pixel size range for objects
  VELOCITY_MULTIPLIER_X: { min: 2, max: 4 }, // Multiplier for X velocity
  VELOCITY_MULTIPLIER_Y: { min: 0, max: 1 }, // Multiplier for Y velocity
  DEPTH_BLUR_STRENGTH: 1, // Blur strength for depth-of-field effect
  BACKGROUND_COLOR: "transparent", // Background color for the canvas
  IMAGE_PATHS: ["bluniewiadomo.png", "yellowpapierz.png", "greenmatematyku.png", "greyzelazko.png", "redjakub.png", "jedynkunakartkowku.png", "darkgreenkaczek.png", "darkpinkniewiadomo.png", "sraczkowywegiel.png", "whitebraun.png"], // Paths to the images
  RANDOM_HUE_SHIFT: false, // Enable or disable random hue shifts for objects
  DROP_SHADOW: false, // Enable or disable drop shadows
  WRAP_AROUND_MODE: {
    ENABLED: true, // Enable or disable wrap-around behavior
    DIRECTION: "left", // "left", "right", or "both" for movement direction
  },
};

// Load images
const images = CONFIG.IMAGE_PATHS.map((path) => {
  const img = new Image();
  img.src = path;
  return img;
});

// Random number generator
const random = (min, max) => Math.random() * (max - min) + min;

// Object class
class MovingObject {
  constructor(img) {
    this.img = img;
    this.size = random(CONFIG.SIZE_RANGE.min, CONFIG.SIZE_RANGE.max);
    this.width = random(CONFIG.OBJECT_SIZE.min, CONFIG.OBJECT_SIZE.max) * this.size;
    this.height = this.width; // Maintain aspect ratio
    this.x = random(0, canvas.width - this.width);
    this.y = random(0, canvas.height - this.height);

    // Velocity
    this.dx = random(CONFIG.VELOCITY_MULTIPLIER_X.min, CONFIG.VELOCITY_MULTIPLIER_X.max) * (Math.random() > 0.5 ? 1 : -1);
    this.dy = random(CONFIG.VELOCITY_MULTIPLIER_Y.min, CONFIG.VELOCITY_MULTIPLIER_Y.max) * (Math.random() > 0.5 ? 1 : -1);

    // Visual properties
    this.hueShift = CONFIG.RANDOM_HUE_SHIFT ? random(0, 360) : 0;
    this.flip = false; // Track if the object is flipped
  }

  draw() {
    ctx.save();

    // Apply depth blur for smaller objects
    const avgSize = (CONFIG.OBJECT_SIZE.min + CONFIG.OBJECT_SIZE.max) / 2;
    const blurAmount = this.width < avgSize ? CONFIG.DEPTH_BLUR_STRENGTH / (avgSize / this.width) : 0;
    ctx.filter = `blur(${blurAmount}px)`;

    // Apply hue shift
    if (CONFIG.RANDOM_HUE_SHIFT) {
      ctx.globalCompositeOperation = "hue";
      ctx.fillStyle = `hsl(${this.hueShift}, 100%, 50%)`;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Apply drop shadow
    if (CONFIG.DROP_SHADOW) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = this.size * 5;
      ctx.shadowOffsetX = this.size;
      ctx.shadowOffsetY = this.size;
    }

    // Draw the image
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

    ctx.restore();
  }

  update(objects) {
    this.x += this.dx;
    this.y += this.dy;

    if (CONFIG.WRAP_AROUND_MODE.ENABLED) {
      this.wrapAround();
    } else {
      this.bounceOffWalls();
    }
  }

  wrapAround() {
    const direction = CONFIG.WRAP_AROUND_MODE.DIRECTION;

    // Horizontal wrap-around
    if (direction === "left" && this.dx > 0) this.dx *= -1; // Force leftward movement
    if (direction === "right" && this.dx < 0) this.dx *= -1; // Force rightward movement

    if (this.x > canvas.width) {
      this.x = -this.width;
    } else if (this.x + this.width < 0) {
      this.x = canvas.width;
    }

    // Vertical boundaries (objects bounce off the top and bottom)
    if (this.y <= 0 || this.y + this.height >= canvas.height) {
      this.dy *= -1;
    }
  }

  bounceOffWalls() {
    if (this.x <= 0 || this.x + this.width >= canvas.width) {
      this.dx *= -1;
      this.flip = this.dx > 0; // Flip horizontally when moving right
    }
    if (this.y <= 0 || this.y + this.height >= canvas.height) {
      this.dy *= -1;
    }
  }
}

// Initialize objects
const objects = [];
Promise.all(images.map((img) => new Promise((resolve) => (img.onload = resolve)))).then(() => {
  const numPerImage = CONFIG.NUM_OBJECTS / images.length;

  images.forEach((img) => {
    for (let i = 0; i < numPerImage; i++) {
      objects.push(new MovingObject(img));
    }
  });

  // Sort objects by size for z-index
  objects.sort((a, b) => a.width - b.width);

  // Start animation 
  animate();
});

// Animation loop
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = CONFIG.BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw objects by size (smaller in the back, larger in the front)
  objects.forEach((obj) => {
    obj.update(objects);
    obj.draw();
  });

  document.getElementById("apply-config").addEventListener("click", () => {
  CONFIG.NUM_OBJECTS = parseInt(document.getElementById("num-objects").value, 10);
  CONFIG.SIZE_RANGE.min = parseFloat(document.getElementById("size-min").value);
  CONFIG.SIZE_RANGE.max = parseFloat(document.getElementById("size-max").value);
  CONFIG.VELOCITY_MULTIPLIER_X.min = parseFloat(document.getElementById("speed-x-min").value);
  CONFIG.VELOCITY_MULTIPLIER_X.max = parseFloat(document.getElementById("speed-x-max").value);
  CONFIG.VELOCITY_MULTIPLIER_Y.min = parseFloat(document.getElementById("speed-y-min").value);
  CONFIG.DEPTH_BLUR_STRENGTH = parseInt(document.getElementById("blur-strength").value, 10);
  CONFIG.RANDOM_HUE_SHIFT = document.getElementById("hue-shift").checked;
  CONFIG.DROP_SHADOW = document.getElementById("drop-shadow").checked;
  CONFIG.WRAP_AROUND_MODE.ENABLED = document.getElementById("wrap-around-enabled").checked;
  CONFIG.WRAP_AROUND_MODE.DIRECTION = document.getElementById("wrap-direction").value;

  // Reset and reinitialize objects based on updated config
  objects.length = 0;
  const numPerImage = CONFIG.NUM_OBJECTS / images.length;

  images.forEach((img) => {
    for (let i = 0; i < numPerImage; i++) {
      objects.push(new MovingObject(img));
    }
  });

});

  requestAnimationFrame(animate);
}
