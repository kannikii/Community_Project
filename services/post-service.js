const paginator = require("../utils/paginator");
const {ObjectId} = require("mongodb");

async function writePost(collection,post) {
    post.hits=0;
    post.createdDt = new Date().toISOString();
    return await collection.insertOne(post);
}

async function list(collection,page,search) {
    const perPage = 10;
    const query = { title: new RegExp(search,"i")};
    const cursor = collection
        .find(query)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .sort({ createdDt: -1 });
    const totalCount = await collection.countDocuments(query);
    const posts = await cursor.toArray();

    const paginatorObj = paginator({totalCount,page,perPage:perPage});
    return [posts,paginatorObj];
}

const projectionOption ={
    projection: {
        password: 0,
        "comments.password": 0,
    },
};

async function getDetailPost(collection,id) {
    return await collection.findOneAndUpdate(
        {_id: ObjectId(id)},    //filter
        { $inc: {hits:1}},      //update
        projectionOption);      //options
        //ip나 device 검사해서 어뷰징 막는 기능 추가 가능
}

async function getPostByIdAndPassword(collection,{id,password}) {
    return await collection.findOne(
        {_id: ObjectId(id),
        password:password},
        projectionOption);
}

async function getPostById(collection,id) {
    return await collection.findOne({_id:ObjectId(id)},projectionOption);
}

async function updatePost(collection,id,post) {
    const toUpdatePost = {
        $set: {
            ...post,
        },
    };
    return await collection.updateOne({_id:ObjectId(id)},toUpdatePost);
}

module.exports ={
    list,
    writePost,
    getDetailPost,
    getPostById,
    getPostByIdAndPassword,
    updatePost,
};