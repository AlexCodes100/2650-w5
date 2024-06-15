import "dotenv/config";
import mongoose from "mongoose";

async function connectToDatabase() {
  const uri = process.env.MONGOURI;

  if (!uri) {
    throw new Error("Missing MONGOURI environment variable");
  }

  await mongoose.connect(uri);
}

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: Number, required: true },
  director: { type: String, required: true },
  genre: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Movie = mongoose.model("Movie", movieSchema);

async function getOneMovie() {
  try {
    const movies = await Movie.findOne({});
    console.log("A movie", movies);
  } catch (err) {
    console.error("Error fetching movies:", err.message);
  }
}

async function e2a() {
    try {
      const movies = await Movie.find({ year: { $gt: 2000 } });
      return movies;
    } catch (err) {
      console.error("Error fetching movies:", err.message);
    }
  }

async function e2b() {
    try {
      const languages = await Movie.distinct("languages");
      return languages;
    } catch (err) {
      console.error("Error fetching distinct languages:", err.message);
    }
  }
  

  async function e2c() {
    try {
      const goslingMovies = await Movie.find({
        rated: "PG-13",
        cast: { $in: ["Ryan Gosling"] }
      }).sort({ year: 1 });
      return goslingMovies;
    } catch (err) {
      console.error("Error fetching PG-13 movies casting Ryan Gosling:", err.message);
    }
  }
  

  async function e2d() {
    try {
      const moviesPerGenre = await Movie.aggregate([
        { $unwind: "$genres" },
        { $group: { _id: "$genres", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      return moviesPerGenre;
    } catch (err) {
      console.error("Error fetching number of movies per genre:", err.message);
    }
  }
  

  async function e2e() {
    try {
      const newMovie = {
        title: "Really trying to catch up to 2650",
        year: 2024,
        director: "Ricardo Mendez",
        genre: "Horror",
      };
      const result = await Movie.create(newMovie);
      return result;
    } catch (err) {
      console.error("Error inserting movie:", err.message);
    }
  }

  async function e2g() {
    try {
      const RicardoMovies = await Movie.find({
        director: "Ricardo Mendez"
      }).sort({ year: 1 });
      return RicardoMovies;
    } catch (err) {
      console.error("Error fetching movies where Ricardo Mendez is the Director:", err.message);
    }
  }

async function main() {
  try {
    await connectToDatabase();
    await getOneMovie();

    console.log("All movies after year 2000 ----->");
    const moviesAfter2000 = await e2a();
    console.log(moviesAfter2000);

    console.log("All distinct languages in all movies ----->");
    const distinctLanguages = await e2b();
    console.log(distinctLanguages);

    console.log("PG-13 movies casting Ryan Gosling ----->");
    const goslingMovies = await e2c();
    console.log(goslingMovies);

    console.log("Number of movies per genre ----->");
    const moviesPerGenre = await e2d();
    console.log(moviesPerGenre);

    console.log("Inserting a new movie ----->");
    const newMovie = await e2e();
    console.log(newMovie);

    console.log("All movies directed by Ricardo Mendez ----->");
    const RicardoMovies = await e2g();
    console.log(RicardoMovies);



  } catch (err) {
    console.log(`It blew up! ${err}`);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}

main();
