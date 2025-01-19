import instaloader
from pytz import timezone 
from datetime import datetime
L = instaloader.Instaloader()

username = 'dodoclub.in'  # Replace with your Instagram username
password = 'Raj@18110'  # Replace with your Instagram password
L.login(username, password)
# usermane = "pragati.vermaa"
usermane = "tripti.vermaa"

profile = instaloader.Profile.from_username(L.context, usermane,)

print("Username: ", profile.username)
print("Full name: ", profile.full_name)
print("Biography: ", profile.biography)
print("Followers: ", profile.followers)
print("Following: ", profile.followees)
print("Profile pic URL: ", profile.profile_pic_url)
print("External URL: ", profile.external_url)
print("profile post count:",profile.mediacount)
# Fetch and print media data
# print(profile.get_posts())
# count =0
# for post in profile.get_posts():
#     print("-----------------------------------------------------------------------------------------------------------------------------------")
#     print("\n")
#     print(count,")")
#     print("Post shortcode: ", post.shortcode)
#     print("post is viedo",post.is_video)
#     print("post view count",post.video_view_count)
#     print("Caption: ", post.caption)
#     print("URL: ", post.url)
#     print("Date: ", post.date)
#     print("Likes: ", post.likes)
#     print("Comments: ", post.comments)
#     print("Tagged user: ", post.tagged_users)
#     count+=1


ind_time = datetime.now(timezone("Asia/Kolkata")).strftime('%Y-%m-%d %H:%M:%S.%f')
print("user followers list",profile.get_followers())
count =0
print("start time",ind_time)

for profile in profile.get_followers():
    print("\n")
    print(count)
    print("Username: ", profile.username)
    print("Full name: ", profile.full_name)
    count +=1
print("end time",ind_time)

