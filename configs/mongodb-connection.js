const {MongoClient} = require("mongodb");
const uri = "mongodb+srv://kwnnh0124_db_user:hyos0124@cluster0.4qhrcgb.mongodb.net/board";

module.exports=function(callback) {
    return MongoClient.connect(uri,callback);
}
