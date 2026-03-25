import 'dotenv/config'
import path from 'path'
import express from 'express'
import { clerkMiddleware, clerkClient, requireAuth, getAuth } from '@clerk/express'
import db from './db.js'


const app = express()
const PORT = 3000

app.use(express.json());
app.use(clerkMiddleware())

console.log("PUBLISHABLE:", process.env.CLERK_PUBLISHABLE_KEY);
console.log("SECRET:", process.env.CLERK_SECRET_KEY ? "loaded" : "missing");

// // Use requireAuth() to protect this route
// // If user isn't authenticated, requireAuth() will redirect back to the homepage
// app.get('/protected', requireAuth(), async (req, res) => {
//   // Use `getAuth()` to get the user's `userId`
//   const { userId } = getAuth(req)
  
//   // Use Clerk's JS Backend SDK to get the user's User object
//   const user = await clerkClient.users.getUser(userId)
  
//   return res.json({ user })
// })

app.get("/api/protected", requireAuth(), (req, res) => {
  const auth = getAuth(req);
  res.json({
    message: "You are signed in",
    userId: auth.userId,
  });
});

app.get("/api/check-auth", (req, res) => {
  const auth = getAuth(req);
  res.json({
    userId: auth.userId ?? null,
    sessionId: auth.sessionId ?? null,
  });
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

// This is hte default route that gives the home page

// app.get("/", (req, res) => {
//   res.send("Backend is running");
// });

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/public", (req, res) => {
  res.json({ message: "This is a public route" });
});

app.use(express.static(path.join(process.cwd(), "public")));