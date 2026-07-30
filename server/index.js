import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
const port = Number(process.env.PORT || 10000);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const sessionSecret = process.env.SESSION_SECRET || "local-development-secret";
const ownerId = "primary-owner";
const cookieName = "hemlist_session";
const mongoClient = new MongoClient(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017");
let items;
let settings;

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: "12mb" }));

function sign(value) {
  return crypto.createHmac("sha256", sessionSecret).update(value).digest("hex");
}

function createSession() {
  const payload = Buffer.from(JSON.stringify({ ownerId, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function getSession(request) {
  const raw = request.headers.cookie?.split(";").map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.split("=")[1];
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  const expected = sign(payload);
  if (!payload || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString());
    return session.expiresAt > Date.now() ? session : null;
  } catch { return null; }
}

function requireAuth(request, response, next) {
  if (!getSession(request)) return response.status(401).json({ error: "Authentication required" });
  next();
}

async function getItems() {
  if (!items) {
    await mongoClient.connect();
    const database = mongoClient.db(process.env.MONGODB_DB || "hemlist");
    items = database.collection("items");
    settings = database.collection("settings");
    await items.createIndex({ ownerId: 1, createdAt: -1 });
  }
  return items;
}

function cookieOptions() {
  return `Path=/; HttpOnly; SameSite=${process.env.NODE_ENV === "production" ? "None; Secure" : "Lax"}; Max-Age=2592000`;
}

app.get("/api/health", (request, response) => response.json({ ok: true, service: "hemlist-api" }));

app.post("/api/auth/login", (request, response) => {
  if (!process.env.APP_PASSWORD) return response.status(500).json({ error: "APP_PASSWORD is not configured" });
  if (request.body?.password !== process.env.APP_PASSWORD) return response.status(401).json({ error: "Incorrect password" });
  response.setHeader("Set-Cookie", `${cookieName}=${createSession()}; ${cookieOptions()}`);
  response.json({ authenticated: true });
});

app.post("/api/auth/logout", (request, response) => {
  response.setHeader("Set-Cookie", `${cookieName}=; ${cookieOptions()}; Max-Age=0`);
  response.json({ authenticated: false });
});

app.get("/api/auth/me", (request, response) => response.json({ authenticated: Boolean(getSession(request)) }));

app.get("/api/items", requireAuth, async (request, response, next) => {
  try { response.json(await (await getItems()).find({ ownerId }).sort({ createdAt: -1 }).toArray()); }
  catch (error) { next(error); }
});

app.get("/api/rooms", requireAuth, async (request, response, next) => {
  try {
    await getItems();
    const record = await settings.findOne({ ownerId, type: "rooms" });
    response.json(record?.rooms || ["Living room", "Bedroom", "Kitchen", "Bathroom", "Garage", "Office", "Outdoor", "Other"]);
  } catch (error) { next(error); }
});

app.put("/api/rooms", requireAuth, async (request, response, next) => {
  try {
    const rooms = [...new Set((request.body?.rooms || []).map(room => String(room).trim()).filter(Boolean))].slice(0, 50);
    await settings.updateOne({ ownerId, type: "rooms" }, { $set: { ownerId, type: "rooms", rooms, updatedAt: new Date().toISOString() } }, { upsert: true });
    response.json(rooms);
  } catch (error) { next(error); }
});

app.post("/api/items", requireAuth, async (request, response, next) => {
  try {
    const item = { ...request.body, ownerId, createdAt: request.body.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    await (await getItems()).insertOne(item);
    response.status(201).json(item);
  } catch (error) { next(error); }
});

app.put("/api/items/:id", requireAuth, async (request, response, next) => {
  try {
    const update = { ...request.body, ownerId, updatedAt: new Date().toISOString() };
    delete update._id;
    const removableFields = ["photoData", "photoUrl", "photoName", "receiptData", "receiptName"];
    const unset = Object.fromEntries(removableFields.filter(field => !update[field]).map(field => [field, ""]));
    removableFields.forEach(field => { if (!update[field]) delete update[field]; });
    const updateDocument = { $set: update };
    if (Object.keys(unset).length) updateDocument.$unset = unset;
    const result = await (await getItems()).findOneAndUpdate({ id: request.params.id, ownerId }, updateDocument, { returnDocument: "after" });
    if (!result) return response.status(404).json({ error: "Item not found" });
    response.json(result);
  } catch (error) { next(error); }
});

app.delete("/api/items/:id", requireAuth, async (request, response, next) => {
  try { await (await getItems()).deleteOne({ id: request.params.id, ownerId }); response.status(204).end(); }
  catch (error) { next(error); }
});

app.use((error, request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Something went wrong" });
});

app.listen(port, () => console.log(`HEMLIST API listening on port ${port}`));
