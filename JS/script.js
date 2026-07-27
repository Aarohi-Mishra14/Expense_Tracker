// Variables

let salary = 0; 
let expenses = [];
let currentCategoryFilter = "all";
let currentSearchTerm = "";
let sortColumn = "date";
let sortDirection = "desc";
let chartMode = "balance";
let pendingDeleteId = null;
let activeCurrency = "INR";
let exchangeRates = { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095 };
let expenseChart = null;

const currencySymbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

// Different symbol is used in PDF because ₹ is not supported properly

const pdfCurrencySymbols = { INR: "Rs. ", USD: "$", EUR: "€", GBP: "£" };

let notifications = [];

const categoryColors = {
    Food: "#e8a33c",
    Shopping: "#e0518b",
    Travel: "#2f6fdb",
    Bills: "#9c27b0",
    Education: "#16a34a",
    Entertainment: "#5b52d6",
    Healthcare: "#dc2626",
    Other: "#8a8f98"
};

const categoryBadgeClass = {
    Food: "badge_food",
    Shopping: "badge_shopping",
    Travel: "badge_travel",
    Bills: "badge_bills",
    Education: "badge_education",
    Entertainment: "badge_entertainment",
    Healthcare: "badge_healthcare",
    Other: "badge_other"
};

const categoryOrder = ["Food", "Shopping", "Travel", "Bills", "Education", "Entertainment", "Healthcare", "Other"];

// Sample data 

const defaultExpenses = [
    { id: "e1", name: "College Canteen", category: "Food", amount: 250, date: "2026-07-24" },
    { id: "e2", name: "Bus Fare", category: "Travel", amount: 120, date: "2026-07-23" },
    { id: "e3", name: "Internet Recharge", category: "Bills", amount: 699, date: "2026-07-21" },
    { id: "e4", name: "Notebook", category: "Education", amount: 180, date: "2026-07-20" },
    { id: "e5", name: "Movie Ticket", category: "Entertainment", amount: 350, date: "2026-07-18" },
    { id: "e6", name: "Medical Store", category: "Healthcare", amount: 450, date: "2026-07-16" },
    { id: "e7", name: "T-Shirt", category: "Shopping", amount: 799, date: "2026-07-14" },
    { id: "e8", name: "Stationery", category: "Other", amount: 140, date: "2026-07-12" }
];

// DOM elements

const salaryForm = document.getElementById("salary_form");
const salaryInput = document.getElementById("salary_input");
const salarySavedBadge = document.getElementById("salary_saved_badge");

const expenseForm = document.getElementById("expense_form");
const expenseNameInput = document.getElementById("expense_name_input");
const expenseAmountInput = document.getElementById("expense_amount_input");
const expenseCategorySelect = document.getElementById("expense_category_select");
const expenseDateInput = document.getElementById("expense_date_input");
const expenseNameError = document.getElementById("expense_name_error");
const expenseAmountError = document.getElementById("expense_amount_error");
const expenseSavedBadge = document.getElementById("expense_saved_badge");

const notificationBell = document.getElementById("notification_bell");
const notificationDot = document.getElementById("notification_dot");
const notificationPanel = document.getElementById("notification_panel");
const notificationList = document.getElementById("notification_list");

const userProfileBtn = document.getElementById("user_profile_btn");
const profilePanel = document.getElementById("profile_panel");
const accountSettingsItem = document.getElementById("account_settings_item");
const signOutItem = document.getElementById("sign_out_item");

const resetConfirmGroup = document.getElementById("reset_confirm_group");
const resetYesBtn = document.getElementById("reset_yes_btn");
const resetCancelBtn = document.getElementById("reset_cancel_btn");

const totalSalaryValue = document.getElementById("total_salary_value");
const totalExpensesValue = document.getElementById("total_expenses_value");
const expensePercentText = document.getElementById("expense_percent_text");
const remainingBalanceValue = document.getElementById("remaining_balance_value");
const expenseCountValue = document.getElementById("expense_count_value");
const lowBalanceBanner = document.getElementById("low_balance_banner");

const categoryFiltersWrap = document.getElementById("category_filters");
const expensesTableBody = document.getElementById("expenses_table_body");
const emptyExpensesMessage = document.getElementById("empty_expenses_message");
const showingCountText = document.getElementById("showing_count_text");
const totalShownValue = document.getElementById("total_shown_value");

const searchInput = document.getElementById("search_input");
const searchClear = document.getElementById("search_clear");

const balanceViewBtn = document.getElementById("balance_view_btn");
const categoryViewBtn = document.getElementById("category_view_btn");
const chartLegend = document.getElementById("chart_legend");

const downloadPdfBtn = document.getElementById("download_pdf_btn");
const resetDefaultsBtn = document.getElementById("reset_defaults_btn");
const currencySelect = document.getElementById("currency_select");

const salaryCurrencySymbol = document.getElementById("salary_currency_symbol");
const expenseCurrencySymbol = document.getElementById("expense_currency_symbol");

const toastMessage = document.getElementById("message");

// Local storage

// Check whether browser supports local storage

let storageAvailable = true;

function isStorageAvailable() {
    try {
        const testKey = "cashflow_storage_test";
        localStorage.setItem(testKey, "1");
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
}

function loadData() {
    storageAvailable = isStorageAvailable();

    if (!storageAvailable) {
        // If local storage is not available, use default values
        salary = 30000;
        expenses = defaultExpenses.slice();
        return;
    }

    const storedSalary = localStorage.getItem("cashflow_salary");
    const storedExpenses = localStorage.getItem("cashflow_expenses");
    const storedCurrency = localStorage.getItem("cashflow_currency");

    if (storedSalary === null && storedExpenses === null) {
        salary = 30000;
        expenses = defaultExpenses.slice();
        saveData();
        return;
    }

    salary = storedSalary !== null ? parseFloat(storedSalary) : 30000;
    expenses = storedExpenses ? JSON.parse(storedExpenses) : [];
    activeCurrency = storedCurrency || "INR";
}

function saveData() {
    if (!storageAvailable) {
        return;
    }
    localStorage.setItem("cashflow_salary", String(salary));
    localStorage.setItem("cashflow_expenses", JSON.stringify(expenses));
    localStorage.setItem("cashflow_currency", activeCurrency);
}

// Helper functions

function generateExpenseId() {
    return "e" + Date.now() + Math.floor(Math.random() * 1000);
}

function convertCurrency(amountInInr) {
    const rate = exchangeRates[activeCurrency] || 1;
    return amountInInr * rate;
}

function formatMoney(amountInInr) {
    const converted = convertCurrency(amountInInr);
    const symbol = currencySymbols[activeCurrency];
    const rounded = Math.round(converted * 100) / 100;
    return symbol + rounded.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatDateForDisplay(isoDate) {
    const parsed = new Date(isoDate + "T00:00:00");
    return parsed.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function showMessage(text) {
    toastMessage.textContent = text;
    toastMessage.classList.remove("hidden");
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(function () {
        toastMessage.classList.add("hidden");
    }, 2400);
}

// Salary section

let salaryAutoSaveTimer = null;

function autoSaveSalary() {
    const value = parseFloat(salaryInput.value);
    if (!isNaN(value) && value >= 0) {
        salary = value;
        saveData();
        updateSummary();
        updateChart();
    }
}

salaryInput.addEventListener("input", function () {
    clearTimeout(salaryAutoSaveTimer);
    salaryAutoSaveTimer = setTimeout(autoSaveSalary, 600);
});

salaryInput.addEventListener("blur", function () {
    clearTimeout(salaryAutoSaveTimer);
    autoSaveSalary();
});

salaryForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const value = parseFloat(salaryInput.value);

    if (isNaN(value) || value < 0) {
        salaryInput.classList.add("input_error");
        showMessage("Enter a valid salary.");
        return;
    }

    salaryInput.classList.remove("input_error");
    salary = value;
    saveData();

    salarySavedBadge.classList.remove("hidden");
    clearTimeout(salaryForm.savedTimer);
    salaryForm.savedTimer = setTimeout(function () {
        salarySavedBadge.classList.add("hidden");
    }, 2500);

    refreshDashboard();
    pushNotification("Salary saved.");
});

// Expense draft

let expenseDraftTimer = null;

function saveExpenseDraft() {
    if (!storageAvailable) {
        return;
    }
    const draft = {
        name: expenseNameInput.value,
        amount: expenseAmountInput.value,
        category: expenseCategorySelect.value,
        date: expenseDateInput.value
    };
    localStorage.setItem("cashflow_expense_draft", JSON.stringify(draft));
}

function scheduleExpenseDraftSave() {
    clearTimeout(expenseDraftTimer);
    expenseDraftTimer = setTimeout(saveExpenseDraft, 500);
}

function loadExpenseDraft() {
    if (!storageAvailable) {
        return;
    }
    const stored = localStorage.getItem("cashflow_expense_draft");
    if (!stored) {
        return;
    }
    try {
        const draft = JSON.parse(stored);
        if (draft.name) {
            expenseNameInput.value = draft.name;
        }
        if (draft.amount) {
            expenseAmountInput.value = draft.amount;
        }
        if (draft.category) {
            expenseCategorySelect.value = draft.category;
        }
        if (draft.date) {
            expenseDateInput.value = draft.date;
        }
    } catch (error) {
        console.log("Error");
    }
}

function clearExpenseDraft() {
    if (!storageAvailable) {
        return;
    }
    localStorage.removeItem("cashflow_expense_draft");
}

expenseNameInput.addEventListener("input", scheduleExpenseDraftSave);
expenseAmountInput.addEventListener("input", scheduleExpenseDraftSave);
expenseCategorySelect.addEventListener("change", saveExpenseDraft);
expenseDateInput.addEventListener("change", saveExpenseDraft);

// Add expense

expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = expenseNameInput.value.replace(/[0-9]/g, "").trim();
    const amount = parseFloat(expenseAmountInput.value);
    const category = expenseCategorySelect.value;
    const date = expenseDateInput.value || new Date().toISOString().slice(0, 10);

    let hasError = false;

    if (!name) {
        expenseNameInput.classList.add("input_error");
        expenseNameError.classList.remove("hidden");
        hasError = true;
    } else {
        expenseNameInput.classList.remove("input_error");
        expenseNameError.classList.add("hidden");
    }

    if (isNaN(amount) || amount <= 0) {
        expenseAmountInput.classList.add("input_error");
        expenseAmountError.classList.remove("hidden");
        hasError = true;
    } else {
        expenseAmountInput.classList.remove("input_error");
        expenseAmountError.classList.add("hidden");
    }

    if (hasError) {
        return;
    }

    expenses.unshift({
        id: generateExpenseId(),
        name: name,
        category: category,
        amount: amount,
        date: date
    });

    saveData();
    expenseForm.reset();
    expenseDateInput.value = new Date().toISOString().slice(0, 10);
    clearExpenseDraft();

    expenseSavedBadge.classList.remove("hidden");
    clearTimeout(expenseForm.savedTimer);
    expenseForm.savedTimer = setTimeout(function () {
        expenseSavedBadge.classList.add("hidden");
    }, 2500);

    refreshDashboard();
    pushNotification("Expense added.");
});

// Remove error while typing

expenseNameInput.addEventListener("input", function () {
    const cleaned = expenseNameInput.value.replace(/[0-9]/g, "");
    if (cleaned !== expenseNameInput.value) {
        expenseNameInput.value = cleaned;
    }
    if (expenseNameInput.value.trim()) {
        expenseNameInput.classList.remove("input_error");
        expenseNameError.classList.add("hidden");
    }
});

expenseAmountInput.addEventListener("input", function () {
    const value = parseFloat(expenseAmountInput.value);
    if (!isNaN(value) && value > 0) {
        expenseAmountInput.classList.remove("input_error");
        expenseAmountError.classList.add("hidden");
    }
});

// Delete expense 

function requestDelete(id) {
    pendingDeleteId = id;
    displayExpenses();
}

function cancelDelete() {
    pendingDeleteId = null;
    displayExpenses();
}

function confirmDelete(id) {
    const removed = expenses.find(function (item) { return item.id === id; });
    expenses = expenses.filter(function (item) {
        return item.id !== id;
    });
    pendingDeleteId = null;
    saveData();
    refreshDashboard();
    showMessage("Deleted expense.");
    if (removed) {
        pushNotification("Deleted expense.");
    }
}

// Search 

searchInput.addEventListener("input", function () {
    currentSearchTerm = searchInput.value.trim().toLowerCase();
    searchClear.style.display = currentSearchTerm ? "block" : "none";
    displayExpenses();
});

searchClear.addEventListener("click", function () {
    searchInput.value = "";
    currentSearchTerm = "";
    searchClear.style.display = "none";
    displayExpenses();
});

// Sorting 

document.querySelectorAll(".sortable_head").forEach(function (headerCell) {
    headerCell.addEventListener("click", function () {
        const column = headerCell.getAttribute("data-sort");
        if (sortColumn === column) {
            sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortColumn = column;
            sortDirection = "desc";
        }
        displayExpenses();
    });
});

function getFilteredSortedExpenses() {
    let list = expenses.slice();

    if (currentCategoryFilter !== "all") {
        list = list.filter(function (item) {
            return item.category === currentCategoryFilter;
        });
    }

    if (currentSearchTerm) {
        list = list.filter(function (item) {
            return item.name.toLowerCase().includes(currentSearchTerm) ||
                   item.category.toLowerCase().includes(currentSearchTerm);
        });
    }

    list.sort(function (a, b) {
        let result = 0;
        if (sortColumn === "amount") {
            result = a.amount - b.amount;
        } else {
            result = new Date(a.date) - new Date(b.date);
        }
        return sortDirection === "asc" ? result : -result;
    });

    return list;
}

// Category filter

function renderCategoryFilters() {
    const allCount = expenses.length;
    let html = '<button type="button" class="category_filter_btn' +
        (currentCategoryFilter === "all" ? " active_filter" : "") +
        '" data-category="all">All (' + allCount + ")</button>";

    categoryOrder.forEach(function (category) {
        const count = expenses.filter(function (item) { return item.category === category; }).length;
        if (count === 0) {
            return;
        }
        html += '<button type="button" class="category_filter_btn' +
            (currentCategoryFilter === category ? " active_filter" : "") +
            '" data-category="' + category + '">' + category + " (" + count + ")</button>";
    });

    categoryFiltersWrap.innerHTML = html;

    categoryFiltersWrap.querySelectorAll(".category_filter_btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            currentCategoryFilter = btn.getAttribute("data-category");
            displayExpenses();
            renderCategoryFilters();
        });
    });
}

// Expense table

function displayExpenses() {
    const list = getFilteredSortedExpenses();

    if (list.length === 0) {
        expensesTableBody.innerHTML = "";
        emptyExpensesMessage.classList.remove("hidden");
    } else {
        emptyExpensesMessage.classList.add("hidden");

        expensesTableBody.innerHTML = list.map(function (item) {
            const badgeClass = categoryBadgeClass[item.category] || "badge_other";

            const actionCell = pendingDeleteId === item.id
                ? '<div class="delete_confirm_group">' +
                  '<button type="button" class="confirm_delete_btn" data-confirm-id="' + item.id + '">Confirm Delete</button>' +
                  '<button type="button" class="cancel_delete_btn" data-cancel-id="' + item.id + '">Cancel</button>' +
                  '</div>'
                : '<button type="button" class="delete_icon_btn" data-delete-id="' + item.id + '"><i class="fa-solid fa-trash"></i></button>';

            return '<tr>' +
                '<td class="expense_name_cell">' + escapeHtml(item.name) + '</td>' +
                '<td><span class="category_badge ' + badgeClass + '">' + item.category + '</span></td>' +
                '<td class="amount_cell">' + formatMoney(item.amount) + '</td>' +
                '<td>' + formatDateForDisplay(item.date) + '</td>' +
                '<td>' + actionCell + '</td>' +
                '</tr>';
        }).join("");
    }

    expensesTableBody.querySelectorAll("[data-delete-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            requestDelete(btn.getAttribute("data-delete-id"));
        });
    });
    expensesTableBody.querySelectorAll("[data-confirm-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            confirmDelete(btn.getAttribute("data-confirm-id"));
        });
    });
    expensesTableBody.querySelectorAll("[data-cancel-id]").forEach(function (btn) {
        btn.addEventListener("click", cancelDelete);
    });

    const totalShown = list.reduce(function (sum, item) { return sum + item.amount; }, 0);
    showingCountText.textContent = "Showing " + list.length + " Expenses";
    totalShownValue.textContent = "Total Shown: " + formatMoney(totalShown);
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Statistics

function updateSummary() {
    const totalExpenses = expenses.reduce(function (sum, item) { return sum + item.amount; }, 0);
    const remaining = salary - totalExpenses;
    const percentSpent = salary > 0 ? Math.round((totalExpenses / salary) * 100) : 0;

    totalSalaryValue.textContent = formatMoney(salary);
    totalExpensesValue.textContent = formatMoney(totalExpenses);
    expensePercentText.textContent = percentSpent + "% of income spent";
    remainingBalanceValue.textContent = formatMoney(remaining);
    expenseCountValue.textContent = expenses.length;

    const isLow = salary > 0 && remaining < salary * 0.1;
    lowBalanceBanner.classList.toggle("showing_banner", isLow);
    remainingBalanceValue.style.color = isLow ? "#e5484d" : "";
}

// Chart

function updateChart() {
    if (typeof Chart === "undefined") {
        console.log("Chart.js not loaded.");
        chartLegend.innerHTML = '<span class="legend_pill">Chart not available.</span>';
        return;
    }

    try {
        const ctx = document.getElementById("expense_chart").getContext("2d");
        const totalExpenses = expenses.reduce(function (sum, item) { return sum + item.amount; }, 0);
        const remaining = Math.max(salary - totalExpenses, 0);

        let labels = [];
        let data = [];
        let colors = [];

        if (chartMode === "balance") {
            labels = ["Remaining Balance", "Total Expenses"];
            data = [convertCurrency(remaining), convertCurrency(totalExpenses)];
            colors = ["#3457e0", "#e5484d"];
        } else {
            categoryOrder.forEach(function (category) {
                const sum = expenses
                    .filter(function (item) { return item.category === category; })
                    .reduce(function (acc, item) { return acc + item.amount; }, 0);
                if (sum > 0) {
                    labels.push(category);
                    data.push(convertCurrency(sum));
                    colors.push(categoryColors[category]);
                }
            });
        }

        if (labels.length === 0) {
            labels = ["No data yet"];
            data = [1];
            colors = ["#e6e7eb"];
        }

        if (expenseChart) {
            expenseChart.destroy();
        }

        expenseChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: "#ffffff",
                    borderWidth: 3
                }]
            },
            options: {
                cutout: "68%",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                }
            }
        });

        renderChartLegend(labels, data, colors);
    } catch (error) {
        console.log("Error");
        chartLegend.innerHTML = '<span class="legend_pill">Error loading chart.</span>';
    }
}

function renderChartLegend(labels, data, colors) {
    if (labels[0] === "No data yet") {
        chartLegend.innerHTML = '<span class="legend_pill">No data to display yet</span>';
        return;
    }

    chartLegend.innerHTML = labels.map(function (label, index) {
        const symbol = currencySymbols[activeCurrency];
        const rounded = Math.round(data[index] * 100) / 100;
        const amountText = symbol + rounded.toLocaleString("en-IN", { maximumFractionDigits: 2 });
        return '<span class="legend_pill"><span class="legend_dot" style="background-color:' + colors[index] + '"></span>' +
            label + ":&nbsp;<b>" + amountText + "</b></span>";
    }).join("");
}

balanceViewBtn.addEventListener("click", function () {
    chartMode = "balance";
    balanceViewBtn.classList.add("active_toggle");
    categoryViewBtn.classList.remove("active_toggle");
    updateChart();
});

categoryViewBtn.addEventListener("click", function () {
    chartMode = "category";
    categoryViewBtn.classList.add("active_toggle");
    balanceViewBtn.classList.remove("active_toggle");
    updateChart();
});

// Currency

async function fetchExchangeRates() {
    try {
        const response = await fetch("https://api.frankfurter.dev/v1/latest?base=INR&symbols=USD,EUR,GBP");
        if (!response.ok) {
            throw new Error("Rate lookup failed");
        }
        const data = await response.json();
        exchangeRates = {
            INR: 1,
            USD: data.rates.USD,
            EUR: data.rates.EUR,
            GBP: data.rates.GBP
        };
    } catch (error) {
        console.log("Error");
    }
}

currencySelect.addEventListener("change", function () {
    activeCurrency = currencySelect.value;
    salaryCurrencySymbol.textContent = currencySymbols[activeCurrency];
    expenseCurrencySymbol.textContent = currencySymbols[activeCurrency];
    document.querySelectorAll(".currency_label_tag").forEach(function (tag) {
        tag.textContent = activeCurrency;
    });
    saveData();
    refreshDashboard();
});

// Notifications

function pushNotification(message) {
    notifications.unshift({ message: message, time: new Date() });
    notifications = notifications.slice(0, 10);
    notificationDot.classList.remove("hidden");
    updateNotifications();
}

function updateNotifications() {
    if (notifications.length === 0) {
        notificationList.innerHTML = '<p class="dropdown_empty">No notifications yet.</p>';
        return;
    }
    notificationList.innerHTML = notifications.map(function (note) {
        const timeText = note.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        return '<div class="dropdown_list_item">' + escapeHtml(note.message) + '<span>' + timeText + '</span></div>';
    }).join("");
}

function closeAllDropdowns() {
    notificationPanel.classList.add("hidden");
    profilePanel.classList.add("hidden");
}

notificationBell.addEventListener("click", function (event) {
    event.stopPropagation();
    const willOpen = notificationPanel.classList.contains("hidden");
    closeAllDropdowns();
    if (willOpen) {
        notificationPanel.classList.remove("hidden");
        notificationDot.classList.add("hidden");
    }
});

userProfileBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    const willOpen = profilePanel.classList.contains("hidden");
    closeAllDropdowns();
    if (willOpen) {
        profilePanel.classList.remove("hidden");
    }
});

accountSettingsItem.addEventListener("click", function () {
    closeAllDropdowns();
    showMessage("Account settings not available.");
});

signOutItem.addEventListener("click", function () {
    closeAllDropdowns();
    showMessage("Signed out is for demo only.");
});

document.addEventListener("click", closeAllDropdowns);
notificationPanel.addEventListener("click", function (event) { event.stopPropagation(); });
profilePanel.addEventListener("click", function (event) { event.stopPropagation(); });

updateNotifications();

// PDF report

function formatMoneyForPdf(amountInInr) {
    const converted = convertCurrency(amountInInr);
    const symbol = pdfCurrencySymbols[activeCurrency];
    const rounded = Math.round(converted * 100) / 100;
    return symbol + rounded.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

downloadPdfBtn.addEventListener("click", function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const totalExpenses = expenses.reduce(function (sum, item) { return sum + item.amount; }, 0);
    const remaining = salary - totalExpenses;

    // PDF header 
    doc.setFillColor(52, 87, 224);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Cash Flow", 14, 15);
    doc.setFontSize(10);
    doc.text("Expense Summary", 14, 22);

    doc.setTextColor(90);
    doc.setFontSize(10);
    doc.text("Generated on " + new Date().toLocaleDateString("en-GB"), 14, 40);

    // summary 
    const summary = [
        { label: "Total Salary", value: formatMoneyForPdf(salary) },
        { label: "Total Expenses", value: formatMoneyForPdf(totalExpenses) },
        { label: "Remaining Balance", value: formatMoneyForPdf(remaining) }
    ];
    const boxWidth = (pageWidth - 28 - 12) / 3;

    summary.forEach(function (item, index) {
        const x = 14 + index * (boxWidth + 6);
        doc.setDrawColor(225, 227, 232);
        doc.setFillColor(248, 249, 251);
        doc.roundedRect(x, 46, boxWidth, 22, 3, 3, "FD");
        doc.setTextColor(120);
        doc.setFontSize(8.5);
        doc.text(item.label.toUpperCase(), x + 6, 55);
        doc.setTextColor(20);
        doc.setFontSize(13);
        doc.text(item.value, x + 6, 64);
    });

    doc.autoTable({
        startY: 78,
        head: [["Expense Name", "Category", { content: "Amount", styles: { halign: "right" } }, "Date"]],
        body: expenses.map(function (item) {
            return [item.name, item.category, formatMoneyForPdf(item.amount), formatDateForDisplay(item.date)];
        }),
        headStyles: { fillColor: [52, 87, 224], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 249, 251] },
        styles: { fontSize: 10, cellPadding: 6, valign: "middle" },
        columnStyles: { 2: { halign: "right" } },
        didDrawPage: function () {
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(8.5);
            doc.setTextColor(150);
            doc.text("Cash Flow Expense Tracker", 14, pageHeight - 10);
        }
    });

    doc.save("expense-report.pdf");
    showMessage("PDF downloaded.");
    pushNotification("Report downloaded.");
});

// Reset dashboard

resetDefaultsBtn.addEventListener("click", function () {
    resetDefaultsBtn.classList.add("hidden");
    resetConfirmGroup.classList.remove("hidden");
});

resetCancelBtn.addEventListener("click", function () {
    resetConfirmGroup.classList.add("hidden");
    resetDefaultsBtn.classList.remove("hidden");
});

resetYesBtn.addEventListener("click", function () {
    salary = 30000;
    expenses = defaultExpenses.slice();
    activeCurrency = "INR";
    currencySelect.value = "INR";
    salaryCurrencySymbol.textContent = "₹";
    expenseCurrencySymbol.textContent = "₹";
    document.querySelectorAll(".currency_label_tag").forEach(function (tag) { tag.textContent = "INR"; });
    currentCategoryFilter = "all";
    currentSearchTerm = "";
    searchInput.value = "";
    searchClear.style.display = "none";
    saveData();
    clearExpenseDraft();
    refreshDashboard();

    resetConfirmGroup.classList.add("hidden");
    resetDefaultsBtn.classList.remove("hidden");
    showMessage("Data reset.");
    pushNotification("Data reset.");
});

// Bottom navigation

document.querySelectorAll(".nav_tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
        document.querySelectorAll(".nav_tab").forEach(function (t) { t.classList.remove("active_tab"); });
        tab.classList.add("active_tab");
        const target = tab.getAttribute("data-tab");
        if (target !== "dashboard") {
            showMessage("Feature coming soon.");
        }
    });
});

// Render functions

function refreshDashboard() {
    salaryInput.value = salary || "";
    updateSummary();
    renderCategoryFilters();
    displayExpenses();
    updateChart();
}

// Start dashboard

async function startDashboard() {
    loadData();
    currencySelect.value = activeCurrency;
    salaryCurrencySymbol.textContent = currencySymbols[activeCurrency];
    expenseCurrencySymbol.textContent = currencySymbols[activeCurrency];
    document.querySelectorAll(".currency_label_tag").forEach(function (tag) { tag.textContent = activeCurrency; });
    expenseDateInput.value = new Date().toISOString().slice(0, 10);
    loadExpenseDraft();

    if (!storageAvailable) {
        showMessage("Local storage is not available.");
    }

    await fetchExchangeRates();
    refreshDashboard();
}

startDashboard();