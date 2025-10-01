const express = require("express");
const handlebars = require("express-handlebars");
const app = express();
const mongodbConnection = require("./configs/mongodb-connection");
const path = require("path");
const postService = require("./services/post-service");
const { ObjectId } = require("mongodb");

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
//미들웨어
app.use(async (req, res, next) => {
  try {
    const db = await mongodbConnection(); // require로 받은 변수명 사용
    req.collection = db.collection("post");
    next();
  } catch (err) {
    // Vercel 로그에서 에러를 쉽게 확인하기 위해 console.error 추가
    console.error("Database connection error in middleware:", err);
    next(err);
  }
});
//상세 페이지
app.get("/detail/:id",async (req,res)=>{
    const result=await postService.getDetailPost(req.collection,req.params.id);
    res.render("detail",{
        title: "자유 게시판",
        post: result.value,
    });
});

//패스워드 체크
app.post("/check-password",async(req,res)=>{
    const {id,password}=req.body;

    const post = await postService.getPostByIdAndPassword(req.collection,{id,password});
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
        const [posts,paginator] = await postService.list(req.collection,page,search);
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
    try {
        const post = req.body;
        const result = await postService.writePost(req.collection, post);
        res.redirect(`/detail/${result.insertedId}`);
  } catch (err) {
        console.error(err);
        res.status(500).send("DB insert error");
  }
});

//글 수정
app.get("/modify/:id", async(req,res)=>{
    const post = await postService.getPostById(req.collection,req.params.id);
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
    const result = postService.updatePost(req.collection,id,post);
    res.redirect(`/detail/${id}`);
});

//글 삭제
app.delete("/delete",async(req,res) =>{
    const {id,password} = req.body;
    try{
        const result = await req.collection.deleteOne({_id:ObjectId(id),password:password});
        if(result.deletedCount!==1) {
            console.log("삭제 실패");
            return res.json({isSuccess:false});
        }
        return res.json({isSuccess:true});
    }catch(error) {
        console.error(error);
        return res.json({isSuccess:false});
    }
});

//댓글 추가
app.post("/write-comment",async(req,res)=>{
    const { id,name,password,comment }=req.body;
    const post = await postService.getPostById(req.collection,id);

    if(post.comments){
        post.comments.push({
            idx: post.comments.length+1,
            name,
            password,
            comment,
            createdDt: new Date().toISOString(),
        });
    }else{
        post.comments =[
            {
                idx:1,
                name,
                password,
                comment,
                createdDt: new Date().toISOString(),
            },
        ];
    }

    postService.updatePost(req.collection,id,post);
    return res.redirect(`/detail/${id}`);
});

//댓글 삭제
app.delete("/delete-comment",async(req,res)=>{
    const { id,idx,password}=req.body;

    const post = await req.collection.findOne(
        {
            _id:ObjectId(id),
            comments: {$elemMatch: {idx: parseInt(idx),password}},
        },
        postService.projectionOption,
    );
    if(!post) {
        return res.json({isSuccess:false});
    }
    post.comments = post.comments.filter((comment)=>comment.idx!=idx);
    postService.updatePost(req.collection,id,post);
    return res.json({isSuccess:true});
});

// let collection;
// app.listen(3000, async() =>{
//     console.log("Server started");
//     const mongoClient = await mongodbConnection();
//     collection = mongoClient.db('board').collection("post");
//     console.log("MongoDB connected");
// });

module.exports = app;
