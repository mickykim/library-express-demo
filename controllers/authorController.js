const Author = require('../models/author');
const async = require('async');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator'); 

// Display list of all Authors.
exports.author_list = function(req, res, next) {
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec(function (err, list_authors) {
            if (err) { return next(err); }
            //Successful, so render
            res.render('author_list', { title: 'Author List', author_list: list_authors });
        });
    
};

// Display detail page for a specific Author.
exports.author_detail = function(req, res, next) {

    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
              .exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.params.id },'title summary')
          .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage.
        if (results.author==null) { // No results.
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books } );
    });

};


// Display Author create form on GET.
exports.author_create_get = function(req, res) {
    res.render('author_form', { title: 'Create Author'});
};

// Handle Author create on POST.
exports.author_create_post = [

    // Sanitize and validate input fields
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified').isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').trim().escape().isLength({ min: 1}).withMessage('Family name must be specified').isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true}).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true}).isISO8601().toDate(),

    // Process request after sanitization and validation
    (req, res, next) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            // There are errors in the validation. Need to render form again with sanitized values and error messages.
            res.render('author_form', {title: 'Create Author', author: req.body, errors: errors.array() });
            return;
        }
        else {
            // Data inputted is valid and sanitized.

            let author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                });
            author.save(function(err) {
                if(err){
                    return next(err);
                }

                // Saved
                res.redirect(author.url);
            })
        }
    }
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback);
        },
        author_books: function(callback) {
            Book.find({ author: req.params.id }).exec(callback);
        }
    }, function(err, results) {
        if(err) {
            return next(err);
        }

        if(results.author == null) { // No results
            res.redirect('/catalog/authors');
        }

        res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.author_books});
    });
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.body.authorid).exec(callback);
        },
        author_books: function(callback) {
            Book.find({ author: req.body.authorid }).exec(callback);
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }

        if(results.author_books.length > 0) { // Author has books, can not delete
            // Render same as GET route
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.author_books });
            return;
        }

        // Author has no books. Delete Author and redirect to author list
        Author.findByIdAndDelete(req.body.authorid, function deleteAuthor(err) {
            if (err) {
                return next(err);
            }

            res.redirect('/catalog/authors');
        })
    })
};

// Display Author update form on GET.
exports.author_update_get = function(req, res, next) {
    Author.findById(req.params.id, function(err, author) {
        if(err) {
            return next(err);
        }

        res.render('author_form', { title: 'Update Author', author: author});
    })
};

// Handle Author update on POST.
exports.author_update_post = [
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified').isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').trim().escape().isLength({ min: 1}).withMessage('Family name must be specified').isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true}).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true}).isISO8601().toDate(),

    (req, res, next) => {
        let errors = validationResult(req);

        let author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id
        });

        if(!errors.isEmpty()) { // Errors in validation/sanitation
            
        }
    }
];
