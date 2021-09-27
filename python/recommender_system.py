import sys
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

a, b, c, d, e, m = None, None, None, None, None, None

def create_soup(x):
	global a, b, c, d, e

	return ''.join(x['Object'])+' '+''.join(a)+' '+''.join(b)+' '+''.join(c)+' '+''.join(d)+' '+''.join(e)

def get_recommendations(title, cosine_sim, indices):
	global m 

	idx = indices[title]
	
	sim_scores = list(enumerate(cosine_sim[idx]))
	
	sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
	
	sim_scores = sim_scores[1:11]
	
	obj_indices = [i[0] for i in sim_scores]
	
	return m['Object'].iloc[obj_indices]

def main():
	global a, b, c, d, e, m

	astroObj=pd.read_csv('../database/Argumments.csv')
	camera=pd.read_csv('../database/Camera.csv')

	print(astroObj.columns)
	print(camera.columns)

	m = pd.merge(camera, astroObj, how = 'inner', on = "Object")
	m = m.loc[(m['Object'] == str(sys.argv[1]))]
	print(m)

	a = ''.join(str(u).replace(' ', '') for u in m['Camera'])
	b = ''.join(str(v).replace(' ', '') for v in m['Speed'])
	c = ''.join(str(x).replace(' ', '') for x in m['Shutter'])
	d = ''.join(str(w).replace(' ', '') for w in m['Aperture'])
	e = ''.join(str(y).replace(' ', '') for y in m['Focal_Length'])

	m['Soup']=m.apply(create_soup, axis=1)

	print(m['Soup'])
	tfidf = TfidfVectorizer(stop_words='english')
	tfidf_matrix = tfidf.fit_transform(m['Soup'])
	print(tfidf_matrix.shape)

	cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)
	indices = pd.Series(m.index, index=m['Object']).drop_duplicates()
	get_recommendations(str(sys.argv[2]), cosine_sim, indices)

# main
if __name__ == '__main__':
    print("This is the name of the program:", sys.argv[0])
    print("Argument List:", str(sys.argv))
    main()