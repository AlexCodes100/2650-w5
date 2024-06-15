import "dotenv/config";

import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGOURI;

const client = new MongoClient(uri, {
  // serverApi: {
  //   version: ServerApiVersion.v1,
  //   strict: true,
  //   deprecationErrors: true,
  // }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Establish and verify connection
    console.log("Connected successfully to the MongoDB database");

    const db = client.db(process.env.MONGODBNAME);

    const movies = await db
        .collection("movies")
        .find({ title: { $regex: "Despicable", $options: 'i' } })
        .project({ title: 1 })
        .toArray();

    console.log(movies);

    console.log("All movies after the year 2000 ---------->");
    const moviesAfter2000 = await e1a(db);
    console.log(moviesAfter2000);

    console.log("Distinct languages ---------->");
    const distinctLanguages = await e1b(db);
    console.log(distinctLanguages);

    console.log("PG-13 movies casting Ryan Gosling ---------->");
    const goslingMovies = await e1c(db);
    console.log(goslingMovies);

    console.log("Number of movies per genre ---------->");
    const moviesPerGenre = await e1d(db);
    console.log(moviesPerGenre);

    console.log("Insert a new movie ---------->");
    const newMovie = await e1e(db);
    console.log(newMovie);

  } finally {
    await client.close();
  }
}
run().catch(console.dir);

async function e1a(db) {
  try {
    const moviesAfter = await db
        .collection("movies")
        .find({ year: { $gt: 2000 } })
        .project({ title: 1, year: 1 })
        .toArray();
    return moviesAfter;
  } catch (err) {
    console.error("Failed to fetch movies", err);
  }
};

async function e1b(db) {
  try {
    const distinctLanguages = await db
        .collection("movies")
        .distinct("languages");
    return distinctLanguages;
  } catch (err) {
    console.error("Failed to fetch distinct languages", err);
  }
};

async function e1c(db) {
  try {
    const goslingMovies = await db
      .collection("movies")
      .find({
        rated: "PG-13",
        cast: { $in: ["Ryan Gosling"] }
      })
      .sort({ release_date: 1 })
      .project({ title: 1, release_date: 1 })
      .toArray();
    return goslingMovies;
  } catch (err) {
    console.error("Failed to fetch PG-13 movies casting Ryan Gosling", err);
  }
}

async function e1d(db) {
  try {
    const moviesPerGenre = await db
      .collection("movies")
      .aggregate([
        { $unwind: "$genres" },
        { $group: { _id: "$genres", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
      .toArray();
    return moviesPerGenre;
  } catch (err) {
    console.error("Failed to fetch number of movies per genre", err);
  }
}

async function e1e(db) {
  try {
    const newMovie = {
      title: "Attempting to catch up to 2650",
      directors: ["Ricardo Mendez"],
      year: 2024,
      rated: "G",
      genres: ["Horror"],
      cast: ["Ricardo Mendez", "The Professor", "The TAs", "The Students"],
    };
    const result = await db.collection("movies").insertOne(newMovie);
    return { insertedId: result.insertedId, ...newMovie };;
  } catch (err) {
    console.error("Failed to insert movie", err);
  }
}
