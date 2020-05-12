import pandas as pd
df1 = pd.read_csv('steam_games_titles.csv', error_bad_lines=False)
df2 = pd.read_csv('steam_reviews.csv')

title = df2['title'].drop_duplicates().to_numpy()

df1 = df1.loc[df1['title'].isin(title)]

df1.drop(["url", "all_reviews", "genre", "languages", "popular_tags", "game_details", "release_date", "developer", "publisher", "game_description", "achievements", "mature_content", "recent_reviews", "minimum_requirements", "recommended_requirements", "types", "desc_snippet", "original_price", "discount_price"], axis=1, inplace=True)

df1.to_csv('steam_reduced_final.csv')