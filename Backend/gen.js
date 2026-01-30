const fs = require("fs");
const { ObjectId } = require("mongodb");


const users = [];
const posts = [];
const comments = [];

// 1. Users
for (let i = 1; i <= 50; i++) {
  users.push({
    _id: new ObjectId(),
    username: `user${i}`,
    email: `user${i}@mail.com`,
    password: "$2b$10$hash",
    bio: "Seed user",
    followers: [],
    following: [],
    createdAt: new Date()
  });
}

// 2. Posts
for (let i = 0; i < 50; i++) {
  posts.push({
    _id: new ObjectId(),
    author: users[i]._id,
    content: `Post #${i + 1}`,
    image: null,
    likes: [],
    commentsCount: 1,
    createdAt: new Date(),
    __v: 0
  });
}

// 3. Comments
for (let i = 0; i < 50; i++) {
  comments.push({
    _id: new ObjectId(),
    post: posts[i]._id,
    author: users[(i + 1) % 50]._id,
    text: `Comment #${i + 1}`,
    createdAt: new Date(),
    __v: 0
  });
}

fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));
fs.writeFileSync("comments.json", JSON.stringify(comments, null, 2));
