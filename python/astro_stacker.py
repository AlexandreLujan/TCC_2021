import sys
import cv2
import numpy as np
import atexit
import rawpy
from tqdm import tqdm, trange

stabilized_average, divider_mask, imagenumbers, master_dark, master_flat, alignment_mask = None, None, None, None, None, None

def load_master_dark_frame():
    global master_dark

    if str(sys.argv)['--dark']:
        print("Reading master dark frame '{}'...".format(str(sys.argv)['--dark']))
        master_dark = cv2.imread(str(sys.argv)['--dark'], cv2.IMREAD_UNCHANGED).astype(np.uint16)

def load_master_flat_frame():
    global master_flat

    if str(sys.argv)['--flat']:
        print("Reading master flat frame '{}'...".format(str(sys.argv)['--flat']))
        master_flat = cv2.imread(str(sys.argv)['--flat'], cv2.IMREAD_UNCHANGED).astype(np.uint16)
        master_flat[master_flat <= 0] = 1 # prevent divide by zero

        max_flat = float(np.amax(master_flat))
        # print(f'max_flat = {max_flat}')
        master_flat = 1.2 * master_flat / max_flat

def load_mask():
    global alignment_mask

    if str(sys.argv)['--mask']:
        print("Reading mask '{}'...".format(str(sys.argv)['--mask']))
        alignment_mask = cv2.imread(str(sys.argv)['--mask'], cv2.IMREAD_UNCHANGED).astype(np.uint8)

def load_frame(imgname, pbar):
    global master_dark, master_flat

    linearGamma = (1,1)
    sRGBGamma = (2.4,12.92)

    calibrate = master_dark is not None and master_flat is not None

    black        = 0 if calibrate or str(sys.argv)['--raw'] else None
    whitebalance = [0,0,0,0] if calibrate or str(sys.argv)['--raw'] else None

    params = rawpy.Params(gamma=linearGamma,
                          no_auto_scale=False,
                          no_auto_bright=True,
                          output_bps=16,
                          use_camera_wb=False,
                          use_auto_wb=False,
                          user_wb=None,
                          output_color=rawpy.ColorSpace.sRGB,
                          demosaic_algorithm=rawpy.DemosaicAlgorithm.AHD,
                          fbdd_noise_reduction=rawpy.FBDDNoiseReductionMode.Off,
                          dcb_enhance=False,
                          dcb_iterations=0,
                          half_size=False,
                          median_filter_passes=0,
                          user_black=black)

    try:
        pbar.set_postfix(step=f"loading")
        with rawpy.imread(imgname) as raw:
            if calibrate:
                if raw.raw_image.shape != master_dark.shape or raw.raw_image.shape != master_flat.shape:
                    raise RuntimeError("Flat and dark frames must be the same resolution as each stacked image")

                pbar.set_postfix(step=f"calibrating")

                dark_removed = (1.0*raw.raw_image - master_dark)
                dark_removed[dark_removed < 0] = 0
                corrected = dark_removed / master_flat
                corrected[corrected < 0] = 0
                np.copyto(raw.raw_image, corrected.astype(np.uint16))
            
            if str(sys.argv)['--raw']:
                img = np.float32(raw.raw_image.astype(np.uint16) / 65535.0)
            else:
                pbar.set_postfix(step=f"demosaicing")
                img = np.float32(raw.postprocess(params).astype(np.uint16) / 65535.0)
            
            # crop margin
            if str(sys.argv)['--visible']:
                s = raw.sizes
                img = img[s.top_margin*2:s.raw_height - s.top_margin*2,
                          s.left_margin*2:s.raw_width - s.left_margin*2]
            
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

    if str(sys.argv)['--threshold']:
        thr = np.percentile(next_imageGray, str(sys.argv)['--threshold'])
        next_imageGray = (next_imageGray - thr) / (1.0 - thr)
        next_imageGray[next_imageGray < 0] = 0
        
        thr = np.percentile(base_imageGray, str(sys.argv)['--threshold'])
        base_imageGray = (base_imageGray - thr) / (1.0 - thr)
        base_imageGray[base_imageGray < 0] = 0

    if str(sys.argv)['--debug'] >= 3:
        cv2.imwrite(f'DEBUG_next-{frame_num}-after-threshold.hdr', next_imageGray)
        cv2.imwrite(f'DEBUG_base-{frame_num}-after-threshold.hdr', base_imageGray)


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

    if str(sys.argv)['--debug'] >= 3:    
        # Draw top matches
        imMatches = cv2.drawMatches((next_image * 255).astype(np.uint8), kp1,
                                    (base_image * 255).astype(np.uint8), kp2, matches, None)
        cv2.imwrite(f'DEBUG_{frame_num}_matches.tiff', imMatches)

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
    global stabilized_average, divider_mask, imagenumbers

    print(f"Averaged {np.min(divider_mask)}/{np.mean(divider_mask)}/{np.max(divider_mask)} images.")

    stabilized_average /= divider_mask # dividing sum by number of images
 
    if str(sys.argv)['-o']:
        outname = f"{str(sys.argv)['-o']}{imagenumbers[0]}-{imagenumbers[-1]}"
    else:
        outname = f"{imagenumbers[0]}-{imagenumbers[-1]}"

    print("Saving file " + outname)
    
    stabilized_average[stabilized_average < 0] = 0
    stabilized_average[stabilized_average > 1] = 1
    
    cv2.imwrite(outname + '.tiff', np.uint16(stabilized_average*65535))
    cv2.imwrite(outname + '.hdr', stabilized_average)


def main():
    global stabilized_average, divider_mask, imagenumbers

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

    imagenumbers = []

    infiles = (sys.argv)['INFILES']
    infiles.sort()

    # check if a base frame is specified, otherwise just use the first image in infiles
    if str(sys.argv)['--base']:
        base = str(sys.argv)['--base']
        idx = next((i for i, x in enumerate(infiles) if x == base), None)
        if idx:
            # if base file is one of the infiles, then make it the first one via circular shift
            infiles = infiles[idx:] + infiles[:idx]
        else:
            # otherwise prepend it
            infiles = [base] + infiles

    # convert boolean arguments to actual booleans
    str(sys.argv)['--align'] = str(sys.argv)['--align'].lower() in ["true", "1"]
    str(sys.argv)['--cache'] = str(sys.argv)['--cache'].lower() in ["true", "1"]
    str(sys.argv)['--raw'] = str(sys.argv)['--raw'].lower() in ["true", "1"]
    str(sys.argv)['--visible'] = str(sys.argv)['--visible'].lower() in ["true", "1"]

    # clip numerical parameters to appropriate ranges
    str(sys.argv)['--padding'] = np.clip(np.float32(str(sys.argv)['--padding']), 0.0, 1.0)
    str(sys.argv)['--threshold'] = np.clip(np.float32(str(sys.argv)['--threshold']), 0.0, 1.0)
    str(sys.argv)['--debug'] = int(str(sys.argv)['--debug'])

    numimages = len(infiles)

    if str(sys.argv)['--align']:
        print(f"Attempting to stack {numimages} images (with all images aligned to the first):", "\n  ".join([f"{i:03d}: {s}" for i,s in enumerate(infiles)]), sep="\n  ")
        print(f"{'Will' if str(sys.argv)['--cache'] else 'Will not'} cache base frame keypoints during alignment.")
    else:
        print(f"Attempting to stack {numimages} images", "\n  ".join([f"{i:03d}: {s}" for i,s in enumerate(infiles)]), sep="\n  ")

    print(f"{'Will' if str(sys.argv)['--dark'] or str(sys.argv)['--flat'] else 'Will not'} use flat and dark frames for calibration.")

    load_master_dark_frame()
    load_master_flat_frame()
    load_mask()

    keypoint_cache = dict() if str(sys.argv)['--cache'] else None

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

        input_image = add_padding(input_image_no_border, str(sys.argv)["--padding"])
        
        shape_no_border = input_image_no_border.shape
        shape = input_image.shape

        if stabilized_average is None:
            stabilized_average = np.float32(input_image)
            
        if mask_image is None:
            mask_image_no_border = make_mask_for_image(input_image_no_border)
            mask_image = add_padding(mask_image_no_border, str(sys.argv)["--padding"])

        imagenumbers.append(f)
        
        transformed_image = input_image
        transformed_mask  = mask_image

        if str(sys.argv)['--align'] and f > 0:
            base = (stabilized_average/divider_mask)  
            base = base.clip(0,1)

            H = compute_homography(input_image, base.astype(input_image.dtype), f, keypoint_cache)
            
            transformed_image = transform_image_to_base_image(transformed_image, H)
            transformed_mask  = transform_image_to_base_image(mask_image, H)
        
        stabilized_average += np.float32(transformed_image)

        if divider_mask is None:
            divider_mask = make_mask_for_image(mask_image_no_border, str(sys.argv)["--padding"])
            divider_mask[:] = 1
        else:
            divider_mask += transformed_mask

        if str(sys.argv)['--debug'] >= 3:
            cv2.imwrite(f'DEBUG_{f}.hdr', np.float32(transformed_image))
            cv2.imwrite(f'DEBUG_average_so_far_{f}.hdr', stabilized_average / divider_mask)
            cv2.imwrite(f'DEBUG_average_so_far_{f}.png', np.uint16(stabilized_average / divider_mask * 65535))
            cv2.imwrite(f'DEBUG_divider_mask_{f}.png', np.uint16(divider_mask))
            print('mask: ', divider_mask[0,0])

# main
if __name__ == '__main__':
    print ("Number of arguments:", len(str(sys.argv)), "arguments.")
    print ("Argument List: ", str(sys.argv))
    main()