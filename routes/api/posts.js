const express  = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const auth = require('../../middleware/auth')
const User = require('../../models/user')
const Post = require('../../models/post')
const Profile = require('../../models/profile')

//create a post
router.post('/', [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({msg: errors.array()});
    }

    try {
        // console.log("r1");
        const user = await User.findById(req.user.id).select('-password');
        // console.log("r1");
        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        })
        // console.log("r1");
        
        const post = await newPost.save();

        res.json(post);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('server error')
    }
})

//get all posts
router.get('/', auth, async(req,res) => {
    try {
        const posts = await Post.find().sort({date:-1});
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('server error');
    }
})


//get post by its id
router.get('/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.json(post);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('server error');
    }
})


//delete a post by its id
router.delete('/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(post.user.toString()!==req.user.id)
        {
            return res.status(401).json({msg:"user not Authorized"});
        }

        await post.remove();

        res.json({msg:'Post removed'});

    } catch (error) {
        console.error(error.message);
        res.status(500).send('server error');
    }
})


//like a post
router.put('/like/:id', auth, async(req, res)=>{
    try {
        const post = await Post.findById(req.params.id)

        if(post.likes.filter(like=> like.user.toString()===req.user.id).length>0)
        {
            return res.status(400).json({msg:'Post already liked'});
        }

        post.likes.unshift({user:req.user.id});

        await post.save();
        
        res.json(post.likes);
        
    } catch (error) {
        console.error(error.message);
        res.status(500).send('server error');
    }
})


//unlike a post
router.put('/unlike/:id', auth, async(req, res)=>{
    try {
        const post = await Post.findById(req.params.id)

        if(post.likes.filter(like=> like.user.toString()===req.user.id).length===0)
        {
            return res.status(400).json({msg:'Post have not been liked yet'});
        }

        const removeindex = post.likes.map(like=>like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeindex,1);

        await post.save();
        
        res.json(post.likes);
        
    } catch (error) {
        console.error(error.message);
        res.status(500).send('server error');
    }
})


//add comments
router.post('/comment/:id', [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({msg: errors.array()});
    }

    try {
        // console.log("r1");
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);
        // console.log("r1");
        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };

        post.comment.unshift(newComment);
        await post.save();

        res.json(post);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('server error')
    }
})

//delete comment
router.delete('/comment/:id/:comment_id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const comment = post.comment.find(comment => comment.id === req.params.comment_id);


        if(!comment)
        {
            return res.status(404).json({msg:"Comment does not exist"});
        }

        if(comment.user.toString() !== req.user.id)
        {
            return res.status(401).json({msg:"User not authorized"});
        }

        const removeindex = post.comment.map(comment=>comment.user.toString()).indexOf(req.user.id);
        post.comment.splice(removeindex, 1);
        await post.save();

        res.json(post.comment);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('server error');
    }
})




//exporting router
module.exports = router;