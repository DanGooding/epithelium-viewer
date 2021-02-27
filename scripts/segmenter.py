# mock for the ML model which will actually perform the segmentation

# args: [dir of tiles] [dir to put masks]
#  both should be absolute

# TODO should it print the filenames as it creates them?
    # probably nicer than watching the folder

import os
import shutil
import sys

if len(sys.argv) != 3:
    print('wrong number of arguments', file=sys.stderr)
    exit(1)

script_path = sys.argv[0]
tile_dir = sys.argv[1]
mask_dir = sys.argv[2]

sample_mask_path = os.path.join(os.path.split(script_path)[0], 'dots.png')

for tile_name in os.listdir(tile_dir):
    shutil.copyfile(sample_mask_path, os.path.join(mask_dir, tile_name))
