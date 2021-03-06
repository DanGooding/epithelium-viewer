# mock for the ML model which will actually perform the segmentation

# args: [dir of tiles] [dir to put masks]
#  both should be absolute

import numpy as np
import tensorflow as tf
from tensorflow.keras import *
from tensorflow.keras.layers import *
from tensorflow.keras.optimizers import *
from tensorflow.keras.losses import *
from tensorflow.keras.metrics import *
from tensorflow.keras.preprocessing.image import *
from tensorflow.data import *
import output_processing
from PIL import Image

import tensorflow_addons as tfa

import segmentation_models
from segmentation_models.losses import *
from segmentation_models.metrics import iou_score

import matplotlib.pyplot as plt

import os
import datetime
import math
import shutil
import sys

if len(sys.argv) != 3:
    print('wrong number of arguments', file=sys.stderr)
    exit(1)

script_path = sys.argv[0]
tile_dir = sys.argv[1]
mask_dir = sys.argv[2]

IMAGE_DIM = 128
BATCH_SIZE = 16
TRAIN_SPLIT = 0.8
VALIDATION_SPLIT = 1 - TRAIN_SPLIT

resize_and_rescale = tf.keras.Sequential([
    layers.experimental.preprocessing.Resizing(IMAGE_DIM, IMAGE_DIM),
    layers.experimental.preprocessing.Rescaling(1. / 255)
])


def parse_image(image_path):
    image_path = image_path
    image_png = tf.io.read_file(image_path)
    image = tf.io.decode_png(image_png)
    image = resize_and_rescale(image)
    return image


def predict_data(weights_path, data_dir, results_dir, model="resnet34", encoder_weights="imagenet"):
    # Make dir
    if not os.path.exists(results_dir):
        os.mkdir(results_dir)

    # Load model
    model = segmentation_models.Unet(model, encoder_weights=encoder_weights)
    model.compile('Adam', loss=DiceLoss(1.5), metrics=[iou_score, Precision(0.5), Recall(0.5)])
    model.load_weights(weights_path).expect_partial()

    # Get images
    images = tf.data.Dataset.list_files(data_dir + "/*", shuffle=False)
    images = images.map(parse_image).batch(batch_size=BATCH_SIZE)

    # Predict images
    tile_count = 0
    masks_pred = model.predict(images)
    for i, mask_pred in enumerate(masks_pred):
        tile_count += 1
        filename = os.path.join(results_dir, f"tile{tile_count}")
        # mask_pred_unsmoothed = (np.where(mask_pred > 0.5, 1, 0).reshape(IMAGE_DIM, IMAGE_DIM) * 255).astype(np.uint8)
        # im_unsmoothed = Image.fromarray(mask_pred_unsmoothed)
        # out_unsmoothed = im_unsmoothed.resize((512, 512))
        # out_unsmoothed.save(filename + "_unsmoothed.png", "PNG")

        mask_pred_smoothed = np.asarray(output_processing.output_image_processing(mask_pred, 15, 0.5))
        mask_pred_smoothed = (mask_pred_smoothed.reshape(IMAGE_DIM, IMAGE_DIM) * 255).astype(np.uint8)
        im_smoothed = Image.fromarray(mask_pred_smoothed)
        out_smoothed = im_smoothed.resize((512, 512))

        out_smoothed.save(filename + "_smoothed.png", "PNG")
        print("tile " + str(tile_count))


rootdir = "./"
weights_dir = os.path.join(rootdir, "model @2021-03-02 21-03-11.751190")
weights_path = os.path.join(weights_dir, "weights")

predict_data(weights_path, tile_dir, mask_dir)