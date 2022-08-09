const express = require('express')
const router = express.Router()
const catchAsync = require('./../utils/catchAsync')
const ExpressError = require('./../utils/ExpressError')
const Campground = require('./../models/campground')
const { campgroundSchema } = require('../schemas.js')

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body)  
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next()
    }
}

// CREATE
router.post('/', validateCampground, catchAsync(async (req, res, next) => {
    const campground = new Campground(req.body.campground)
    await campground.save()
    res.redirect(`/campgrounds/${campground._id}`)
}))
// NEW
router.get('/new', (req, res) => {
    res.render('campgrounds/new')
})

// GET ALL
router.get('/', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index', { campgrounds })
}))
// GET ONE
router.get('/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findById(id).populate('reviews')
    res.render('campgrounds/show', { campground })
}))

// EDIT
router.get('/:id/edit', catchAsync(async (req, res) => {
    const { id } = req.params
    console.log(id)
    const campground = await Campground.findById(id)
    console.log(campground.title)
    res.render('campgrounds/edit', { campground })
}))
// PATCH
router.patch('/:id', validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params
    const campgroundBody = req.body.campground
    const campground = await Campground.findByIdAndUpdate(id, campgroundBody, { runValidators: true, new: true })
    res.redirect(`/campgrounds/${campground._id}`)
}))

// DELETE
router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    await Campground.findByIdAndDelete(id)
    res.redirect('/campgrounds')
}))

module.exports = router