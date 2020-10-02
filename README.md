# aseprite-js
A helper library for rendering sprites made in Aseprite to an HTML Canvas.

The code is fairly well documented, so check out the source file for comments for how to use it.

# Getting set up
You can grab a standalone, minified version of the library from the [releases](https://github.com/Jezzamonn/aseprite-js/releases/) tab.

Or you can clone this repo and install via `npm`:

```sh
# in the directory of the cloned repo
npm link

# in the directory of the place you want to use it
npm link aseprite-js
```

Then, in your JS file, import as such
```js
import Aseprite from 'aseprite-js';
```

# Basic Usage
```js
// Load the animation file.
Aseprite.loadImage({
  name: 'stick-figure',
  imagePath:
    'https://cdn.glitch.com/960f28b9-fe45-494e-aff5-10cd203b982a%2Fstick-figure.png?v=1601614303717',
  jsonPath:
    'https://cdn.glitch.com/960f28b9-fe45-494e-aff5-10cd203b982a%2Fstick-figure.json?v=1601614335000',
});

// Turn off smoothing so the pixels stay sharp.
Aseprite.disableSmoothing(context);

// Within a game loop, do the following:
Aseprite.drawAnimation({
  context,
  image: 'stick-figure',
  animationName: 'Idle',
  time: elapsedSeconds, // Or you can use `Date.now() / 1000` if you don't want to track elapsed time.
  position: { x: 100, y: 100 },
  scale: 2,
  anchorRatios: { x: 0.5, y: 1 }, // This sets the anchor point to the bottom middle of the sprite.
});

// Or, just render a single frame:
Aseprite.drawSprite({
  context,
  image: 'stick-figure',
  frame: 0, // Frame numbers are 0-based, so this is the first frame.
  time: elapsedSeconds + 0.5,
  position: { x: 20, y: 20 },
  scale: 2,
});
```


# Full Example
Check out https://aseprite-animation.glitch.me/ to see an example of this library in action!
