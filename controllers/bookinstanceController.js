const BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator');
const Book = require('../models/book');
// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
    .populate('book')
    .exec(function(err, list_bookinstance) {
        if (err) { return next(err); }
        //Successful
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstance});
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Copy: '+ bookinstance.book.title, bookinstance:  bookinstance});
    })

};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, function(err, books) {
        if(err) {
            return next(err);
        }
        
        // Successful
        res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    })
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    
    // Validate and Sanitize input
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    (req, res, next) => {

        // Get errors from validation
        const errors = validationResult(req);

        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if(!errors.isEmpty()) {
            // Errors found in validation, need to render form again with sanitized inputs and error messages.
            Book.find({}, function(err, books) {
                if(err) {
                    return next(err);
                }
                
                // No errors, render form
                res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books, bookinstance: bookinstance, errors: errors.array()});
            });

        }
        else {
            bookinstance.save(function(err) {
                if(err) {
                    return next(err);
                }

                res.redirect(bookinstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id).exec(function (err, bookinstance) {
        if(err) {
            return next(err);
        }

        if(bookinstance == null) {
            // No bookinstance found with the given id
            let error = new Error('BookInstance not found');
            error.status = 404;
            return next(error);
        }

        // Everythings good, render page

        res.render('bookinstance_delete', {bookinstance: bookinstance});
    })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findByIdAndDelete(req.body.bookinstanceid, function deleteBookInstance(err) {
        if(err) {
            return next(err);
        }
        // Deletion was successful. Redirect to bookinstance list
        res.redirect('/catalog/bookinstances');

    })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update GET');
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update POST');
};
