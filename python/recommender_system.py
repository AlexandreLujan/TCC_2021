import sys
import pandas as pd
import numpy as np

n, s = None, None

def get_recommendation(index):
	#read Argumments.csv
	argumments = pd.read_csv('/home/alexandre/TCC_2021/database/Argumments.csv')

	#get row by the index
	row=argumments.iloc[index]

	#save the values
	param=row.values.tolist()

	#the print return the list to node js
	print(param)

#calculate the Euclidean distance using the Pythagorean theorem
def dist(x):
	global n, s
	return np.linalg.norm(x-[float(sys.argv[2]), float(s), float(n)])

def main():
	global n, s

	#read Camera.csv
	camera=pd.read_csv('/home/alexandre/TCC_2021/database/Camera.csv')
		
	#discard rows diferent than sys.argv[1] (astronomy object)
	camera = camera.loc[(camera['Object'] == str(sys.argv[1]))]

	#remove ' sec' from Shutter column
	camera['Shutter'] = camera['Shutter'].map(lambda x: x.replace(' sec', ''))

	#drop object column (not need anymore)
	camera = camera.drop(['Object'], axis=1)

	#if the sys.argv[4] is inf or zero, that means the photographer did not use a lens
	#any other value means the photographer used a lens
	#we need to compare and drop rows that are not compatible with the input data
	#first lets replace 'f/inf' and 'f/0.0' with 0.0
	camera['Aperture'] = camera['Aperture'].map(lambda x: x.replace(('f/'), ''))
	camera['Aperture'] = camera['Aperture'].map(lambda x: x.replace(('inf'), '0.0'))
	#print(camera)
	if (str(sys.argv[4]) == 'f/inf'):
		#keep rows where Aperture is equal to 0.0
		camera = camera.loc[(camera['Aperture'] == ('0.0'))]

		#replace 'f/inf' from sys.argv[4] with '0.0'
		aux = str(sys.argv[4])
		n = aux.replace('f/inf', '0.0')

	elif (str(sys.argv[4]) == 'f/0.0'):
		#keep rows where Aperture is equal to 0.0
		camera = camera.loc[(camera['Aperture'] == ('0.0'))]

		#remove 'f/' from sys.argv[4]
		aux = str(sys.argv[4])
		n = aux.replace('f/', '')

	else:
		#keep rows where Aperture is diferent to 0.0
		camera = camera.loc[(camera['Aperture'] != ('0.0'))]

		#remove 'f/' from Aperture and sys.argv[4]
		camera['Aperture'] = camera['Aperture'].map(lambda x: x.replace('f/', ''))
		aux = str(sys.argv[4])
		n = aux.replace('f/', '')

	#convert the data to a float matrix
	camera = camera.astype(float)

	#remove ' sec' from sys.argv[3]
	aux1 = str(sys.argv[3])
	s = aux1.replace(' sec', '')
 
	#get distancy value from input
	camera['Dist']=camera.apply(dist, axis=1)

	#sort matrix by Dist column
	camera.sort_values(["Dist"], axis=0, ascending=[True], inplace=True)

	#get the index of first row
	index=camera.head(1).index[0]

	#call the recommedation function
	get_recommendation(index)
	
# main
if __name__ == '__main__':
    #print("This is the name of the program:", sys.argv[0])
    #print("Argument List:", str(sys.argv))
    main()