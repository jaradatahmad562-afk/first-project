const API_URL = 'http://localhost:3000/api/expenses';
let allExpenses = [];
let myChart = null;

async function fetchExpenses() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch expenses.');
        
        allExpenses = await response.json();
        updateUI();
        renderChart();
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

function updateUI() {
    const expensesTableBody = document.getElementById('expenses-table-body');
    const totalAmountCard = document.getElementById('total-amount-card');
    const totalCountCard = document.getElementById('total-count-card');
    const highestExpenseCard = document.getElementById('highest-expense-card');
    const filterCategory = document.getElementById('filter-category');

    const totalCount = allExpenses.length;
    let totalAmount = 0;
    let highest = 0;

    if (totalCount > 0) {
        totalAmount = allExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
        highest = Math.max(...allExpenses.map(item => Number(item.amount)));
    }

    if (totalCountCard) totalCountCard.textContent = totalCount;
    if (totalAmountCard) totalAmountCard.textContent = `$${totalAmount.toFixed(2)}`;
    if (highestExpenseCard) highestExpenseCard.textContent = `$${highest.toFixed(2)}`;

    if (!expensesTableBody) return;

    const selectedCategory = filterCategory ? filterCategory.value : 'All';
    const filteredExpenses = selectedCategory === 'All' 
        ? allExpenses 
        : allExpenses.filter(item => item.category === selectedCategory);

    expensesTableBody.innerHTML = '';

    if (filteredExpenses.length === 0) {
        expensesTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">No expenses found.</td>
            </tr>
        `;
        return;
    }

    filteredExpenses.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-semibold">${item.title}</td>
            <td>$${Number(item.amount).toFixed(2)}</td>
            <td><span class="badge bg-secondary">${item.category}</span></td>
            <td>${item.date}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal(${item.id})">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense(${item.id})">Delete</button>
            </td>
        `;
        expensesTableBody.appendChild(tr);
    });
}

function renderChart() {
    const ctx = document.getElementById('expensesChart');
    if (!ctx) return;

    const categories = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];
    
    const categoryTotals = categories.map(cat => {
        return allExpenses
            .filter(item => item.category === cat)
            .reduce((sum, item) => sum + Number(item.amount), 0);
    });

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                label: 'Expenses',
                data: categoryTotals,
                backgroundColor: [
                    '#0d6efd', '#198754', '#ffc107', '#dc3545', '#6c757d'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

function openEditModal(id) {
    const expense = allExpenses.find(item => item.id === id);
    if (!expense) return;

    document.getElementById('edit-id').value = expense.id;
    document.getElementById('edit-title').value = expense.title;
    document.getElementById('edit-amount').value = expense.amount;
    document.getElementById('edit-category').value = expense.category;
    document.getElementById('edit-date').value = expense.date;

    const editModalElement = document.getElementById('edit-modal');
    const editModal = new bootstrap.Modal(editModalElement);
    editModal.show();
}

async function deleteExpense(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            fetchExpenses(); 
        } else {
            console.error("Failed to delete the expense");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add-btn');
    const filterCategory = document.getElementById('filter-category');
    const editForm = document.getElementById('edit-form');

    const titleInput = document.getElementById('title');
    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category');
    const dateInput = document.getElementById('date');
    const amountError = document.getElementById('amount-error');

    if (addBtn) {
        addBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const title = titleInput ? titleInput.value.trim() : '';
            const rawAmount = amountInput ? amountInput.value.trim() : '';
            const amount = parseFloat(rawAmount);
            const category = categoryInput ? categoryInput.value : '';
            const date = dateInput ? dateInput.value : '';

            let isValid = true;

            if (!title) {
                if (titleInput) titleInput.classList.add('is-invalid');
                isValid = false;
            } else {
                if (titleInput) {
                    titleInput.classList.remove('is-invalid');
                    titleInput.classList.add('is-valid');
                }
            }

            if (rawAmount === '') {
                if (amountInput) amountInput.classList.add('is-invalid');
                if (amountError) amountError.textContent = 'Amount is required.';
                isValid = false;
            } else if (isNaN(amount) || amount <= 0) {
                if (amountInput) amountInput.classList.add('is-invalid');
                if (amountError) amountError.textContent = 'Enter an amount greater than 0.';
                isValid = false;
            } else {
                if (amountInput) {
                    amountInput.classList.remove('is-invalid');
                    amountInput.classList.add('is-valid');
                }
            }

            if (!category) {
                if (categoryInput) categoryInput.classList.add('is-invalid');
                isValid = false;
            } else {
                if (categoryInput) {
                    categoryInput.classList.remove('is-invalid');
                    categoryInput.classList.add('is-valid');
                }
            }

            if (!date) {
                if (dateInput) dateInput.classList.add('is-invalid');
                isValid = false;
            } else {
                if (dateInput) {
                    dateInput.classList.remove('is-invalid');
                    dateInput.classList.add('is-valid');
                }
            }

            if (!isValid) return;

            const newExpense = { title, amount, category, date };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newExpense)
                });

                if (!response.ok) throw new Error('Failed to save expense.');

                if (titleInput) { titleInput.value = ''; titleInput.classList.remove('is-valid'); }
                if (amountInput) { amountInput.value = ''; amountInput.classList.remove('is-valid'); }
                if (categoryInput) { categoryInput.value = ''; categoryInput.classList.remove('is-valid'); }
                if (dateInput) { dateInput.value = ''; dateInput.classList.remove('is-valid'); }

                await fetchExpenses();
            } catch (err) {
                console.error(err);
                alert(err.message);
            }
        });
    }

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('edit-id').value;
            const title = document.getElementById('edit-title').value.trim();
            const amount = parseFloat(document.getElementById('edit-amount').value);
            const category = document.getElementById('edit-category').value;
            const date = document.getElementById('edit-date').value;

            const updatedExpense = { title, amount, category, date };

            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedExpense)
                });

                if (!response.ok) throw new Error('Failed to update expense.');

                const editModalElement = document.getElementById('edit-modal');
                const modalInstance = bootstrap.Modal.getInstance(editModalElement);
                modalInstance.hide();

                await fetchExpenses();
            } catch (err) {
                console.error(err);
                alert(err.message);
            }
        });
    }

    if (filterCategory) {
        filterCategory.addEventListener('change', updateUI);
    }

    fetchExpenses();
});