const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');

const BookInstanceSchema = new Schema (
    {
        book: {type: Schema.Types.ObjectId, ref: 'Book', required: true},
        imprint: {type: String, required: true},
        status: {type: String, enum:['Available', 'Maintenance', 'Loaned', 'Reserved'], default: 'Maintenance', required: true},
        due_back: {type: Date, default: Date.now()}
    }
);

BookInstanceSchema.virtual('url').get(function () {
    return `/catalog/bookinstance/${this._id}`;
});

// For string representation of dates in paragraphs
BookInstanceSchema.virtual('due_back_formatted').get(function () {
    return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

// For date formatting in forms
BookInstanceSchema.virtual('formatted_due_back').get(function() {
    return this.due_back.toJSON().slice(0, 10);
})

module.exports = mongoose.model('BookInstance', BookInstanceSchema);