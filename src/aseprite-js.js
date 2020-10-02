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
 * @property {boolean} imageLoaded - Whether the image has been loaded.
 * @property {boolean} jsonLoaded - Whether the json metadata has been loaded.
 * @property {boolean} loaded - Whether the image and json have been loaded.
 * @property {?HTMLImageElement} image - The image, once it has been loaded.
 * @property {?FrameMetadata} frames - Metadata for each frame.
 * @property {?AnimationMetadata} animations - Metadata for each labeled
 *     animation.
 */

/**
 * @type {Object<string, !ImageMetadata>} Map of all the images and their
 * metadata.
 *
 * Treat this as read-only, but if you need to access information like the
 * lengths of animations you can use this.
 */
export const images = {};

/**
 * Preloads multiple images.
 *
 * @param {Array<{!Object}>} imageInfos - Array of
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
 * You can either use `basePath` to specify the directory that contains both the
 * image and its metadata, or you can specify the full path to each using
 * `imagePath` and `jsonPath`. If you specify just the directory, the files need
 * to be called [name].png and [name].json.
 *
 * @param {!Object} imageInfo - Information for loading a spritesheet and its
 *     metadata.
 * @property {string} imageInfo.name - Name of the image file and its metadata.
 *     The image should be name.png and the metadata should be name.json.
 * @property {string} imageInfo.basePath - Location of the image file and its
 *     metadata. Both files should be in the same place.
 * @property {string} imageInfo.imagePath - Name of the image file and its metadata.
 *     The image should be name.png and the metadata should be name.json.
 * @property {string} imageInfo.jsonPath - Location of the image file and its
 *     metadata. Both files should be in the same place.
 */
export function loadImage({name, basePath=null, imagePath=null, jsonPath=null}) {
    if (!basePath && (!imagePath || !jsonPath)) {
        throw 'Must specify either a basePath or imagePath and jsonPath';
    }

    if (images.hasOwnProperty(name)) {
        console.log(`Already loaded image ${name}.`);
    }

    if (!imagePath || !jsonPath) {
        if (!basePath.endsWith('/')) {
            basePath = basePath + '/';
        }
        imagePath = `${basePath}${name}.png`;
        jsonPath = `${basePath}${name}.json`;
    }

    images[name] = {
        imageLoaded: false,
        jsonLoaded: false,
        loaded: false,
        image: null,
        animations: {},
    };
    const image = new Image();
    image.onload = () => {
        images[name].image = image;
        images[name].imageLoaded = true;
        images[name].loaded = images[name].jsonLoaded;
    }
    image.onerror = () => {
        throw new Error(`Error loading image ${name}.`);
    }
    image.src = imagePath;
    // Load JSON metadata.
    fetch(jsonPath)
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
            images[name].jsonLoaded = true;
            images[name].loaded = images[name].imageLoaded;
        });
}

/**
 * Renders a specific frame to a canvas.
 *
 * @param {!Object} p - Input to this function, as an object.
 * @param {!CanvasRenderingContext2D} p.context - The context of the canvas to
 *     draw on.
 * @param {string|ImageMetadata} p.image - The name, or image metadata of
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
export function drawSprite({
    context,
    image,
    frame,
    dest,
    scale = 1,
    anchorRatios = {
        x: 0,
        y: 0
    }
}) {
    if (typeof image === "string") {
        image = images[image];
    }

    if (!image.loaded) {
        return;
    }

    const sourceRect = image.frames[frame].frame;
    context.drawImage(
        image.image,
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
 * @param {string|ImageMetadata} p.image - The name, or image metadata of
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
export function drawAnimation({
    context,
    image,
    animationName,
    time,
    dest,
    scale = 1,
    anchorRatios = {
        x: 0,
        y: 0
    }
}) {
    if (typeof image === "string") {
        image = images[image];
    }

    if (!image.loaded) {
        return;
    }

    const frame = getFrame(image, animationName, time);

    drawSprite({
        context,
        image,
        frame,
        dest,
        scale,
        anchorRatios
    });
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