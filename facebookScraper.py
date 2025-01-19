# from facebook_scraper import get_profile
# from facebook_scraper import get_posts

# # Function to scrape Facebook profile data
# def get_facebook_profile(username):
#     try:
#         profile = get_profile(username)
#         return profile
#     except Exception as e:
#         print(f"Error fetching profile: {e}")
#         return None

# # Example usage
# username = 'zuck'  # Replace with the Facebook username of the profile you want to scrape
# profile_data = get_facebook_profile(username)

# print(f"Name: {profile_data.get('Name')}")
# print(f"Work: {profile_data.get('Work')}")
# print(f"Education: {profile_data.get('Education')}")
# print(f"Location: {profile_data.get('Living')}")
# print(f"Basic Info: {profile_data.get('Basic Info')}")
# print(f"Contact Info: {profile_data.get('Contact Info')}")
# print(f"Name: {profile_data.get('Name')}")
# print(f"Total Friends: {profile_data.get('Friends')}")
# print(f"Total Followers: {profile_data.get('Followers')}")


# def get_facebook_posts(page_name):
#     posts = []
#     for post in get_posts(page_name, pages=1):  # pages=1 limits to 1 page of results
#         posts.append(post)
#     return posts ,len(posts)

# # Example usage
# page_name = 'nasa'  # Replace with the Facebook page name you want to scrape
# posts_data, post_count = get_facebook_posts(page_name)
# print(f"Total Posts: {post_count}")

# for post in posts_data:
#     print(f"Post ID: {post['post_id']}")
#     print(f"Text: {post['text']}")
#     print(f"Time: {post['time']}")
#     print(f"Likes: {post['likes']}")
#     print(f"Comments: {post['comments']}")
#     print(f"Shares: {post['shares']}")
#     print(f"Post URL: {post['post_url']}")
#     print()


from facebook_scraper import get_profile, get_posts

# Function to get Facebook profile data
def get_facebook_profile(username):
    try:
        profile = get_profile(username, cookies="cookies.txt")
        return profile
    except Exception as e:
        print(f"Error fetching profile: {e}")
        return None

# Function to get Facebook posts and count them
def get_facebook_posts(username, pages=None):
    try:
        posts = list(get_posts(username, pages=pages))
        return posts
    except Exception as e:
        print(f"Error fetching posts: {e}")
        return []

# Example usage
# username = 'hariom.kuswaha.3133'
username = 'PragatiVermavp'  # Replace with the Facebook page username you want to scrape
profile_data = get_facebook_profile("zucks")

if profile_data:
    print(f"Page Name: {profile_data.get('Name', 'N/A')}")
    print(f"Total Followers: {profile_data.get('Followers', 'N/A')}")
    print(f"Name: {profile_data.get('Name')}")
    print(f"Work: {profile_data.get('Work')}")
    print(f"Education: {profile_data.get('Education')}")
    print(f"Location: {profile_data.get('Living')}")
    print(f"Basic Info: {profile_data.get('Basic Info')}")
    print(f"Contact Info: {profile_data.get('Contact Info')}")
    print(f"Name: {profile_data.get('Name')}")
    print(f"Total Friends: {profile_data.get('Friends')}")
    print(f"Total Followers: {profile_data.get('Followers')}")

    posts = get_facebook_posts(username, pages=None)  # Adjust pages as needed
    print(f"Total Posts: {len(posts)}")

    for post in posts:
        print("Post Details:")
        print(f"Post ID: {post['post_id']}")
        print(f"Text: {post['text']}")
        print(f"Time: {post['time']}")
        print(f"Likes: {post['likes']}")
        print(f"Comments: {post['comments']}")
        print(f"Shares: {post['shares']}")
        print(f"Post URL: {post['post_url']}")
        print()
else:
    print("Failed to retrieve profile data.")


# from facebook_scraper import get_profile

# print(get_profile("zuck"))