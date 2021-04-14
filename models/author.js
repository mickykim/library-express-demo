const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');


const AuthorSchema = new Schema(
    {
        first_name: {type: String, required: true, maxlength: 100 },
        family_name: {type: String, required: true, maxlength: 100},
        date_of_birth: {type: Date},
        date_of_death: {type: Date},
    }
);

//Virtual for author's full name

AuthorSchema.virtual('name').get(function() {
    return `${this.family_name}, ${this.first_name}`;
});

//Virtual for author's lifespan
AuthorSchema.virtual('lifespan').get(function() {
    let formatted_date_of_birth = 'N/A';
    let formatted_date_of_death = 'N/A';

    if(this.date_of_birth != null) {
        formatted_date_of_birth = DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED);
    }
    if(this.date_of_death != null) {
        formatted_date_of_death = DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED);
    }
    return formatted_date_of_birth + ' - ' + formatted_date_of_death;
})

//Virtual for author's url
AuthorSchema.virtual('url').get(function() {
    return `/catalog/author/${this._id}`;
})

module.exports = mongoose.model('Author', AuthorSchema);