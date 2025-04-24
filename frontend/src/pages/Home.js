import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { APIUrl, handleError, handleSuccess } from '../utils';
import { ToastContainer } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Home() {
    const [loggedInUser, setLoggedInUser] = useState('');
    const [expenses, setExpenses] = useState([]);
    const [balance, setBalance] = useState(0);
    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);
    const [expenseData, setExpenseData] = useState({
        text: '',
        amount: '',
        category: '',
        transactionType: 'expense'
    });
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('transactions');
    const [filterOptions, setFilterOptions] = useState({
        category: '',
        dateRange: 'all',
        searchTerm: ''
    });
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        setLoggedInUser(localStorage.getItem('loggedInUser'))
    }, []);

    const handleLogout = (e) => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser');
        handleSuccess('User Logged out');
        setTimeout(() => {
            navigate('/login');
        }, 1000)
    }

    const fetchExpenses = async () => {
        try {
            setIsLoading(true);
            const url = `${APIUrl}/expenses`;
            const headers = {
                headers: {
                    'Authorization': localStorage.getItem('token')
                }
            }
            const response = await fetch(url, headers);
            const result = await response.json();

            if (result.success) {
                setExpenses(result.expenses || []);
                setBalance(result.balance || 0);
                setIncome(result.income || 0);
                setExpense(result.expense || 0);
            } else {
                handleError(result.message || 'Failed to fetch expenses');
            }
        } catch (err) {
            handleError(err.message || 'Error fetching expenses');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleExpenseChange = (e) => {
        const { name, value } = e.target;
        setExpenseData({
            ...expenseData,
            [name]: value
        });
    }

    const handleAddExpense = async (e) => {
        e.preventDefault();

        if (!expenseData.text || !expenseData.amount) {
            return handleError('Please provide both description and amount');
        }

        try {
            setIsLoading(true);
            // Adjust amount based on transaction type
            const adjustedAmount = expenseData.transactionType === 'expense'
                ? -Math.abs(parseFloat(expenseData.amount))
                : Math.abs(parseFloat(expenseData.amount));

            const url = `${APIUrl}/expenses`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify({
                    text: expenseData.text,
                    amount: adjustedAmount,
                    category: expenseData.category || (expenseData.transactionType === 'income' ? 'Other Income' : 'Other Expense')
                })
            });

            const result = await response.json();

            if (result.success) {
                handleSuccess('Transaction added successfully');
                setExpenseData({
                    text: '',
                    amount: '',
                    category: '',
                    transactionType: 'expense'
                });
                fetchExpenses();
                setShowExpenseForm(false);
            } else {
                handleError(result.message || 'Failed to add transaction');
            }
        } catch (err) {
            handleError(err.message || 'Error adding transaction');
        } finally {
            setIsLoading(false);
        }
    }

    const handleDeleteExpense = async (expenseId) => {
        try {
            setIsLoading(true);
            const url = `${APIUrl}/expenses/${expenseId}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': localStorage.getItem('token')
                }
            });

            const result = await response.json();

            if (result.success) {
                handleSuccess('Transaction deleted successfully');
                fetchExpenses();
            } else {
                handleError(result.message || 'Failed to delete transaction');
            }
        } catch (err) {
            handleError(err.message || 'Error deleting transaction');
        } finally {
            setIsLoading(false);
        }
    }

    // Income categories
    const incomeCategories = [
        'Salary',
        'Freelance',
        'Investments',
        'Gifts',
        'Refunds',
        'Other Income'
    ];

    // Expense categories
    const expenseCategories = [
        'Food',
        'Rent',
        'Utilities',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Healthcare',
        'Education',
        'Travel',
        'Other Expense'
    ];

    // Filter expenses based on selected options
    const filteredExpenses = expenses.filter(expense => {
        // Filter by category
        if (filterOptions.category && expense.category !== filterOptions.category) {
            return false;
        }

        // Filter by search term
        if (filterOptions.searchTerm &&
            !expense.text.toLowerCase().includes(filterOptions.searchTerm.toLowerCase())) {
            return false;
        }

        // Filter by date range
        if (filterOptions.dateRange === 'custom') {
            const expenseDate = new Date(expense.createdAt);
            const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
            const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

            if (startDate && expenseDate < startDate) return false;
            if (endDate) {
                // Set end date to end of day
                endDate.setHours(23, 59, 59, 999);
                if (expenseDate > endDate) return false;
            }
        } else if (filterOptions.dateRange === 'thisMonth') {
            const expenseDate = new Date(expense.createdAt);
            const now = new Date();
            if (expenseDate.getMonth() !== now.getMonth() ||
                expenseDate.getFullYear() !== now.getFullYear()) {
                return false;
            }
        } else if (filterOptions.dateRange === 'lastMonth') {
            const expenseDate = new Date(expense.createdAt);
            const now = new Date();
            const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

            if (expenseDate.getMonth() !== lastMonth ||
                expenseDate.getFullYear() !== lastMonthYear) {
                return false;
            }
        }

        return true;
    });

    // Prepare data for charts
    const prepareChartData = () => {
        // Category data for pie chart
        const categoryData = {};
        const incomeData = {};
        const expenseData = {};

        filteredExpenses.forEach(item => {
            const category = item.category || (item.amount >= 0 ? 'Other Income' : 'Other Expense');

            if (item.amount >= 0) {
                // Income
                incomeData[category] = (incomeData[category] || 0) + item.amount;
            } else {
                // Expense (use absolute value)
                expenseData[category] = (expenseData[category] || 0) + Math.abs(item.amount);
            }

            // All transactions
            categoryData[category] = (categoryData[category] || 0) + Math.abs(item.amount);
        });

        // Generate random colors for categories
        const generateColors = (count) => {
            const colors = [];
            for (let i = 0; i < count; i++) {
                const hue = (i * 137) % 360; // Use golden angle for good distribution
                colors.push(`hsl(${hue}, 70%, 60%)`);
            }
            return colors;
        };

        // Prepare pie chart data
        const pieData = {
            labels: Object.keys(categoryData),
            datasets: [
                {
                    data: Object.values(categoryData),
                    backgroundColor: generateColors(Object.keys(categoryData).length),
                    borderWidth: 1,
                }
            ]
        };

        // Prepare income vs expense bar chart data
        const barData = {
            labels: ['Income', 'Expense'],
            datasets: [
                {
                    label: 'Amount (₹)',
                    data: [
                        filteredExpenses.reduce((sum, item) => item.amount >= 0 ? sum + item.amount : sum, 0),
                        filteredExpenses.reduce((sum, item) => item.amount < 0 ? sum + Math.abs(item.amount) : sum, 0)
                    ],
                    backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
                    borderWidth: 1,
                }
            ]
        };

        // Prepare category breakdown data
        const incomePieData = {
            labels: Object.keys(incomeData),
            datasets: [
                {
                    data: Object.values(incomeData),
                    backgroundColor: generateColors(Object.keys(incomeData).length),
                    borderWidth: 1,
                }
            ]
        };

        const expensePieData = {
            labels: Object.keys(expenseData),
            datasets: [
                {
                    data: Object.values(expenseData),
                    backgroundColor: generateColors(Object.keys(expenseData).length),
                    borderWidth: 1,
                }
            ]
        };

        return { pieData, barData, incomePieData, expensePieData };
    };

    const { pieData, barData, incomePieData, expensePieData } = prepareChartData();

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterOptions({
            ...filterOptions,
            [name]: value
        });

        // Reset custom date range if not using custom
        if (name === 'dateRange' && value !== 'custom') {
            setDateRange({ startDate: '', endDate: '' });
        }
    };

    // Handle date range changes
    const handleDateRangeChange = (e) => {
        const { name, value } = e.target;
        setDateRange({
            ...dateRange,
            [name]: value
        });
    };

    // Export transactions to CSV
    const exportToCSV = () => {
        // Create CSV content
        let csvContent = "Description,Category,Amount,Date\n";

        filteredExpenses.forEach(item => {
            const date = new Date(item.createdAt).toLocaleDateString();
            const amount = item.amount >= 0 ? item.amount : -item.amount;
            const type = item.amount >= 0 ? "Income" : "Expense";
            const category = item.category || (item.amount >= 0 ? 'Other Income' : 'Other Expense');

            csvContent += `"${item.text}","${category}","${amount} (${type})","${date}"\n`;
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'finance_transactions.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="finance-tracker">
            <header className="app-header">
                <div className="logo">
                    <span className="logo-icon">💰</span>
                    <h1>FinTrack</h1>
                </div>
                <div className="user-section">
                    <span className="welcome-text">Welcome, {loggedInUser}</span>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div className="dashboard">
                <div className="balance-cards">
                    <div className="balance-card total">
                        <h3>Total Balance</h3>
                        <p className={balance >= 0 ? "positive" : "negative"}>₹ {balance}</p>
                    </div>
                    <div className="balance-card income">
                        <h3>Total Income</h3>
                        <p className="positive">₹ {income}</p>
                    </div>
                    <div className="balance-card expense">
                        <h3>Total Expenses</h3>
                        <p className="negative">₹ {expense}</p>
                    </div>
                </div>

                <div className="action-buttons">
                    <button
                        className="add-transaction-btn"
                        onClick={() => setShowExpenseForm(true)}
                        disabled={isLoading}
                    >
                        <span className="btn-icon">+</span> Add Transaction
                    </button>
                    <button
                        className="export-btn"
                        onClick={exportToCSV}
                        disabled={isLoading || filteredExpenses.length === 0}
                    >
                        <span className="btn-icon">📊</span> Export to CSV
                    </button>
                </div>

                {showExpenseForm && (
                    <div className="modal-overlay">
                        <div className="transaction-form-modal">
                            <div className="modal-header">
                                <h2>Add New Transaction</h2>
                                <button
                                    className="close-modal-btn"
                                    onClick={() => setShowExpenseForm(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleAddExpense}>
                                <div className="transaction-type-toggle">
                                    <button
                                        type="button"
                                        className={`toggle-btn ${expenseData.transactionType === 'expense' ? 'active expense' : ''}`}
                                        onClick={() => setExpenseData({ ...expenseData, transactionType: 'expense' })}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        className={`toggle-btn ${expenseData.transactionType === 'income' ? 'active income' : ''}`}
                                        onClick={() => setExpenseData({ ...expenseData, transactionType: 'income' })}
                                    >
                                        Income
                                    </button>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        name="text"
                                        value={expenseData.text}
                                        onChange={handleExpenseChange}
                                        placeholder="What was this transaction for?"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        name="category"
                                        value={expenseData.category}
                                        onChange={handleExpenseChange}
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {expenseData.transactionType === 'income' ? (
                                            incomeCategories.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))
                                        ) : (
                                            expenseCategories.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Amount (₹)</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={expenseData.amount}
                                        onChange={handleExpenseChange}
                                        placeholder="Enter amount"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className={`submit-btn ${expenseData.transactionType}`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Adding...' : `Add ${expenseData.transactionType === 'income' ? 'Income' : 'Expense'}`}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                <div className="content-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('transactions')}
                    >
                        Transactions
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        Analytics
                    </button>
                </div>

                {activeTab === 'transactions' ? (
                    <div className="transactions-section">
                        <div className="filters-section">
                            <div className="filter-group">
                                <label>Search</label>
                                <input
                                    type="text"
                                    name="searchTerm"
                                    value={filterOptions.searchTerm}
                                    onChange={handleFilterChange}
                                    placeholder="Search transactions..."
                                    className="search-input"
                                />
                            </div>

                            <div className="filter-group">
                                <label>Category</label>
                                <select
                                    name="category"
                                    value={filterOptions.category}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Categories</option>
                                    {[...incomeCategories, ...expenseCategories].map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Date Range</label>
                                <select
                                    name="dateRange"
                                    value={filterOptions.dateRange}
                                    onChange={handleFilterChange}
                                >
                                    <option value="all">All Time</option>
                                    <option value="thisMonth">This Month</option>
                                    <option value="lastMonth">Last Month</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>

                            {filterOptions.dateRange === 'custom' && (
                                <div className="date-range-inputs">
                                    <div className="filter-group">
                                        <label>From</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={dateRange.startDate}
                                            onChange={handleDateRangeChange}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label>To</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={dateRange.endDate}
                                            onChange={handleDateRangeChange}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="loading-spinner">
                                <div className="spinner"></div>
                                <p>Loading transactions...</p>
                            </div>
                        ) : filteredExpenses.length === 0 ? (
                            <div className="no-transactions">
                                <p>No transactions found. Add your first transaction!</p>
                            </div>
                        ) : (
                            <div className="transactions-list">
                                {filteredExpenses.map((expense) => (
                                    <div
                                        key={expense._id}
                                        className={`transaction-item ${expense.amount >= 0 ? 'income-item' : 'expense-item'}`}
                                    >
                                        <div className="transaction-icon">
                                            {expense.amount >= 0 ? '💰' : '💸'}
                                        </div>
                                        <div className="transaction-details">
                                            <h4 className="transaction-title">{expense.text}</h4>
                                            <div className="transaction-meta">
                                                <span className="transaction-category">
                                                    {expense.category || (expense.amount >= 0 ? 'Income' : 'Expense')}
                                                </span>
                                                <span className="transaction-date">
                                                    {new Date(expense.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="transaction-amount-section">
                                            <span className={`transaction-amount ${expense.amount >= 0 ? 'income-amount' : 'expense-amount'}`}>
                                                {expense.amount >= 0 ? '+₹' : '-₹'}{Math.abs(expense.amount)}
                                            </span>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteExpense(expense._id)}
                                                disabled={isLoading}
                                                title="Delete transaction"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="analytics-section">
                        <div className="chart-container">
                            <div className="chart-card">
                                <h3>Income vs Expense</h3>
                                <div className="chart-wrapper">
                                    <Bar
                                        data={barData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    position: 'top',
                                                },
                                                title: {
                                                    display: true,
                                                    text: 'Income vs Expense'
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>All Transactions by Category</h3>
                                <div className="chart-wrapper">
                                    <Pie
                                        data={pieData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    position: 'right',
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>Income Breakdown</h3>
                                <div className="chart-wrapper">
                                    <Pie
                                        data={incomePieData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    position: 'right',
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>Expense Breakdown</h3>
                                <div className="chart-wrapper">
                                    <Pie
                                        data={expensePieData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    position: 'right',
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer className="app-footer">
                <p>© {new Date().getFullYear()} FinTrack - Your Personal Finance Tracker</p>
            </footer>

            <ToastContainer />
        </div>
    )
}

export default Home