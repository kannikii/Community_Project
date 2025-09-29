const {MongoClient} = require("mongodb");
const uri = process.env.MONGODB_URI;

let client;
let db;

async function connectDB() {
  if (db) return db;

  if (!client) {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
  }

  db = client.db("board");
  return db;
}

module.exports = connectDB;