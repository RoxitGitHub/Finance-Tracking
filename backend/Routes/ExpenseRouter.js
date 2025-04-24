const { fetchExpenses, addExpenses, deleteExpenses } = require('../Controllers/ExpenseControler');
const ensureAuthenticated = require('../Middlewares/Auth');

const router = require('express').Router();

//fetch all the expenses of user based on user_id
router.get('/', ensureAuthenticated, fetchExpenses);
//add Expenses
router.post('/', ensureAuthenticated, addExpenses);
//Delete Expenses
router.delete('/:expenseId', ensureAuthenticated, deleteExpenses);

module.exports = router;