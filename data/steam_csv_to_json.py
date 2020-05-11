import csv
from collections import defaultdict

column_names = ['', 'title', 'all_reviews', 'popular_tags', 'game_details', 'genre', 'date_posted', 'helpful', 'hour_played', 'recommendation', 'review']

def ctree():
    return defaultdict(ctree)

def build_leaf(name, leaf):
    if not isinstance(leaf, int):
        res = {'name': name}

        # add children node if the leaf actually has any children
        if len(leaf.keys()) > 0:
            res['children'] = [build_leaf(k, v) for k, v in leaf.items()]
        else:
            res['value'] = 1
    else:
        res = {'name': 'reviews', 'value': 1, 'size': leaf}

    return res


def main():
    tree = ctree()
    game_tree = ctree()
    games = dict()
    title_to_game = dict()
    with open('steam_combined.csv') as csvfile:
        reader = csv.reader(csvfile)
        for rid, row in enumerate(reader):

            if rid == 0:
                continue

            # get review types and genres
            review_type = row[2].split(',')[0]
            genres = row[5].split(',')
            details_split = row[3].split(',')

            title_str = row[1]

            # Check if game title exists
            inside = title_str in games
            if not inside:
                games[title_str] = title_str

            game_entry = games[title_str]

            game = game_tree[game_entry]

            if not inside:
                details = game['Game Details']      # details
                for d in details_split:
                    det = details[d]                # add all details as children for sunburst
                all_reviews = game[review_type]     # lifetime reviews

            if 'reviews' not in game:
                game['reviews'] = 0                 # init review count

            game['reviews'] = game['reviews'] + 1   # increment count

            # add game to each genre it has
            for g in genres:
                genre = tree[g]

                game = game_tree[game_entry]

                genre[title_str] = game

    # building a custom tree structure
    res = {'name': 'genre', 'children': []}
    for name, leaf in tree.items():
        res['children'].append(build_leaf(name, leaf))

    # printing results into the terminal
    import json
    # print(json.dumps(res))
    with open('steam_reduced_with_genre_no_reviews.json', 'w') as f:
        json.dump(res, f)


# so let's roll
main()