import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

credits=pd.read_csv('../database/tmdb_5000_credits.csv')
movies=pd.read_csv('../database/tmdb_5000_movies.csv')

print(credits.columns)
print(movies.columns)

credits.columns=['id','title','cast', 'crew']
movies=movies.merge(credits, on='id')
print(movies['overview'].head(5))
movies['overview'] = movies['overview'].fillna('')

def create_soup(x):
	return ''.join(x['keywords'])+''+''.join(x['genres'])+''+''.join(x['overview'])

movies['soup']=movies.apply(create_soup, axis=1)

tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(movies['soup'])
print(tfidf_matrix.shape)

cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)
indices = pd.Series(movies.index, index=movies['title']).drop_duplicates()

def get_recommendations(title, cosine_sim=cosine_sim):
	idx = indices[title]
	
	sim_scores = list(enumerate(cosine_sim[idx]))
	
	sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
	
	sim_scores = sim_scores[1:11]
	
	movie_indices = [i[0] for i in sim_scores]
	
	return movies['title'].iloc[movie_indices]

get_recommendations('The Avengers', cosine_sim)