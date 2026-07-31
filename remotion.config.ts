import { Config } from '@remotion/cli/config';

/**
 * Render defaults for the marketing films. Only affects `remotion render` /
 * `remotion studio` — the Vite app build is untouched.
 */
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// The scenes lean on large blur radii for the ambient glows; 2x scale keeps
// those gradients from banding on a landing-page-sized player.
Config.setConcurrency(4);

// H.264 in an MP4 is what every browser and social platform accepts.
Config.setCodec('h264');
Config.setCrf(18);
