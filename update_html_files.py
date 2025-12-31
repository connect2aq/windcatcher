import os
import re

# Navigation configuration
page_order = [
    ('index.html', 'Home', None),
    ('overview.html', 'Overview', 'overview'),
    ('section-01.html', 'Inlet & Bell Mouth', 'section-01'),
    ('section-02.html', 'Ratios & Discharge', 'section-02'),
    ('section-03.html', 'Nose Cone & Torus', 'section-03'),
    ('section-04.html', 'Vanes & Spirals', 'section-04'),
    ('section-05.html', 'Micro-Vortex Gen', 'section-05'),
    ('section-06.html', 'Diffuser & Summary', 'section-06'),
    ('appendix.html', 'Appendix', 'appendix')
]

site_dir = r'd:\aq\WindCatcher\site'

def update_html_file(filename, title, page_id, prev_page, next_page):
    filepath = os.path.join(site_dir, filename)

    if not os.path.exists(filepath):
        print(f"Skipping {filename} - file not found")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace header with placeholder
    header_pattern = r'<header class="site-header">.*?</header>'
    content = re.sub(header_pattern, '<div id="header-placeholder"></div>', content, flags=re.DOTALL)

    # Add navigation buttons before footer
    nav_html = '\n    <nav class="page-navigation">\n'

    if prev_page:
        nav_html += f'        <a href="{prev_page[0]}" class="nav-button nav-button-prev">{prev_page[1]}</a>\n'
    else:
        nav_html += '        <span class="nav-button nav-button-prev disabled">Previous</span>\n'

    if next_page:
        nav_html += f'        <a href="{next_page[0]}" class="nav-button nav-button-next">{next_page[1]}</a>\n'
    else:
        nav_html += '        <span class="nav-button nav-button-next disabled">Next</span>\n'

    nav_html += '    </nav>\n\n'

    # Insert navigation before footer
    footer_pattern = r'(<footer class="site-footer">)'
    content = re.sub(footer_pattern, nav_html + r'\1', content)

    # Write updated content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Updated {filename}")

# Process all files
for i, (filename, title, page_id) in enumerate(page_order):
    prev_page = page_order[i-1][:2] if i > 0 else None
    next_page = page_order[i+1][:2] if i < len(page_order) - 1 else None

    update_html_file(filename, title, page_id, prev_page, next_page)

print("\nAll files updated successfully!")
