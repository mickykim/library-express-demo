const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator');
const async = require('async');

exports.index = function(req, res) {

    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all books.
exports.book_list = function(req, res, next) {
    Book.find({}, 'title author')
    //Populate fills the author objectid with the corresponding author.
    .populate('author')
    .exec(function (err, list_book) {
        if (err) {
            return next(err);
        }
        //Success
        res.render('book_list', { title: 'Book List', book_list: list_book});
    });
};

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {

    async.parallel({
        book: function(callback) {

            Book.findById(req.params.id)
              .populate('author')
              .populate('genre')
              .exec(callback);
        },
        book_instance: function(callback) {

          BookInstance.find({ 'book': req.params.id })
          .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) { // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance } );
    });

};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if(err){
            return next(err);
        }

        res.render('book_form', { title: 'Create book', authors: results.authors, genres: results.genres});
    });
};

// Handle book create on POST.
exports.book_create_post = [

    //Converting the genre into an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)) {
            if(typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            }
            else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },

    // Validate and sanitize input fields
    body('title', 'Title must not be empty').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req);

        let book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: req.body.genre
            }
        );

        if(!errors.isEmpty()) {
            // There are errors in the data, Re-render form with sanitized values and error messages.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                }
            }, function(err, results) {
                if (err) {
                    return next(err);
                }

                //Mark the previously selected genres
                for(let i = 0; i < results.genres.length; i++) {
                    if(book.genre.indexOf(results.genres[i]._id) > -1 ) {
                        results.genres[i].checked = 'true';
                    }
                }
                
                res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array()});
            });
        }
        else {
            // Data is valid
            book.save(function(err) {
                if (err) {
                    return next(err);
                }

                // Book successfully saved
                res.redirect(book.url);
            });
        }
    }

];

// Display book delete form on GET.
exports.book_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete GET');
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find({}, callback);
        },
        genres: function(callback) {
            Genre.find({}, callback);
        }
    }, function (err, results) {
        if(err) {
            return next(err);
        }

        if(results.book == null) { // No results
            let error = new Error('Book not found');
            error.status = 404;
            return next(error);
        }

        // Book found, mark all relevant genres as checked.
        // Cannot use indexof since genre id values are now populated with the genre object
        for(let genre_iter = 0; genre_iter < results.genres.length; genre_iter++) {
            for(let book_genre_iter = 0; book_genre_iter < results.book.genre.length; book_genre_iter++) {
                if(results.genres[genre_iter]._id.toString() === results.book.genre[book_genre_iter]._id.toString()) {
                    results.genres[genre_iter].checked = true;
                }
            }
        }

        res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book});

    });
};

// Handle book update on POST.
exports.book_update_post = [
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)) {
            if(req.body.genre === 'undefined') {
                req.body.genre = [];
            }
            else { 
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },

    //Validate and sanitize fields

    body('title', 'Title must not be empty').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    (req, res, next) => {
        let errors = validationResult(req);

        let book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
            _id: req.params.id
        });

        if(!errors.isEmpty()) {
            // There are errors in the form, render form with sanitized inputs and error messages

            async.parallel({
                authors: (callback) => {
                    Author.find({}, callback);
                },
                genres: (callback) => {
                    Genre.find({}, callback);
                }
            }, (err, results) => {
                if(err) {
                    return next(err);
                }
                for(let i = 0; i < results.genres.length; i++) {
                    if(book.genre.indexOf(results.genres[i]) > -1) {
                        results.genres[i].checked = true;
                    }
                }
                res.render('book_form', { title: 'Update Book' , authors: results.authors, genres: results.genres, book: book, errors: errors.array()})
                
            });
            return;
        }
        else {
            // Data is valid. Update record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function(err, thebook) {
                if(err) {
                    return next(err);
                }

                //Successfully updated book. Redirect to book detail page.
                res.redirect(thebook.url);
            })
        }
    }
];
