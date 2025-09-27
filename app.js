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


//상세 페이지
app.get("/detail/:id",async (req,res)=>{
    const result=await postService.getDetailPost(collection,req.params.id);
    res.render("detail",{
        title: "테스트 게시판",
        post: result.value,
    });
});
//패스워드 체크
app.post("/check-password",async(req,res)=>{
    const {id,password}=req.body;

    const post = await postService.getPostByIdAndPassword(collection,{id,password});
    if(!post){
        return res.status(404).json({isExist:false});

    }else{
        return res.json({isExist:true});
    }
});
//리스트 페이지
app.get("/",async(req,res)=>{
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    try{
        const [posts,paginator] = await postService.list(collection,page,search);
        res.render("home",{title: "자유게시판",search,paginator,posts});

    }catch(error) {
        console.error(error);
        res.render("home",{title: "자유게시판" });

    }
});
//글 쓰기
app.get("/write",(req,res)=>{
    res.render("write",{ title: "자유게시판" ,mode:"create"}); 
});
app.post("/write",async(req,res)=> {
    const post = req.body;
    const result = await postService.writePost(collection,post);
    res.redirect(`/detail/${result.insertedId}`);
});

//글 수정
app.get("/modify/:id", async(req,res)=>{
    const post = await postService.getPostById(collection,req.params.id);
    console.log(post);
    res.render("write",{ title: "자유게시판",mode: "modify", post});
});
app.post("/modify/",async(req,res)=>{
    const {id,title,writer,password,content}=req.body;

    const post = {
        title,
        writer,
        password,
        content,
        createdDt: new Date().toISOString(),
    };
    const result = postService.updatePost(collection,id,post);
    res.redirect(`/detail/${id}`);
});

let collection;
app.listen(3000, async() =>{
    console.log("Server started");
    const mongoClient = await mongodbConnection();
    collection = mongoClient.db('board').collection("post");
    console.log("MongoDB connected");
});
