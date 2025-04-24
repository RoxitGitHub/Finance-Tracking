const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    expenses: [
        {
            text: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            type: {
                type: String,
                enum: ['income', 'expense'],
                default: function () {
                    // Default type based on amount
                    return this.amount >= 0 ? 'income' : 'expense';
                }
            },
            category: {
                type: String,
                default: function () {
                    // Default category based on type
                    return this.amount >= 0 ? 'Other Income' : 'Other Expense';
                }
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

const UserModel = mongoose.model('users', UserSchema);
module.exports = UserModel;