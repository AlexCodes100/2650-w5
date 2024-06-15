import "dotenv/config.js";
import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import mongoose from "mongoose";
import { createClient } from "redis";
import indexRouter from "./routes/index.js";
import notesRouter from "./routes/notes.js";

// Constants
const port = process.env.PORT || 3000;

// Create http server
const app = express();

// Connect to MongoDB
async function connectToDatabase() {
  const uri = process.env.MONGOURI;

  if (!uri) {
    throw new Error("Missing MONGOURI environment variable");
  }

  await mongoose.connect(uri);
}

connectToDatabase().catch((err) => {
  console.error("Failed to connect to MongoDB:", err.message);
  process.exit(1);
});

// Define movie schema and model
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: Number, required: true },
  director: { type: String, required: true },
  genre: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Movie = mongoose.model("Movie", movieSchema);

// Connect to Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.on("error", (err) => console.error("Redis Client Error", err));
await redisClient.connect();

// Middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join("public")));

// Routes
app.use("/", indexRouter);
app.use("/notes", notesRouter);

// GET /movies: Get the first 10 Movies
app.get("/movies", async (req, res) => {
  const cacheKey = "movies";
  const bypassCache = req.query.bypassCache === "true";

  try {
    if (!bypassCache) {
      const cachedMovies = await redisClient.get(cacheKey);
      if (cachedMovies) {
        return res.json(JSON.parse(cachedMovies));
      }
    }

    const movies = await Movie.find().limit(10).select("_id title year");
    if (!bypassCache) {
      await redisClient.set(cacheKey, JSON.stringify(movies), {
        EX: 60 * 60, // 1 hour expiration
      });
    }
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /movie/:id: Get one Movie by its ID
app.get("/movie/:id", async (req, res) => {
  const cacheKey = `movie:${req.params.id}`;
  const bypassCache = req.query.bypassCache === "true";

  try {
    if (!bypassCache) {
      const cachedMovie = await redisClient.get(cacheKey);
      if (cachedMovie) {
        return res.json(JSON.parse(cachedMovie));
      }
    }

    const movie = await Movie.findById(req.params.id).select("_id title year");
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    if (!bypassCache) {
      await redisClient.set(cacheKey, JSON.stringify(movie), {
        EX: 60 * 60, // 1 hour expiration
      });
    }

    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /movie/:id: Update one Movie's title by its ID
app.patch("/movie/:id", async (req, res) => {
  const cacheKey = `movie:${req.params.id}`;
  const bypassCache = req.query.bypassCache === "true";

  try {
    const { title } = req.body;
    const movie = await Movie.findByIdAndUpdate(req.params.id, { title }, { new: true }).select("_id title year");
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    if (!bypassCache) {
      await redisClient.set(cacheKey, JSON.stringify(movie), {
        EX: 60 * 60, // 1 hour expiration
      }); // Write-through caching
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /movie/:id: Delete a movie by its ID
app.delete("/movie/:id", async (req, res) => {
  const cacheKey = `movie:${req.params.id}`;
  const bypassCache = req.query.bypassCache === "true";

  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    if (!bypassCache) {
      await redisClient.del(cacheKey); // Invalidate the cache
    }
    res.json({ message: "Movie deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
