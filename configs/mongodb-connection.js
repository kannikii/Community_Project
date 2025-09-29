const {MongoClient} = require("mongodb");
const uri = process.env.MONGODB_URI;

module.exports=function(callback) {
    return MongoClient.connect(uri,callback);
}
