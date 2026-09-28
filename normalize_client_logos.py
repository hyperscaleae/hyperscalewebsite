from pathlib import Path
from PIL import Image

SOURCE = Path('/home/ubuntu/webdev-static-assets/hyperscale-client-logos')
OUTPUT = SOURCE / 'normalized'
OUTPUT.mkdir(exist_ok=True)

files = {
    'alora': 'alora.png',
    'habboba': 'habboba.jpg',
    'bashayerna': 'bashayerna.webp',
    'high-class': 'high-class.jpg',
    'zyva': 'zyva.webp',
    'meat-palace': 'meat-palace.jpg',
    'gourmet': 'gourmet.png',
    'sophia': 'sophia.png',
    'al-khalil': 'al-khalil.webp',
}

for slug, filename in files.items():
    image = Image.open(SOURCE / filename).convert('RGBA')
    pixels = image.load()
    width, height = image.size

    # Remove JPEG-style white canvas only when the image corners confirm a white background.
    corners = [pixels[0, 0], pixels[width - 1, 0], pixels[0, height - 1], pixels[width - 1, height - 1]]
    white_corners = sum(1 for r, g, b, a in corners if r > 235 and g > 235 and b > 235)
    if white_corners >= 3:
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                if r > 238 and g > 238 and b > 238:
                    pixels[x, y] = (r, g, b, 0)

    bbox = image.getchannel('A').getbbox()
    if bbox is None:
        bbox = (0, 0, width, height)

    left, top, right, bottom = bbox
    pad_x = max(8, int((right - left) * 0.10))
    pad_y = max(8, int((bottom - top) * 0.10))
    left = max(0, left - pad_x)
    top = max(0, top - pad_y)
    right = min(width, right + pad_x)
    bottom = min(height, bottom + pad_y)
    cropped = image.crop((left, top, right, bottom))

    # Every exported asset has identical dimensions and a transparent canvas; CSS controls the visible tile.
    canvas = Image.new('RGBA', (640, 360), (0, 0, 0, 0))
    max_w, max_h = 500, 250
    scale = min(max_w / cropped.width, max_h / cropped.height)
    resized = cropped.resize((max(1, int(cropped.width * scale)), max(1, int(cropped.height * scale))), Image.Resampling.LANCZOS)
    x = (canvas.width - resized.width) // 2
    y = (canvas.height - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))
    canvas.save(OUTPUT / f'{slug}.png', optimize=True)
