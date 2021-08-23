#This code is a modified version from the following source: https://github.com/wkjarosz/astro-stacker

#----------------------------------------------Arguments passed to the program-----------------------
#sys.argv[0] = name of program
#-------------Process options-------------------------------------------
#sys.argv[1] = user id (folder)
#sys.argv[2] = base frame (false or true) default false
#sys.argv[3] = base file or empty
#sys.argv[4] = align (false or true) default true
#sys.argv[5] = cache (false or true) default true
#sys.argv[6] = raw demosaic (false or true) default false
#sys.argv[7] = visible (false or true) default true
#sys.argv[8] = padding default 0.0
#sys.argv[9] = thresholded at the percentile [default: 0.85]
#sys.argv[10] = dark frame (false or true) default false
#sys.argv[11] = dark file or empty
#sys.argv[12] = flat frame (false or true) default false
#sys.argv[13] = flat file or empty
#sys.argv[14] = mask frame (false or true) default false
#sys.argv[15] = mask file or empty
#sys.argv[16] = output name
#sys.argv[17] = output format
#sys.argv[18] = album name
#--------------RAW Pre-Process-------------------------------------------
#sys.argv[19] = gamma (linear, sRGB or other) default linear
#sys.argv[20] = no auto scale (true or false) default false
#sys.argv[21] = no auto brigth (true or false) default true
#sys.argv[22] = output bps : 16 or 8 bits, default 16
#sys.argv[23] = camera white balance (true or false) default false
#sys.argv[24] = auto white balance (true or false) default false
#sys.argv[25] = output color (int)
#sys.argv[26] = demosaic algorithm (int)
#sys.argv[27] = fbdd noise reduction (int)
#sys.argv[28] = dcb enhance (int)
#sys.argv[29] = dcb iterations (int)
#sys.argv[30] = half size (true or false) default false
#sys.argv[31] = median filter passes (int)

#example : python3 astro_stacker.py 60f87bdd1fb02841a6bcf2eb False null True True False True 0.0 0.85 False null False null False null My-Processed-Photo .tiff folder1 linear False True 16 False False 1 3 0 False 0 False 0

import sys
import os
import cv2
import numpy as np
import atexit
import rawpy
from tqdm import tqdm, trange

pathDir, stabilized_average, divider_mask, imagenumbers, master_dark, master_flat, alignment_mask = None, None, None, None, None, None, None

def load_master_dark_frame():
    global master_dark

    if ((sys.argv[10] == 'true') and (sys.argv[11] != 'null')):
        print("Reading master dark frame '{}'...".format(sys.argv[11]))
        master_dark = cv2.imread(sys.argv[11], cv2.IMREAD_UNCHANGED).astype(np.uint16)

def load_master_flat_frame():
    global master_flat

    if ((sys.argv[12] == 'true') and (sys.argv[13] != 'null')):
        print("Reading master flat frame '{}'...".format(sys.argv[13]))
        master_flat = cv2.imread(sys.argv[13], cv2.IMREAD_UNCHANGED).astype(np.uint16)
        master_flat[master_flat <= 0] = 1 # prevent divide by zero

        max_flat = float(np.amax(master_flat))
        # print(f'max_flat = {max_flat}')
        master_flat = 1.2 * master_flat / max_flat

def load_mask():
    global alignment_mask

    if ((sys.argv[14] == 'true') and (sys.argv[15] != 'null')):
        print("Reading mask '{}'...".format(sys.argv[15]))
        alignment_mask = cv2.imread(sys.argv[15], cv2.IMREAD_UNCHANGED).astype(np.uint8)

def load_frame(imgname, pbar):
    global pathDir, master_dark, master_flat

    if(sys.argv[19] == 'linear'):
        linearGamma = (1,1)
        setGamma = linearGamma
    elif(sys.argv[19] == 'sRGB'):
        sRGBGamma = (2.4,12.92)
        setGamma = sRGBGamma

    calibrate = master_dark is not None and master_flat is not None

    black        = 0 if calibrate or sys.argv[6] else None
    whitebalance = [0,0,0,0] if calibrate or sys.argv[6] else None

    params = rawpy.Params(gamma=setGamma,
                          no_auto_scale=(sys.argv[20].lower() == 'true'),
                          no_auto_bright=(sys.argv[21].lower() == 'true'),
                          output_bps=int(sys.argv[22]),
                          use_camera_wb=(sys.argv[23].lower() == 'true'),
                          use_auto_wb=(sys.argv[24].lower() == 'true'),
                          user_wb=whitebalance,
                          output_color=rawpy.ColorSpace(int(sys.argv[25])),
                          demosaic_algorithm=rawpy.DemosaicAlgorithm(int(sys.argv[26])),
                          fbdd_noise_reduction=rawpy.FBDDNoiseReductionMode(int(sys.argv[27])),
                          dcb_enhance=(sys.argv[28].lower() == 'true'),
                          dcb_iterations=int(sys.argv[29]),
                          half_size=(sys.argv[30].lower() == 'true'),
                          median_filter_passes=int(sys.argv[31]),
                          user_black=black)

    try:
        pbar.set_postfix(step=f"loading")
        data = pathDir + 'uploads/' + str(sys.argv[1]) + '/' + str(sys.argv[18]) + '/' + imgname
        with rawpy.imread(data) as raw:
            if calibrate:
                if raw.raw_image.shape != master_dark.shape or raw.raw_image.shape != master_flat.shape:
                    raise RuntimeError("Flat and dark frames must be the same resolution as each stacked image")

                pbar.set_postfix(step=f"calibrating")

                dark_removed = (1.0*raw.raw_image - master_dark)
                dark_removed[dark_removed < 0] = 0
                corrected = dark_removed / master_flat
                corrected[corrected < 0] = 0
                np.copyto(raw.raw_image, corrected.astype(np.uint16))
           
            if sys.argv[6]:
                img = np.float32(raw.raw_image.astype(np.uint16) / 65535.0)
            else:
                pbar.set_postfix(step=f"demosaicing")
                img = np.float32(raw.postprocess(params).astype(np.uint16) / 65535.0)
            
            # crop margin
            if sys.argv[7]:
                s = raw.sizes
                img = img[s.top_margin*2:s.raw_height - s.top_margin*2,s.left_margin*2:s.raw_width - s.left_margin*2]                           
            
        return img
    except rawpy.LibRawError as inst:
        return None

def is_power_of_two(n):
    return (n != 0) and (n & (n-1) == 0)

def compute_homography(next_image, base_image, frame_num = 0, cache = None):

    MAX_FEATURES = 500
    GOOD_MATCH_PERCENT = 0.10

    # Convert images to grayscale
    next_imageGray = cv2.cvtColor(next_image, cv2.COLOR_BGR2GRAY)
    base_imageGray = cv2.cvtColor(base_image, cv2.COLOR_BGR2GRAY)

    if sys.argv[9]:
        thr = np.percentile(next_imageGray, sys.argv[9])
        next_imageGray = (next_imageGray - thr) / (1.0 - thr)
        next_imageGray[next_imageGray < 0] = 0
        
        thr = np.percentile(base_imageGray, sys.argv[9])
        base_imageGray = (base_imageGray - thr) / (1.0 - thr)
        base_imageGray[base_imageGray < 0] = 0

    
    # Detect features and compute descriptors.
    alg = cv2.AKAZE_create()
    # alg = cv2.ORB_create(MAX_FEATURES)
    # alg = cv2.SIFT_create()

    kp1, des1 = alg.detectAndCompute(next_imageGray, None)

    # calculate and cache feature points+descriptors for base_image
    kp2, des2 = None, None
    if cache is not None:
        if frame_num <= 2 or is_power_of_two(frame_num):
            kp2, des2 = alg.detectAndCompute(base_imageGray, alignment_mask)
            cache['kp2'] = kp2
            cache['des2'] = des2  
        else:
            kp2, des2 = cache['kp2'], cache['des2']
    else:
        kp2, des2 = alg.detectAndCompute(base_imageGray, alignment_mask)


    # Match features.
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = matcher.match(des1, des2, None)

    # Sort matches by score
    matches.sort(key=lambda x: x.distance, reverse=False)

    # Remove not so good matches
    numGoodMatches = int(len(matches) * GOOD_MATCH_PERCENT)
    matches = matches[:numGoodMatches]

    
    # Extract location of good matches
    points1 = np.zeros((len(matches), 2), dtype=np.float32)
    points2 = np.zeros((len(matches), 2), dtype=np.float32)

    for i, match in enumerate(matches):
        points1[i, :] = kp1[match.queryIdx].pt
        points2[i, :] = kp2[match.trainIdx].pt

    # Find homography
    H, mask = cv2.findHomography(points1, points2, cv2.RANSAC, 5.0)

    return H


def transform_image_to_base_image(image, H):
    h,w,b = image.shape

    return cv2.warpPerspective(image, H, (w, h))


def make_mask_for_image(_img, _border_coeff = 0):
    return add_padding(np.ones_like(_img, dtype=np.uint16), _border_coeff)


def add_padding(_img, _border_coeff = 0):
    hborder = int(_img.shape[0]*_border_coeff)
    wborder = int(_img.shape[1]*_border_coeff)
    map1 = cv2.copyMakeBorder(_img, hborder, hborder, wborder, wborder, borderType = cv2.BORDER_CONSTANT, value = (0, 0, 0))
    return map1


def exit_handler():
    global pathDir, stabilized_average, divider_mask, imagenumbers

    print(f"Averaged {np.min(divider_mask)}/{np.mean(divider_mask)}/{np.max(divider_mask)} images.")

    stabilized_average /= divider_mask # dividing sum by number of images
 
    outname = str(sys.argv[16])

    print("Saving file " + outname)
    
    stabilized_average[stabilized_average < 0] = 0
    stabilized_average[stabilized_average > 1] = 1
    
    outFormat = str(sys.argv[17])

    pathToSave = pathDir + 'processed_photos/' + str(sys.argv[1]) + '/'

    cv2.imwrite(pathToSave + outname + outFormat, np.uint16(stabilized_average*65535))
    cv2.imwrite(pathToSave + outname + '.hdr', stabilized_average)

def main():
    global pathDir, stabilized_average, divider_mask, imagenumbers

    atexit.register(exit_handler)
    
    shape_original = None
    shape_no_border = None
    shape = None

    stabilized_average = None
    mask_image_no_border = None
    mask_image = None
    divider_mask_no_border = None
    divider_mask = None
    transformed_image = None
    transformed_mask  = None
    pathDir = '/home/alexandre/TCC_2021/'

    imagenumbers = []
    infiles = []
    albumDir = pathDir + 'uploads/' + str(sys.argv[1]) + '/' + str(sys.argv[18])
    print(albumDir)
    with os.scandir(albumDir) as entries:
        for entry in entries:
            print(entry.name)
            infiles.append(entry.name)
    
    print(f'Photos List {infiles}')
    infiles.sort()

    # check if a base frame is specified, otherwise just use the first image in infiles
    if ((sys.argv[2] == 'true') and (sys.argv[3] != 'null')):
        base = sys.argv[3]
        idx = next((i for i, x in enumerate(infiles) if x == base), None)
        if idx:
            # if base file is one of the infiles, then make it the first one via circular shift
            infiles = infiles[idx:] + infiles[:idx]
        else:
            # otherwise prepend it
            infiles = [base] + infiles

    # convert boolean arguments to actual booleans
    sys.argv[4] = sys.argv[4].lower() in ["true", "1"]
    sys.argv[5] = sys.argv[5].lower() in ["true", "1"]
    sys.argv[6] = sys.argv[6].lower() in ["true", "1"]
    sys.argv[7] = sys.argv[7].lower() in ["true", "1"]

    # clip numerical parameters to appropriate ranges
    sys.argv[8] = np.clip(np.float32(sys.argv[8]), 0.0, 1.0)
    sys.argv[9] = np.clip(np.float32(sys.argv[9]), 0.0, 1.0)

    numimages = len(infiles)

    if (sys.argv[4]):
        print(f"Attempting to stack {numimages} images (with all images aligned to the first):", "\n  ".join([f"{i:03d}: {s}" for i,s in enumerate(infiles)]), sep="\n  ")
        print(f"{'Will' if (sys.argv[5]) else 'Will not'} cache base frame keypoints during alignment.")
    else:
        print(f"Attempting to stack {numimages} images", "\n  ".join([f"{i:03d}: {s}" for i,s in enumerate(infiles)]), sep="\n  ")

    print(f"{'Will' if ((sys.argv[10]) == 'true') else 'Will not'} use dark frames for calibration.")
    print(f"{'Will' if ((sys.argv[12]) == 'true') else 'Will not'} use flat frames for calibration.")

    load_master_dark_frame()
    load_master_flat_frame()
    load_mask()

    keypoint_cache = dict() if (sys.argv[5]) else None

    pbar = tqdm(range(numimages))
    for f in pbar:

        pbar.set_description(f"Processing image {f}")

        imgname = infiles[f]

        input_image_ = load_frame(imgname, pbar)
        if input_image_ is None:
            print(f"ERROR: could not read frame '{imgname}'!")
            print(f"  Skipping ahead to frame {f+1}: '{infiles[f+1]}'")
            continue

        input_image_no_border = None
        input_image = None


        try:
            shape_original = input_image_.shape
        except Exception as e:
            print(f"Reading '{imgname}' failed")
            if f > 0:
                return
            continue
        
        input_image_no_border = input_image_

        input_image = add_padding(input_image_no_border, sys.argv[8])
        
        shape_no_border = input_image_no_border.shape
        shape = input_image.shape

        if stabilized_average is None:
            stabilized_average = np.float32(input_image)
            
        if mask_image is None:
            mask_image_no_border = make_mask_for_image(input_image_no_border)
            mask_image = add_padding(mask_image_no_border, sys.argv[8])

        imagenumbers.append(f)
        
        transformed_image = input_image
        transformed_mask  = mask_image

        if sys.argv[4] and f > 0:
            base = (stabilized_average/divider_mask)  
            base = base.clip(0,1)

            H = compute_homography(input_image, base.astype(input_image.dtype), f, keypoint_cache)
            
            transformed_image = transform_image_to_base_image(transformed_image, H)
            transformed_mask  = transform_image_to_base_image(mask_image, H)
        
        stabilized_average += np.float32(transformed_image)

        if divider_mask is None:
            divider_mask = make_mask_for_image(mask_image_no_border, sys.argv[8])
            divider_mask[:] = 1
        else:
            divider_mask += transformed_mask

       
# main
if __name__ == '__main__':
    print("This is the name of the program:", sys.argv[0])
    print("Collection (Argument 1):", sys.argv[1])
    print("Argument List:", str(sys.argv))
    main()
