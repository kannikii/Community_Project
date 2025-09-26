const express = require("express");
const handlebars = require("express-handlebars");
const app = express();
const mongodbConnection = require("./configs/mongodb-connection");
const path = require("path");
const postService = require("./services/post-service");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.engine(
    "handlebars",
    handlebars.create({
        helpers: require("./configs/handlebars-helper"),
    }).engine,
);

app.set("view engine","handlebars");
app.set("views",__dirname + "/views");

app.get("/",(req,res)=>{
    res.render("home",{ title: "BOARDS", message: "Nice to Meet you!"});
});
app.get("/write",(req,res)=>{
    res.render("write",{ title: "테스트 게시판" }); 
});
app.get("/detail/:id",async (req,res)=>{
    res.render("detail",{
        title: "테스트 게시판",
    });
});
//리스트 페이지
app.get("/",async(req,res)=>{
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    try{
        const [posts,paginator] = await postService.list(collection,page,search);
        res.render("home",{title: "테스트 게시판",search,paginator,posts});

    }catch(error) {
        console.error(error);
        res.render("home",{title: "테스트 게시판" });
    }
});

//글쓰기
app.post("/write",async(req,res)=> {
    const post = req.body;
    const result = await postService.writePost(collection,post);
    res.redirect(`/detail/${result.insertedId}`);
});

let collection;
app.listen(3000, async() =>{
    console.log("Server started");
    const mongoClient = await mongodbConnection();
    collection = mongoClient.db('board').collection("post");
    console.log("MongoDB connected");
});
