const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const BlogPost = require('./models/BlogPost.js')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const ejs = require('ejs')
const newPostController = require('./controllers/newPost')
const newUserController = require('./controllers/newUser')
const storeUserController = require('./controllers/storeUser')
const loginController = require('./controllers/login')
const loginUserController = require('./controllers/loginUser')
const expressSession = require('express-session')
const authMiddleware = require('./middleware/authMiddleware')
const redirectIfAuthenticatedMiddleware = require('./middleware/redirectIfAuthenticatedMiddleware')
const logoutController = require('./controllers/logout')
const flash = require('connect-flash')

mongoose.set('strictQuery', false)
// mongoose.connect('mongodb://localhost/my_database', {useNewUrlParser: true})
mongoose.connect('mongodb+srv://blog:D8UAXDCCj3abLZGw@cluster0.8suwqlo.mongodb.net/my_database', {useNewUrlParser: true})

const validateMiddleWare = (req,res,next)=>{
    if(req.files == null || req.body.title == null || req.files.image == null){
        return res.redirect('/posts/new')
    }
    next()
}
const app = express()
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(fileUpload())
app.use('/posts/store',validateMiddleWare)
app.use(expressSession({
    secret: 'keyboard cat'
}))
app.use(flash())    

app.set('view engine','ejs')

app.get('/',async (req,res)=>{
    const blogposts = await BlogPost.find({}).populate('userid');
    console.log(req.session)
    res.render('index',{
        blogposts
    });
})

app.get('/about',(req,res)=>{
    res.render('about');
})

app.get('/contact',(req,res)=>{
    res.render('contact');
}) 

app.get('/post/:id',async (req,res)=>{
    const blogpost = await BlogPost.findById(req.params.id).populate('userid');
    res.render('post',{
        blogpost
    })
})

app.get('/posts/new', authMiddleware, newPostController)

app.post('/posts/store', authMiddleware, (req,res)=>{
    let image = req.files.image;
    image.mv(path.resolve(__dirname,'public/img',image.name), async (error) => {
        if (error) {
            console.log(error);
            res.send('An error occurred while uploading the image, please try again.');
        } else {
            await BlogPost.create({
                ...req.body,
                image: '/img/' + image.name,
                userid: req.session.userId
            })
            res.redirect('/')
        }
    })
})

app.get('/auth/register', redirectIfAuthenticatedMiddleware, newUserController)

app.post('/users/register', redirectIfAuthenticatedMiddleware, storeUserController)

app.get('/auth/login', redirectIfAuthenticatedMiddleware, loginController);

app.post('/users/login', redirectIfAuthenticatedMiddleware, loginUserController)

global.loggedIn = null;

app.use("*", (req, res, next) => {
    loggedIn = req.session.userId;
    next()
});

app.get('/auth/logout', logoutController)

app.use((req, res) => res.render('notfound'))

let port = process.env.PORT;
if (port == null || port === "") {
    port = 4000;
}

app.listen(port, () => {
    console.log('App listening...');
});