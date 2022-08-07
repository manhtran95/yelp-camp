const { render } = require('ejs')
const express = require('express')
const mongoose = require('mongoose')
const ejsMate = require('ejs-mate')
const { campgroundSchema, reviewSchema } = require('./schemas.js')
const path = require('path')
const methodOverride = require('method-override')
const Campground = require('./models/campground')
const Product = require('../32_Mongoose_Express/models/product')
const catchAsync = require('./utils/catchAsync')
const ExpressError = require('./utils/ExpressError')
const Joi = require('joi')
const Review = require('./models/review')

mongoose.connect('mongodb://localhost:27017/yelp-camp')

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Database connected")
});

const app = express()

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body)  
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next()
    }
}
const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next()
    }
}

// CREATE
app.post('/campgrounds', validateCampground, catchAsync(async (req, res, next) => {
    const campground = new Campground(req.body.campground)
    await campground.save()
    res.redirect(`/campgrounds/${campground._id}`)
}))
// NEW
app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/new')
})

// GET ALL
app.get('/campgrounds', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index', { campgrounds })
}))
// GET ONE
app.get('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findById(id).populate('reviews')
    res.render('campgrounds/show', { campground })
}))

// EDIT
app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
    const { id } = req.params
    console.log(id)
    const campground = await Campground.findById(id)
    console.log(campground.title)
    res.render('campgrounds/edit', { campground })
}))
// PATCH
app.patch('/campgrounds/:id', validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params
    const campgroundBody = req.body.campground
    const campground = await Campground.findByIdAndUpdate(id, campgroundBody, { runValidators: true, new: true })
    res.redirect(`/campgrounds/${campground._id}`)
}))

// DELETE
app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    await Campground.findByIdAndDelete(id)
    res.redirect('/campgrounds')
}))

// Create Review
app.post('/campgrounds/:id/reviews', validateReview, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    const review = new Review( req.body.review)
    campground.reviews.push(review)
    review.save()
    campground.save()
    res.redirect(`/campgrounds/${campground._id}`)
}))

app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const {id, reviewId} = req.params
    const campground = await Campground.findByIdAndUpdate(id, {$pull: {
        reviews: reviewId
    }})
    await Review.findByIdAndDelete(reviewId)
    res.redirect(`/campgrounds/${id}`)
}))

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err
    if (!err.message) err.message = 'Something went wrong'
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})