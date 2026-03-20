# Numberly

Numberly is a maths learning app for autistic children. This version now includes:

- A real account flow with register and login
- A MySQL-backed Node API
- Automatic database creation on server start
- Generated lesson questions instead of one fixed question
- Account, leaderboard, and settings pages wired to stored data

## Setup

1. Copy [.env.example](/D:/Github/Numberly/.env.example) to `.env`.
2. Fill in your MySQL host details:
   `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
3. Install dependencies:
   `npm install`
4. Start the backend API:
   `npm run server`
5. In a second terminal, start the frontend:
   `npm run dev`

The API will create the database named in `MYSQL_DATABASE` if it does not exist, then create the required tables from [server/schema.sql](/D:/Github/Numberly/server/schema.sql).

## Main Pages

- Learn page with dynamic lessons
- Account page for learner profile
- Settings page for sensory/routine preferences
- Leaderboard page backed by MySQL

## Notes

- Frontend API calls are proxied through Vite to `http://localhost:3001`.
- Question generation is handled locally in [server/questions.mjs](/D:/Github/Numberly/server/questions.mjs), so you do not need a third-party question API.
- If you want to use your hosted MySQL server, only the `.env` values need to change.
