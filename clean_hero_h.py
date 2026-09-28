from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

source = Path('/home/ubuntu/webdev-static-assets/hyperscale-hero-h-transparent.png')
target = Path('/home/ubuntu/webdev-static-assets/hyperscale-hero-h-transparent-clean.png')
image = Image.open(source).convert('RGBA')
rgb = np.asarray(image.convert('RGB')).astype(np.int16)

# The generated file contains a light checkerboard baked into the pixels. Keep only
# the colored/dark H and its glow, then feather the resulting alpha mask.
spread = rgb.max(axis=2) - rgb.min(axis=2)
luminance = rgb.mean(axis=2)
foreground = ((spread > 18) | (luminance < 178)).astype(np.uint8) * 255
mask = Image.fromarray(foreground, mode='L')
mask = mask.filter(ImageFilter.GaussianBlur(10))

rgba = image.copy()
rgba.putalpha(mask)
rgba.save(target, optimize=True)
