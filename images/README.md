Image conversion instructions

Preferred workflow to create optimized WebP/AVIF versions of hero-banner.png:

1) Using cwebp (Google):
   cwebp -q 80 images/hero-banner.png -o images/hero-banner.webp

2) Using ImageMagick (if installed):
   magick images/hero-banner.png -quality 80 images/hero-banner.webp

3) Using npm imagemin (Node required):
   npm install --global imagemin-cli imagemin-webp
   imagemin images/* --plugin=webp --out-dir=images

After conversion:
- Verify images/hero-banner.webp exists.
- Run the site locally and check visual quality.
- Optionally remove large PNG or keep it as fallback for old browsers.
