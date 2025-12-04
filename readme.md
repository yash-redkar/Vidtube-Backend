📺 Vidtube – A Full-Stack Video Streaming Platform (YouTube Clone)

A complete MERN-stack YouTube-like video platform with user authentication, video upload, playlists, likes, comments, subscriptions, dashboard, tweets, and more.
Built using Node.js, Express, Mongoose, JWT Auth, and Cloudinary for video hosting.

🚀 Features
🔐 Authentication & Authorization
1. User registration & login
2. Secure password hashing (bcrypt)
3. JWT-based authentication
4. Protected API routes

📹 Videos

1. Publish a video (Cloudinary upload)
2. Update and delete videos
3. View video by ID
4. Search, sort, paginate videos
5. Toggle publish / unpublish
6. Auto-increment views when video is opened
7. Get all videos of a specific user

👍 Likes

1. Like / Unlike Videos
2. Like / Unlike Comments
3. Get total likes on videos

💬 Comments

1. Create a comment
2. Edit & delete comments
3. Get all comments of a  video with pagination

📁 Playlists

1. Create playlist
2. Add / remove videos from playlist
3. Update and delete playlist
4. Get playlist by user

👤 Subscriptions

1. Subscribe / Unsubscribe a channel
2. Get subscribers of a user
3. Get channels a user subscribed to

📊 Dashboard

1. Channel statistics
   Total videos
   Total subscribers
   Total likes
   Total views
2. Channel uploaded videos

🐦 Tweets (Mini-Twitter Feature)

1. Create a tweet
2. Update & delete tweet
3. Get all tweets of a user

🏗️ Tech Stack
**Backend**
Node.js
Express.js
Mongoose
MongoDB
JWT Authentication
Cloudinary (uploads)
Multer (file handling)

**Utilities**
ApiError custom error handler
ApiResponse wrapper
asyncHandler for cleaner controllers

📂 Project Structure
Vidtube/
│
├── controllers/
├── models/
├── routes/
├── middlewares/
├── utils/
├── app.js
├── server.js
└── README.md

⚙️ API Endpoints Overview
🔐 Auth
POST /api/v1/auth/register  
POST /api/v1/auth/login  
GET  /api/v1/auth/logout  
GET  /api/v1/auth/current-user  

📹 Videos
POST /api/v1/videos/publish  
GET  /api/v1/videos/  
GET  /api/v1/videos/:videoId  
PATCH /api/v1/videos/:videoId  
DELETE /api/v1/videos/:videoId  
PATCH /api/v1/videos/toggle/publish/:videoId  

💬 Comments
POST /api/v1/comments/:videoId  
GET  /api/v1/comments/:videoId  
PATCH /api/v1/comments/:commentId  
DELETE /api/v1/comments/:commentId  

👍 Likes
POST /api/v1/likes/video/:videoId  
POST /api/v1/likes/comment/:commentId  
GET  /api/v1/likes/video/:videoId  

📁 Playlists
POST /api/v1/playlists/  
GET  /api/v1/playlists/:playlistId  
PATCH /api/v1/playlists/:playlistId  
DELETE /api/v1/playlists/:playlistId  

PATCH /api/v1/playlists/add/:videoId/:playlistId  
PATCH /api/v1/playlists/remove/:videoId/:playlistId  
GET   /api/v1/playlists/user/:userId  

👤 Subscriptions
POST /api/v1/subscriptions/c/:channelId  
GET  /api/v1/subscriptions/c/:channelId  
GET  /api/v1/subscriptions/u/:subscriberId  

📊 Dashboard
GET /api/v1/dashboard/stats  
GET /api/v1/dashboard/videos  

🐦 Tweets
POST   /api/v1/tweets/  
GET    /api/v1/tweets/user/:userId  
PATCH  /api/v1/tweets/:tweetId  
DELETE /api/v1/tweets/:tweetId  
