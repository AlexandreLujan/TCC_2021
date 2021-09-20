from matplotlib import pyplot as plt
import imutils
import cv2
import sys

pathDir = '/home/alexandre/TCC_2021/public/previews/generated_histogram/'

def grayscale(imagePath):
	global pathDir
	# load the input image and convert it to grayscale
	image = cv2.imread(imagePath)
	image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
	# compute a grayscale histogram
	hist = cv2.calcHist([image], [0], None, [256], [0, 256])
	# matplotlib expects RGB images so convert and then display the image
	# with matplotlib
	plt.figure()
	plt.axis("off")
	plt.imshow(cv2.cvtColor(image, cv2.COLOR_GRAY2RGB))
	# plot the histogram
	plt.figure()
	plt.title("Grayscale Histogram")
	plt.xlabel("Bins")
	plt.ylabel("# of Pixels")
	plt.plot(hist)
	plt.xlim([0, 256])
	#plt.show()
	# save our plot
	plt.savefig(pathDir + str(sys.argv[1]) + '.png')

def color(imagePath):
	global pathDir
	# load the input image from disk
	image = cv2.imread(imagePath)
	# split the image into its respective channels, then initialize the
	# tuple of channel names along with our figure for plotting
	chans = cv2.split(image)
	colors = ("b", "g", "r")
	plt.figure()
	plt.title("'Flattened' Color Histogram")
	plt.xlabel("Bins")
	plt.ylabel("# of Pixels")
	# loop over the image channels
	for (chan, color) in zip(chans, colors):
		# create a histogram for the current channel and plot it
		hist = cv2.calcHist([chan], [0], None, [256], [0, 256])
		plt.plot(hist, color=color)
		plt.xlim([0, 256])
	#now let's build a 3D color histogram
	# (utilizing all channels) with 8 bins in each direction -- we
	# can't plot the 3D histogram, but the theory is exactly like
	# that of a 2D histogram, so we'll just show the shape of the
	# histogram
	hist = cv2.calcHist([image], [0, 1, 2],None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
	print("3D histogram shape: {}, with {} values".format(hist.shape, hist.flatten().shape[0]))
	# display the original input image
	#plt.figure()
	#plt.axis("off")
	#plt.imshow(imutils.opencv2matplotlib(image))
	# show our plots
	#plt.show()
	# save our plot
	plt.savefig(pathDir + str(sys.argv[1]) + '.png')

def normGray(imagePath):
	global pathDir
	# load the input image and convert it to grayscale
	image = cv2.imread(imagePath)
	image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
	# compute a grayscale histogram
	hist = cv2.calcHist([image], [0], None, [256], [0, 256])
	# matplotlib expects RGB images so convert and then display the image
	# with matplotlib
	plt.figure()
	plt.axis("off")
	plt.imshow(cv2.cvtColor(image, cv2.COLOR_GRAY2RGB))
	# normalize the histogram
	hist /= hist.sum()
	# plot the normalized histogram
	plt.figure()
	plt.title("Grayscale Histogram (Normalized)")
	plt.xlabel("Bins")
	plt.ylabel("% of Pixels")
	plt.plot(hist)
	plt.xlim([0, 256])
	#plt.show()
	# save our plot
	plt.savefig(pathDir + str(sys.argv[1]) + '.png')

def normColor(imagePath):
	global pathDir
	# load the input image from disk
	image = cv2.imread(imagePath)
	# split the image into its respective channels, then initialize the
	# tuple of channel names along with our figure for plotting
	chans = cv2.split(image)
	colors = ("b", "g", "r")
	plt.figure()
	plt.title("'Flattened' Color Histogram")
	plt.xlabel("Bins")
	plt.ylabel("# of Pixels")
	# loop over the image channels
	for (chan, color) in zip(chans, colors):
		# create a histogram for the current channel and plot it
		hist = cv2.calcHist([chan], [0], None, [256], [0, 256])
		plt.plot(hist, color=color)
		plt.xlim([0, 256])
	#now let's build a 3D color histogram
	# (utilizing all channels) with 8 bins in each direction -- we
	# can't plot the 3D histogram, but the theory is exactly like
	# that of a 2D histogram, so we'll just show the shape of the
	# histogram
	hist = cv2.calcHist([image], [0, 1, 2],None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
	print("3D histogram shape: {}, with {} values".format(hist.shape, hist.flatten().shape[0]))
	# display the original input image
	plt.figure()
	plt.axis("off")
	plt.imshow(imutils.opencv2matplotlib(image))
	# show our plots
	#plt.show()
	# save our plot
	plt.savefig(pathDir + str(sys.argv[1]) + '.png')

def twoD(imagePath):
	global pathDir
	# load the input image from disk
	image = cv2.imread(imagePath)
	# split the image into its respective channels, then initialize the
	# tuple of channel names along with our figure for plotting
	chans = cv2.split(image)
	colors = ("b", "g", "r")
	plt.figure()
	plt.title("'Flattened' Color Histogram")
	plt.xlabel("Bins")
	plt.ylabel("# of Pixels")
	# loop over the image channels
	for (chan, color) in zip(chans, colors):
		# create a histogram for the current channel and plot it
		hist = cv2.calcHist([chan], [0], None, [256], [0, 256])
		plt.plot(hist, color=color)
		plt.xlim([0, 256])
	# create a new figure and then plot a 2D color histogram for the
	# green and blue channels
	fig = plt.figure()
	ax = fig.add_subplot(131)
	hist = cv2.calcHist([chans[1], chans[0]], [0, 1], None, [32, 32],[0, 256, 0, 256])
	p = ax.imshow(hist, interpolation="nearest")
	ax.set_title("2D Color Histogram for G and B")
	plt.colorbar(p)
	# plot a 2D color histogram for the green and red channels
	ax = fig.add_subplot(132)
	hist = cv2.calcHist([chans[1], chans[2]], [0, 1], None, [32, 32],[0, 256, 0, 256])
	p = ax.imshow(hist, interpolation="nearest")
	ax.set_title("2D Color Histogram for G and R")
	plt.colorbar(p)
	# plot a 2D color histogram for blue and red channels
	ax = fig.add_subplot(133)
	hist = cv2.calcHist([chans[0], chans[2]], [0, 1], None, [32, 32],[0, 256, 0, 256])
	p = ax.imshow(hist, interpolation="nearest")
	ax.set_title("2D Color Histogram for B and R")
	plt.colorbar(p)
	# finally, let's examine the dimensionality of one of the 2D
	# histograms
	print("2D histogram shape: {}, with {} values".format(hist.shape, hist.flatten().shape[0]))
	# show our plots
	#plt.show()
	# save our plot
	plt.savefig(pathDir + str(sys.argv[1]) + '.png')

def main():
    imagePath = '/home/alexandre/TCC_2021/processed_photos/' + str(sys.argv[1]) + '/' + str(sys.argv[3])

    if sys.argv[2] == '1':
        grayscale(imagePath)
    elif(str(sys.argv[2]) == '2'):
        color(imagePath)
    elif(str(sys.argv[2]) == '3'):
	    normGray(imagePath)
    elif(str(sys.argv[2]) == '4'):
	    normColor(imagePath)
    elif(str(sys.argv[2]) == '5'):
        twoD(imagePath)
	
# main
if __name__ == '__main__':
    print("This is the name of the program:", sys.argv[0])
    print("Argument List:", str(sys.argv))
    main()