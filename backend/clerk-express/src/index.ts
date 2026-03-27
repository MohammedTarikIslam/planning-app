import 'dotenv/config'
import path from 'path'
import express from 'express'
import { clerkMiddleware, clerkClient, requireAuth, getAuth } from '@clerk/express'
import db from './db.js'


const app = express()
const PORT = 3000
const publicPath = path.join(process.cwd(), "public");

app.use(express.json());
app.use(clerkMiddleware())
app.use(express.static(publicPath));

console.log("PUBLISHABLE:", process.env.CLERK_PUBLISHABLE_KEY);
console.log("SECRET:", process.env.CLERK_SECRET_KEY ? "loaded" : "missing");



  
// This is the default route that gives the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/public", (req, res) => {
  res.json({ message: "This is a public route" });
});

app.get("/api/protected", requireAuth({ signInUrl: "/sign-in" }), async(req, res) => {
  const { userId } = getAuth(req);
  const user = await clerkClient.users.getUser(userId);

  // res.json({
  //   message: "You are signed in",
  //   userId: auth.userId,
  // });
  return res.json({ user })
});

app.get("/api/check-auth", (req, res) => {
  const auth = getAuth(req);
  res.json({
    userId: auth.userId ?? null,
    sessionId: auth.sessionId ?? null,
  });
});

//load function
app.get("/api/plans/me", requireAuth(), (req, res) => {
  try{
  
    // const auth = getAuth(req);
    // const userId = auth.userId;
    
    const {userId} = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const stmt = db.prepare(`
      SELECT
      test,
      accommodationcost,
      travelcost,
      activitiescost,
      numberofpeople,
      traveldesc,
      hoteldesc,
      fooddesc,
      activitiesdesc
      FROM plans
      WHERE user_id = ?
      `);
      
      const plan = stmt.get(userId);
      
      if (!plan) {
        return res.json(null);
      }
      
      return res.json(plan);
  } 
  catch (error) {
    console.error("Error fetching plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//save function
app.post("/api/plans/save", requireAuth(), (req, res) => {
  try{
    // const auth = getAuth(req);
    // const userId = auth.userId;
    
    const {userId} = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
      
      
    const {
      test,
      accommodationcost,
      travelcost,
      activitiescost,
      numberofpeople,
      traveldesc,
      hoteldesc,
      fooddesc,
      activitiesdesc,
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO plans (
        user_id,
        test,
        accommodationcost,
        travelcost,
        activitiescost,
        numberofpeople,
        traveldesc,
        hoteldesc,
        fooddesc,
        activitiesdesc,
        updatedate
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
      test = excluded.test,
      accommodationcost = excluded.accommodationcost,
      travelcost = excluded.travelcost,
      activitiescost = excluded.activitiescost,
      numberofpeople = excluded.numberofpeople,
      traveldesc = excluded.traveldesc,
      hoteldesc = excluded.hoteldesc,
      fooddesc = excluded.fooddesc,
      activitiesdesc = excluded.activitiesdesc,
      updatedate = CURRENT_TIMESTAMP
      `);
      
    stmt.run(
      userId,
      test ?? "",
      Number(accommodationcost) || 0,
      Number(travelcost) || 0,
      Number(activitiescost) || 0,
      Number(numberofpeople) || 1,
      traveldesc ?? "",
      hoteldesc ?? "",
      fooddesc ?? "",
      activitiesdesc ?? ""
    );
      
    return res.json({ ok: true });
  } 
  catch (error) {
    console.error("Error saving plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
  
  
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})