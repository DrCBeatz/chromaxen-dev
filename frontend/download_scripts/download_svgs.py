# frontend/download_scripts/download_svgs.py

import urllib.request
import urllib.error
import time

base_url = 'http://dweeb.ninja/chromaxen/img/rule_images_svg/'

# Loop over the range 0 to 255
for i in range(256):
    url = f'{base_url}rule{i}.svg'
    filename = f'rule{i}.svg'
    time.sleep(1)

    try:
        urllib.request.urlretrieve(url, filename)
        print(f'Downloded {filename}')
    except urllib.error.HTTPError as http_err:
        print(f'HTTP error occurred: {http_err}')
    except Exception as err:
        print(f'An error occured for {url}: {err}')