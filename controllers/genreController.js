const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find()
    .sort([['name', 'ascending']])
    .exec(function(err, list_genre) {
        if (err) { return next(err); }
        res.render('genre_list', {title: 'Genre List', genre_list: list_genre});
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
            .exec(callback);
        },
        genre_books: function(callback) {
            Book.find({genre: req.params.id})
            .exec(callback);
        }
        
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre == null) { //No results
            let err = new Error('Genre not found');
            err.status = '404';
            return next(err);
        }
        res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books});
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
// Uses an array of middleware functions. Validators are middleware functions
exports.genre_create_post = [
    // Validate and sanitize the name input field
    body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
    
    // Process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req);

        let genre = new Genre(
            { name: req.body.name }
        );
        
        if(!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
            return;
        }
        else {
            // Data form is valid
            // Check if the Genre already exists
            Genre.findOne({ name: genre.name })
            .exec(function(err, found_genre) {
                if(err) {
                    return next(err);
                }

                if(found_genre) {
                    // Genre already existed, redirect to detail page
                    res.redirect(found_genre.url);
                }
                else {
                    genre.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                        // Genre saved. Redirect to genre detail page
                        res.redirect(genre.url);
                    });
                }
            });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete GET');
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete POST');
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};
