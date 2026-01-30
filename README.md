# NoSQL Project — Social Feed

Short README with how to run and what's included.

## Run
- Backend: cd Backend
- Copy `.env.example` to `.env` and set `JWT_SECRET` and `MONGO_URI` if needed
- `npm install`
- `npm start`

Frontend: open `Frontend/index.html` in browser or serve via simple static server.

## Features
- Users, Posts, Comments
- JWT auth
- Aggregations: `/api/posts/stats`, `/api/users/top-followed`
- Admin panel: mass delete, bulk update, set user role
- OpenAPI: `/api/docs` (static JSON)

## Notes
- Post documents include embedded `authorSnapshot` as example of embedded data model (denormalization).