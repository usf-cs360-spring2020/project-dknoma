import pandas as pd
df1 = pd.read_csv('steam_games_titles.csv', error_bad_lines=False)
df2 = pd.read_csv('steam_reviews.csv')

test = df2['title'].drop_duplicates().to_numpy()

# print(test)

df1 = df1.loc[df1['title'].isin(test)]

df1.drop(["url", "languages", "popular_tags", "game_details", "release_date", "developer", "publisher", "game_description", "achievements", "mature_content", "recent_reviews", "minimum_requirements", "recommended_requirements", "types", "desc_snippet", "original_price", "discount_price"], axis=1, inplace=True)
df2.drop(["funny", "is_early_access_review", "review"], axis=1, inplace=True)

df2 = df2[df2['date_posted'].dt.year != 2019]

df_final = df1.merge(df2, left_on = 'title', right_on = 'title')
# # df_final = pd.merge(df1, df2, how = 'inner', on = 'title')

df_final.to_csv('steam_combined_final.csv')