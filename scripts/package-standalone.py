import os
import shutil
import zipfile
import re
import base64

def package():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dist_standalone = os.path.join(base_dir, 'dist-standalone')
    dist_html = os.path.join(dist_standalone, 'index.html')
    public_dir = os.path.join(base_dir, 'public')
    release_dir = os.path.join(base_dir, 'release')
    dist_dir = os.path.join(base_dir, 'dist')
    icon_svg_path = os.path.join(public_dir, 'icon.svg')

    if not os.path.exists(dist_html):
        print(f"Error: {dist_html} does not exist. Run vite build with standalone config first.")
        return

    # Read base64 SVG icon
    b64_icon = ""
    if os.path.exists(icon_svg_path):
        with open(icon_svg_path, 'r', encoding='utf-8') as f:
            svg_content = f.read()
        b64_icon = base64.b64encode(svg_content.encode('utf-8')).decode('ascii')

    with open(dist_html, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # 1. Inject Embedded Bonyan Favicon & Apple Touch Icon into <head> only
    if b64_icon:
        favicon_tags = (
            f'<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,{b64_icon}" />\n'
            f'    <link rel="apple-touch-icon" href="data:image/svg+xml;base64,{b64_icon}" />'
        )
        head_end = html_content.find('</head>')
        if head_end != -1:
            head_part = html_content[:head_end]
            rest_part = html_content[head_end:]
            # Remove existing icon links strictly in head
            head_part = re.sub(r'<link[^>]*rel=["\'](?:icon|shortcut icon|apple-touch-icon)["\'][^>]*>\s*', '', head_part)
            # Inject into head strictly at the HTML tag
            head_part = re.sub(r'<head\b[^>]*>', lambda m: f'{m.group(0)}\n    {favicon_tags}\n', head_part, count=1)
            html_content = head_part + rest_part

    # 2. Clean external manifest to avoid CORS errors on file:///
    html_content = re.sub(r'<link[^>]*rel=["\']manifest["\'][^>]*>\s*', '', html_content)

    # 3. Clean serviceWorker block for standalone file:/// mode
    html_content = re.sub(r'<script>\s*if\s*\([\'"]serviceWorker[\'"]\s*in\s*navigator[\s\S]*?</script>\s*', '', html_content)

    # 4. Extract bundle script from <head> and move it to end of <body> (after #root) with type="module"
    # Matches the large bundle script tag
    pattern = r'<script(?:\s+[^>]*)?>([\s\S]*?(?:mountApp|function\s+s7|__esModule)[\s\S]*?)</script>'
    m = re.search(pattern, html_content)
    if m:
        bundle_code = m.group(1)
        # Remove from current position
        html_content = html_content[:m.start()] + html_content[m.end():]
        # Place at bottom before </body> with type="module" so ES modules (import/export) work properly in all browsers
        module_script = f'<script type="module">\n{bundle_code}\n</script>'
        html_content = html_content.replace('</body>', f'{module_script}\n</body>')
        print("Successfully relocated bundle script to end of <body> with type='module'.")
    else:
        print("Bundle script already in place.")

    # Write patched index.html
    with open(dist_html, 'w', encoding='utf-8') as f:
        f.write(html_content)

    os.makedirs(public_dir, exist_ok=True)
    os.makedirs(release_dir, exist_ok=True)
    os.makedirs(dist_dir, exist_ok=True)

    # Copy files
    shutil.copyfile(dist_html, os.path.join(public_dir, 'AlBunyan-Standalone.html'))
    shutil.copyfile(dist_html, os.path.join(release_dir, 'index.html'))
    shutil.copyfile(dist_html, os.path.join(dist_dir, 'AlBunyan.html'))

    # Build standalone ZIP package
    zip_public = os.path.join(public_dir, 'AlBunyan-Standalone-Offline.zip')
    zip_release = os.path.join(release_dir, 'AlBunyan-Standalone-Offline.zip')

    for target_zip in [zip_public, zip_release]:
        with zipfile.ZipFile(target_zip, 'w', compression=zipfile.ZIP_DEFLATED) as z:
            z.write(dist_html, arcname='AlBunyan-Offline.html')
        print(f"Created package: {target_zip} (size: {os.path.getsize(target_zip)} bytes)")

    print("Standalone packaging completed successfully with embedded logo and DOM-safe script positioning!")

if __name__ == '__main__':
    package()
