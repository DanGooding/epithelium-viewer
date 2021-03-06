import cv2


def output_image_processing(input, smoothing: int, threshold: float):
    """
        Smooths the output image mask using gaussian smoothing and then applies a binary threshold
        :param input: numpy_array input of floating point values between 0 and 1
        :param smoothing: how much the image is smoothed, MUST BE ODD, the higher the more smoothed e.g. 15
        :param threshold: value used to determine if value is 0 or 1  e.g. 0.8
        :return: numpy_array of 0 or 1 values
    """
    blur = cv2.GaussianBlur(input, (smoothing, smoothing), 0)
    other, img = cv2.threshold(blur, threshold, 1, cv2.THRESH_BINARY)
    return img