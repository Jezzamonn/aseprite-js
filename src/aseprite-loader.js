/**
 * @typedef FrameMetadata - What's exporting from Aseprite for a frame
 * @type {object}
 * @property {string} filename - Aseprite filename that this animation came
 *     from.
 * @property {{x: number, y: number, w: number, h: number}} frame - The
 *     bounding box for this frame in the spritesheet.
 * @property {boolean} rotated - ?
 * @property {boolean} rotated - ?
 * @property {{x: number, y: number, w: number, h: number}} spriteSourceSize -
 *     Not sure what this is, but related to the bounding box, I guess.
 * @property {{w: number, h: number}} sourceSize - Also not super sure what
 *     this is, but related to the bounding box, I guess.
 * @property {number} duration - How long this frame should be shown for, in
 *     milliseconds
 */

/**
 * @typedef AnimationMetadata - Data pulled out from the frame tags
 * @type {object}
 * @property {number} from - Starting frame of this animation
 * @property {number} to - Ending frame of this animation
 * @property {number} length - Entire duration of this animation.
 */

/**
 * @typedef ImageMetadata - Metadata for a spritesheet
 * @type {object}
 * @property {boolean} loaded - Whether the image has been loaded or not
 * @property {?HTMLImageElement} image - The image, once it has been loaded
 * @property {?FrameMetadata} frames - Metadata for each frame.
 * @property {?AnimationMetadata} animations - Metadata for each labeled
 *     animation.
 */

/**
 * @type {Object<string, !ImageMetadata>} Map of all the images and their
 * metadata.
 */
const images = {};

/**
 * Preloads multiple images.
 *
 * @param {Array<{name: string, path: string}>} imageInfos - Array of
 *     information for loading a spritesheet and its metadata. See loadImage()
 *     for a longer description.
 */
export function loadImages(imageInfos) {
    for (const imageInfo of imageInfos) {
        loadImage(imageInfo);
    }
}

/**
 * Asynchronously fetches an image and it's associated metadata, and saves it in
 * the images map.
 *
 * @param {{name: string, path: string}} imageInfo - Information for loading a
 *     spritesheet and its metadata.
 * @property {string} imageInfo.name - Name of the image file and its meatadata.
 *     The image should be name.png and the metadata should be name.json.
 * @property {string} imageInfo.path - Location of the image file and its
 *     metadata. Both files should be in the same place.
 */
export function loadImage(imageInfo) {
    let { name, path } = imageInfo;
    if (images.hasOwnProperty(name)) {
        console.log(`Already loaded image ${name}.`);
    }
    if (!path.endsWith('/')) {
        path = path + '/';
    }

    images[name] = {
        loaded: false,
        image: null,
        animations: {},
    };
    const image = new Image();
    image.onload = () => {
        images[name].image = image;
        images[name].loaded = true;
    }
    image.onerror = () => {
        throw new Error(`Error loading image ${name}.`);
    }
    image.src = `assets/${name}.png`;
    // Load JSON metadata.
    fetch(`assets/${name}.json`)
        .then((response) => {
            if (response.status != 200) {
                throw new Error(`Couldn't load json metadata for image ${name}.`);
            }
            return response.json();
        })
        .then((response) => {
            // Note: This currently ignores direction.
            const animations = {};
            for (const animData of response.meta.frameTags) {
                const animation = {
                    from: animData.from,
                    to: animData.to,
                }
                let length = 0;
                for (let i = animData.from; i <= animData.to; i++) {
                    length += response.frames[i].duration;
                }
                animation.length = length;
                animations[animData.name] = animation;
            }
            images[name].animations = animations;
            images[name].frames = response.frames;
        });
}

/**
 * Renders a specific frame to a canvas.
 *
 * @param {!Object} p - Input to this function, as an object.
 * @param {!CanvasRenderingContext2D} p.context - The context of the canvas to
 *     draw on.
 * @param {string|ImageMetadata} p.imageData - The name, or image metadata of
 *     the spritesheet to draw.
 * @param {number} p.frame - The frame number to draw.
 * @param {{x: number, y: number}} p.dest - The position on the canvas to draw
 *     this sprite
 * @param {number} p.scale - How much to upscale the sprite. Should be an
 *     integer.
 * @param {{x: number, y: number}} p.anchorRatios - The relative position of the
 *     anchor on this sprite. The anchor is used for positioning the sprite and
 *     for scaling. 0 puts the anchor at the left or the top, 1 puts the anchor
 *     at the right or the bottom. 0.5 positions the anchor at the center.
 *     Defaults to top left.
 */
export function drawSprite({context, imageData, frame, dest, scale = 1, anchorRatios = {x: 0, y: 0}}) {
    if (typeof imageData === "string") {
        imageData = images[imageData];
    }

    if (!imageData.loaded) {
        return;
    }

    const sourceRect = imageData.frames[frame].frame;
    context.drawImage(
        imageData.image,
        sourceRect.x,
        sourceRect.y,
        sourceRect.w,
        sourceRect.h,
        Math.round(dest.x - anchorRatios.x * scale * sourceRect.w),
        Math.round(dest.y - anchorRatios.y * scale * sourceRect.h),
        scale * sourceRect.w,
        scale * sourceRect.h);
}

/**
 * Renders a frame of an animation to the canvas, based on the input time.
 *
 * Assumes all animations loop.
 *
 * @param {!Object} p - Input to this function, as an object.
 * @param {!CanvasRenderingContext2D} p.context - The context of the canvas to
 *     draw on.
 * @param {string|ImageMetadata} p.imageData - The name, or image metadata of
 *     the spritesheet to draw.
 * @param {number} p.animationName - The name of the animation.
 * @param {number} p.time - The position of this animation in time, relative to
 *     the start. In seconds. Determines which frame to render.
 * @param {{x: number, y: number}} p.dest - The position on the canvas to draw
 *     this sprite
 * @param {number} p.scale - How much to upscale the sprite. Should be an
 *     integer.
 * @param {{x: number, y: number}} p.anchorRatios - The relative position of the
 *     anchor on this sprite. The anchor is used for positioning the sprite and
 *     for scaling. 0 puts the anchor at the left or the top, 1 puts the anchor
 *     at the right or the bottom. 0.5 positions the anchor at the center.
 *     Defaults to top left.
 */
export function drawAnimation({context, imageData, animationName, time, dest, scale = 1, anchorRatios = {x: 0, y: 0}}) {
    if (typeof imageData === "string") {
        imageData = images[imageData];
    }

    if (!imageData.loaded) {
        return;
    }

    const frame = getFrame(imageData, animationName, time);

    drawSprite({context, imageData, frame, dest, scale, anchorRatios});
}

/**
 * Figures out which frame of the animation we should draw.
 *
 * @param {ImageMetadata} imageData
 * @param {string} animationName
 * @param {number} time
 */
function getFrame(imageData, animationName, time) {
    const animData = imageData.animations[animationName];
    const localTimeMs = (1000 * time) % animData.length;
    let cumulativeTimeMs = 0;
    for (let i = animData.from; i <= animData.to; i++) {
        cumulativeTimeMs += imageData.frames[i].duration;
        if (cumulativeTimeMs > localTimeMs) {
            return i;
        }
    }
    throw new Error(`Something's wrong with the getFrame function`);
}

/**
 * Disables smoothing on the canvas across the different browsers.
 *
 * Keeps those pixels sharp!
 *
 * @param {!CanvasRenderingContext2D} context - Context of the canvas to disable
 * smoothing on.
 */
export function disableSmoothing(context) {
    context.msImageSmoothingEnabled = false;
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.imageSmoothingEnabled = false;
}
