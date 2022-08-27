const express = require('express')
const router = express.Router()
const catchAsync = require('./../utils/catchAsync')
const Campground = require('./../models/campground')
const {isLoggedIn, isAuthor, validateCampground} = require('../middleware')



// CREATE
router.post('/', isLoggedIn, validateCampground, catchAsync(async (req, res, next) => {
    const campground = new Campground(req.body.campground)
    campground.author = req.user._id
    await campground.save()
    req.flash('success', 'Successfully made a new camground!')
    res.redirect(`/campgrounds/${campground._id}`)
}))
// NEW
router.get('/new', isLoggedIn, (req, res) => {
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
    const campground = await Campground.findById(id).populate('reviews').populate('author')
    if (!campground) {
        req.flash('error', 'Cannot find that campground!')
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/show', { campground })
}))

// EDIT
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findById(id)
    if (!campground) {
        req.flash('error', 'Cannot find that campground!')
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/edit', { campground, id })
}))
// PATCH
router.patch('/:id', isLoggedIn, isAuthor, validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findByIdAndUpdate(id, req.body.campground, { runValidators: true, new: true })
    req.flash('success', 'Successfully updated campground!')
    res.redirect(`/campgrounds/${campground._id}`)
}))

// DELETE
router.delete('/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params
    await Campground.findByIdAndDelete(id)
    req.flash('success', 'Successfully deleted campground!')
    res.redirect('/campgrounds')
}))

module.exports = router