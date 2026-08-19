import os
import io
from PIL import Image, ImageOps
from django.core.files.base import ContentFile

def compress_image_under_50kb(input_file):
    """
    Compresses an uploaded image to less than 50 KB while maintaining visual quality.
    Converts to WebP or JPEG format, generates a thumbnail, and returns (compressed_content_file, thumbnail_content_file).
    """
    filename = input_file.name
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']:
        # Non-image file (PDF, Word, Excel, ZIP, etc.), return as is
        return ContentFile(input_file.read(), name=filename), None, input_file.size

    img = Image.open(input_file)
    img = ImageOps.exif_transpose(img)
    
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if 'A' in img.getbands() else None)
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    # Target file size: 50 KB = 51,200 bytes
    max_bytes = 50 * 1024
    
    # 1. Generate Thumbnail (120x120)
    thumb_img = img.copy()
    thumb_img.thumbnail((120, 120))
    thumb_io = io.BytesIO()
    thumb_img.save(thumb_io, format='WEBP', quality=75)
    thumb_file = ContentFile(thumb_io.getvalue(), name=f"thumb_{os.path.splitext(filename)[0]}.webp")

    # 2. Compress Main Image under 50KB
    quality = 85
    width, height = img.size
    
    while True:
        output_io = io.BytesIO()
        img.save(output_io, format='WEBP', quality=quality, optimize=True)
        size = output_io.tell()
        
        if size <= max_bytes or (quality <= 20 and (width <= 600 or height <= 600)):
            break
            
        if quality > 30:
            quality -= 10
        else:
            # Resize dimensions if quality alone can't achieve < 50KB
            width = int(width * 0.85)
            height = int(height * 0.85)
            img = img.resize((width, height), Image.Resampling.LANCZOS)
            quality = 70

    compressed_file = ContentFile(output_io.getvalue(), name=f"{os.path.splitext(filename)[0]}.webp")
    return compressed_file, thumb_file, output_io.tell()
