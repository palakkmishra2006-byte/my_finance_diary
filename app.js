/**
 * MY FINANCE DIARY - MAIN APPLICATION SCRIPT
 * Keeps track of your income, expenses, and monthly history.
 */

// Global Variables to save data
let currentPersona = localStorage.getItem('diary_persona') || '';
let incomes = JSON.parse(localStorage.getItem('diary_incomes')) || [];
let expenses = JSON.parse(localStorage.getItem('diary_expenses')) || [];
let obligations = JSON.parse(localStorage.getItem('diary_obligations')) || [];
let historicalArchives = JSON.parse(localStorage.getItem('diary_history_vault')) || [];
let usersDatabase = JSON.parse(localStorage.getItem('diary_users_db')) || [
    { username: "admin", password: "password", persona: "Professional" }
];
let activeCurrentUser = localStorage.getItem('diary_active_user') || '';
let authMode = 'login';
let miniChartInstance = null;
let macroPieChartInstance = null;

/**
 * 1. PAGE ROUTER
 * Switches between different screens.
 */
function switchPage(pageId) {
    const screens = ['home-page', 'login-page', 'income-page', 'diary-page', 'checklist-page', 'analytics-page', 'history-page'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.remove('hidden');

    const nav = document.getElementById('main-nav');
    if (pageId === 'home-page' || pageId === 'login-page') {
        nav.classList.add('hidden');
    } else {
        nav.classList.remove('hidden');
        document.getElementById('persona-badge').innerText = `${activeCurrentUser} (${currentPersona})`;
        document.getElementById('persona-badge').classList.remove('hidden');
        
        // Refresh charts or timelines when entering their page
        if (pageId === 'analytics-page') renderMacroPieChartMatrix();
        if (pageId === 'history-page') renderHistoricalVaultTimeline();
    }
}

/**
 * 2. PROFILE PROFILE MANAGER
 */
function selectPersona(selectedRole) {
    currentPersona = selectedRole;
    localStorage.setItem('diary_persona', selectedRole);
    setAuthMode('login');
    switchPage('login-page');
}

function setAuthMode(mode) {
    authMode = mode;
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const fieldEmail = document.getElementById('field-email');
    const fieldConfirmPass = document.getElementById('field-confirm-password');
    const submitBtn = document.getElementById('auth-submit-btn');
    const errorEl = document.getElementById('auth-error-msg');
    
    errorEl.classList.add('hidden');
    document.getElementById('auth-form').reset();

    if (mode === 'signup') {
        tabLogin.className = "flex-1 text-center font-bold text-xs uppercase py-2 text-slate-500";
        tabSignup.className = "flex-1 text-center font-black text-xs uppercase py-2 border-b-2 border-blue-500 text-white";
        fieldEmail.classList.remove('hidden');
        fieldConfirmPass.classList.remove('hidden');
        submitBtn.innerText = "Create New Account";
    } else {
        tabLogin.className = "flex-1 text-center font-black text-xs uppercase py-2 border-b-2 border-blue-500 text-white";
        tabSignup.className = "flex-1 text-center font-bold text-xs uppercase py-2 text-slate-500";
        fieldEmail.classList.add('hidden');
        fieldConfirmPass.classList.add('hidden');
        submitBtn.innerText = "Log In to Diary";
    }
}

// Handle Sign In / Sign Up form submission
document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-username').value.trim();
    const pass = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error-msg');

    if (authMode === 'signup') {
        const confirmPass = document.getElementById('auth-confirm-password').value;
        if (pass !== confirmPass) {
            showNotification("Error", "Passwords do not match!");
            return;
        }
        const userExists = usersDatabase.some(u => u.username.toLowerCase() === username.toLowerCase());
        if (userExists) {
            showNotification("Error", "This username is already taken!");
            return;
        }
        usersDatabase.push({ username, password: pass, persona: currentPersona });
        localStorage.setItem('diary_users_db', JSON.stringify(usersDatabase));
        activeCurrentUser = username;
        localStorage.setItem('diary_active_user', username);
        incomes = []; expenses = []; obligations = [];
        applyPersonaDefaults();
    } else {
        const foundUser = usersDatabase.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === pass);
        if (!foundUser) {
            showNotification("Access Denied", "Wrong username or password!");
            return;
        }
        activeCurrentUser = foundUser.username;
        currentPersona = foundUser.persona;
        localStorage.setItem('diary_active_user', foundUser.username);
        localStorage.setItem('diary_persona', foundUser.persona);
    }
    switchPage('income-page');
    renderAll();
});

// Load standard starter values based on chosen user type
function applyPersonaDefaults() {
    if (incomes.length === 0 && expenses.length === 0 && obligations.length === 0) {
        if (currentPersona === 'College Student') {
            incomes = [{ id: 101, source: "Monthly College Stipend", amount: 5000.00, type: "Household Allowance", date: new Date().toLocaleDateString() }];
            expenses = [{ id: 201, desc: "Books and Notebooks Pack", amount: 450.00, category: "Academics/Growth", date: new Date().toLocaleDateString() }];
            obligations = [{ id: 301, title: "Monthly Hostel Internet", amount: 500.00, completed: false }];
        } else if (currentPersona === 'Homemaker') {
            incomes = [{ id: 102, source: "Home Monthly Budget Allowance", amount: 25000.00, type: "Household Allowance", date: new Date().toLocaleDateString() }];
            expenses = [{ id: 202, desc: "Kitchen Groceries Shopping", amount: 3200.00, category: "Logistics/Utilities", date: new Date().toLocaleDateString() }];
            obligations = [{ id: 302, title: "Electricity Bill Connection", amount: 1800.00, completed: true }];
        } else {
            incomes = [{ id: 103, source: "Monthly Job Base Salary", amount: 65000.00, type: "Active Core", date: new Date().toLocaleDateString() }];
            expenses = [{ id: 203, desc: "Office Internet and Software tools", amount: 890.00, category: "Operational", date: new Date().toLocaleDateString() }];
            obligations = [{ id: 303, title: "House Rent Payment", amount: 12000.00, completed: false }];
        }
        saveAllToStorage();
    }
}

function logout() {
    activeCurrentUser = '';
    localStorage.removeItem('diary_active_user');
    switchPage('home-page');
}

function saveAllToStorage() {
    localStorage.setItem('diary_incomes', JSON.stringify(incomes));
    localStorage.setItem('diary_expenses', JSON.stringify(expenses));
    localStorage.setItem('diary_obligations', JSON.stringify(obligations));
    localStorage.setItem('diary_history_vault', JSON.stringify(historicalArchives));
}

/**
 * 3. ANALYTICS & PIE CHART CALCULATOR
 */
function renderMacroPieChartMatrix() {
    const totalEarnings = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0) + obligations.reduce((sum, item) => sum + (item.completed ? item.amount : 0), 0);
    const totalSavings = Math.max(0, totalEarnings - totalExpenses);

    const ctx = document.getElementById('macroDistributionPieChart').getContext('2d');
    if (macroPieChartInstance) macroPieChartInstance.destroy();

    if (totalEarnings === 0 && totalExpenses === 0) {
        ctx.clearRect(0, 0, 300, 300);
        return;
    }

    macroPieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Total Earnings (₹)', 'Total Expenses (₹)', 'Saved Money (₹)'],
            datasets: [{
                data: [totalEarnings, totalExpenses, totalSavings],
                backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
                borderColor: '#0f172a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'monospace', size: 11 } }
                }
            }
        }
    });
}

/**
 * 4. SECURE SHARING SYSTEM
 * Packs ONLY expense titles and costs into a shareable link.
 * Income/Savings values are kept hidden.
 */
function generateSecureSharePayload() {
    if (expenses.length === 0) {
        showNotification("No Data", "Your expense list is empty. There is nothing to share!");
        return;
    }

    // Isolate only standard names and values
    const safePayload = expenses.map(e => ({ d: e.desc, a: e.amount, c: e.category }));
    const base64Packet = btoa(JSON.stringify(safePayload));
    const uniqueTransmissionUrl = `${window.location.origin}${window.location.pathname}?sharePacket=${base64Packet}`;

    navigator.clipboard.writeText(uniqueTransmissionUrl).then(() => {
        showNotification("Link Copied", "Your monthly expenses have been copied to the clipboard! You can now send it to anyone.");
    }).catch(() => {
        showNotification("Link Generated", `Copy this link: ${uniqueTransmissionUrl}`);
    });
}

// Checks if the user opened a shared link from someone else
function processIncomingSharedPayload() {
    const urlParams = new URLSearchParams(window.location.search);
    const packet = urlParams.get('sharePacket');
    if (!packet) return;

    try {
        const decodedString = atob(packet);
        const externalExpenses = JSON.parse(decodedString);

        setTimeout(() => {
            showNotification("Shared List Loaded", `Viewing shared expenses (${externalExpenses.length} entries found). Clear the link to return to your diary.`);
            expenses = externalExpenses.map((e, idx) => ({ id: idx, desc: e.d, amount: e.a, category: e.c, date: "Shared Item" }));
            incomes = []; obligations = [];
            switchPage('diary-page');
            renderAll();
        }, 600);
    } catch (err) {
        console.error("Could not load shared list. The link is broken.", err);
    }
}

/**
 * 5. MONTHLY ARCHIVE STORAGE MANAGER
 */
function sealAndArchiveCurrentCycle() {
    const labelInput = document.getElementById('archive-month-label');
    const periodLabel = labelInput.value.trim();

    if (!periodLabel) {
        showNotification("Input Required", "Please type a name for the month (e.g., May 2026).");
        return;
    }

    const totalEarnings = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0) + obligations.reduce((sum, item) => sum + (item.completed ? item.amount : 0), 0);
    
    const historicalNode = {
        id: Date.now(),
        period: periodLabel,
        earnings: totalEarnings,
        outflows: totalExpenses,
        savings: Math.max(0, totalEarnings - totalExpenses),
        rawSnapshot: [...expenses]
    };

    historicalArchives.unshift(historicalNode);
    
    // Clear current month's lists to start fresh
    expenses = [];
    obligations = obligations.map(o => ({ ...o, completed: false }));
    
    saveAllToStorage();
    labelInput.value = '';
    showNotification("Month Frozen", `Data safely saved under ${periodLabel}. Current sheets reset.`);
    switchPage('history-page');
}

function renderHistoricalVaultTimeline() {
    const root = document.getElementById('history-timeline-root');
    root.innerHTML = '';

    if (historicalArchives.length === 0) {
        root.innerHTML = `<p class="text-slate-600 text-center font-mono py-16 text-xs tracking-widest">⚠️ NO PREVIOUS MONTH LOGS SAVED YET.</p>`;
        return;
    }

    historicalArchives.forEach(archive => {
        const block = document.createElement('div');
        block.className = "relative pl-8 space-y-2 group";
        block.innerHTML = `
            <div class="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-cyan-500 border-4 border-slate-950"></div>
            <div class="bg-slate-900 p-5 rounded-xl border border-slate-800/80 shadow-md">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                    <h4 class="text-sm font-black font-mono text-cyan-400 uppercase tracking-wider">${archive.period}</h4>
                    <span class="text-[10px] font-mono text-slate-500">Log ID: ${archive.id}</span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="bg-slate-950/60 p-2 rounded border border-slate-850">
                        <span class="block text-[9px] font-bold text-slate-500 uppercase">Earnings</span>
                        <span class="text-xs font-mono font-bold text-emerald-400">+₹${archive.earnings.toFixed(2)}</span>
                    </div>
                    <div class="bg-slate-950/60 p-2 rounded border border-slate-850">
                        <span class="block text-[9px] font-bold text-slate-500 uppercase">Expenses</span>
                        <span class="text-xs font-mono font-bold text-red-400">-₹${archive.outflows.toFixed(2)}</span>
                    </div>
                    <div class="bg-slate-950/60 p-2 rounded border border-slate-850">
                        <span class="block text-[9px] font-bold text-slate-500 uppercase">Savings</span>
                        <span class="text-xs font-mono font-bold text-blue-400">₹${archive.savings.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
        root.appendChild(block);
    });
}

/**
 * 6. RECURRING INCOME AND EXPENSE CORE PROCESSORS
 */
document.getElementById('income-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const source = document.getElementById('inc-source').value.trim();
    const amount = parseFloat(document.getElementById('inc-amount').value);
    const type = document.getElementById('inc-type').value;
    incomes.push({ id: Date.now(), source, amount, type, date: new Date().toLocaleDateString() });
    saveAllToStorage();
    document.getElementById('income-form').reset();
    renderIncomes();
});

function deleteIncome(id) {
    incomes = incomes.filter(item => item.id !== id);
    saveAllToStorage();
    renderIncomes();
}

function renderIncomes() {
    const listEl = document.getElementById('income-list');
    const totalEl = document.getElementById('income-total');
    if (!listEl) return;
    listEl.innerHTML = '';
    let totalInflow = 0;

    if (incomes.length === 0) {
        listEl.innerHTML = `<p class="text-slate-600 text-center py-16 font-mono text-xs tracking-widest">⚠️ NO ACTIVE INCOME ENTRIES ADDED.</p>`;
        totalEl.innerText = "₹0.00";
        updateNetLiquidityMatrix(0);
        return;
    }
    incomes.forEach(item => {
        totalInflow += item.amount;
        const li = document.createElement('li');
        li.className = "flex justify-between items-center bg-slate-950/80 p-4 rounded-xl border border-slate-850";
        li.innerHTML = `
            <div class="space-y-1">
                <p class="font-bold text-slate-200 text-sm">${item.source}</p>
                <div class="flex gap-2 items-center text-[10px]">
                    <span class="font-mono uppercase bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">${item.type}</span>
                    <span class="text-slate-500 font-mono">${item.date}</span>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <span class="font-mono font-bold text-emerald-400 text-sm">+₹${item.amount.toFixed(2)}</span>
                <button onclick="deleteIncome(${item.id})" class="text-slate-600 hover:text-red-400 font-black px-1 text-xs">✕</button>
            </div>
        `;
        listEl.appendChild(li);
    });
    totalEl.innerText = `₹${totalInflow.toFixed(2)}`;
    updateNetLiquidityMatrix(totalInflow);
}

function updateNetLiquidityMatrix(totalInflow) {
    const totalOutflow = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalFixedObligations = obligations.reduce((sum, item) => sum + (item.completed ? 0 : item.amount), 0);
    const balance = totalInflow - totalOutflow - totalFixedObligations;
    const walletEl = document.getElementById('net-wallet-status');
    if (walletEl) {
        walletEl.innerText = `₹${balance.toFixed(2)}`;
        walletEl.className = balance < 0 ? "font-mono font-bold text-red-400 text-base" : "font-mono font-bold text-emerald-400 text-base";
    }
}

document.getElementById('expense-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('exp-desc').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const category = document.getElementById('exp-category').value;
    expenses.push({ id: Date.now(), desc, amount, category, date: new Date().toLocaleDateString() });
    saveAllToStorage();
    document.getElementById('expense-form').reset();
    renderExpenses();
});

function deleteExpense(id) {
    expenses = expenses.filter(item => item.id !== id);
    saveAllToStorage();
    renderExpenses();
}

function renderExpenses() {
    const listEl = document.getElementById('expense-list');
    const totalEl = document.getElementById('diary-total');
    if (!listEl) return;
    listEl.innerHTML = '';
    let totalSum = 0;
    let chartMetrics = { "Operational": 0, "Academics/Growth": 0, "Logistics/Utilities": 0, "Leisure": 0 };

    if (expenses.length === 0) {
        listEl.innerHTML = `<p class="text-slate-600 text-center py-20 font-mono text-xs tracking-widest">⚠️ NO EXPENSES RECORDED THIS MONTH.</p>`;
        if (totalEl) totalEl.innerText = "₹0.00";
        initMiniChartDataMatrix(chartMetrics);
        updateNetLiquidityMatrix(incomes.reduce((sum, item) => sum + item.amount, 0));
        return;
    }
    expenses.forEach(item => {
        totalSum += item.amount;
        if (chartMetrics[item.category] !== undefined) chartMetrics[item.category] += item.amount;
        const li = document.createElement('li');
        li.className = "flex justify-between items-center bg-slate-950/80 p-4 rounded-xl border border-slate-850";
        li.innerHTML = `
            <div class="space-y-1">
                <p class="font-bold text-slate-200 text-sm">${item.desc}</p>
                <div class="flex gap-2 items-center text-[10px]">
                    <span class="font-mono uppercase bg-slate-800 text-blue-400 px-2 py-0.5 rounded">${item.category}</span>
                    <span class="text-slate-500 font-mono">${item.date}</span>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <span class="font-mono font-bold text-red-400 text-sm">-₹${item.amount.toFixed(2)}</span>
                <button onclick="deleteExpense(${item.id})" class="text-slate-600 hover:text-red-400 font-black px-1 text-xs">✕</button>
            </div>
        `;
        listEl.appendChild(li);
    });
    if (totalEl) totalEl.innerText = `₹${totalSum.toFixed(2)}`;
    initMiniChartDataMatrix(chartMetrics);
    updateNetLiquidityMatrix(incomes.reduce((sum, item) => sum + item.amount, 0));
}

function initMiniChartDataMatrix(chartValues) {
    const canvas = document.getElementById('categoryMiniChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (miniChartInstance) miniChartInstance.destroy();
    miniChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(chartValues),
            datasets: [{
                data: Object.values(chartValues),
                backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899'],
                borderRadius: 4,
                barThickness: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { display: false }, y: { display: false } },
            plugins: { legend: { display: false } }
        }
    });
}

document.getElementById('checklist-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('chk-title').value.trim();
    const amount = parseFloat(document.getElementById('chk-amount').value);
    obligations.push({ id: Date.now(), title, amount, completed: false });
    saveAllToStorage();
    document.getElementById('checklist-form').reset();
    renderObligations();
});

function toggleObligationStatus(id) {
    obligations = obligations.map(o => o.id === id ? { ...o, completed: !o.completed } : o);
    saveAllToStorage();
    renderObligations();
}

function deleteObligationElement(id) {
    obligations = obligations.filter(o => o.id !== id);
    saveAllToStorage();
    renderObligations();
}

function renderObligations() {
    const listEl = document.getElementById('checklist-items-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    if (obligations.length === 0) {
        listEl.innerHTML = `<p class="text-slate-600 text-center font-mono py-12 text-xs tracking-widest">⚠️ NO FIXED BILLS REGISTERED.</p>`;
        return;
    }
    obligations.forEach(o => {
        const li = document.createElement('li');
        li.className = `flex justify-between items-center p-4 rounded-xl border ${o.completed ? 'bg-purple-950/20 border-purple-900/50 opacity-75' : 'bg-slate-950 border-slate-850'}`;
        li.innerHTML = `
            <div class="flex items-center gap-3">
                <input type="checkbox" ${o.completed ? 'checked' : ''} onchange="toggleObligationStatus(${o.id})" class="w-4 h-4 rounded accent-purple-500 cursor-pointer">
                <span class="text-sm ${o.completed ? 'line-through text-slate-500' : 'text-slate-200'}">${o.title}</span>
            </div>
            <div class="flex items-center gap-4">
                <span class="font-mono text-sm font-bold ${o.completed ? 'text-slate-500' : 'text-purple-400'}">₹${o.amount.toFixed(2)}</span>
                <button onclick="deleteObligationElement(${o.id})" class="text-slate-600 hover:text-red-400 text-xs font-bold px-1">✕</button>
            </div>
        `;
        listEl.appendChild(li);
    });
    updateNetLiquidityMatrix(incomes.reduce((sum, item) => sum + item.amount, 0));
}

/**
 * 7. HARDWARE MATH ENGINE (CALCULATOR)
 */
let calcExpression = '';
function pressCalc(value) {
    const screen = document.getElementById('calc-screen');
    if (value === 'C') {
        calcExpression = '';
        screen.value = '0';
    } else if (value === '=') {
        try {
            if (calcExpression.trim() !== '') {
                let result = new Function(`return ${calcExpression}`)();
                screen.value = Number(result.toFixed(2)).toString();
                calcExpression = screen.value;
            }
        } catch (err) {
            screen.value = 'Error';
            calcExpression = '';
        }
    } else {
        if (['+', '-', '*', '/'].includes(value) && ['+', '-', '*', '/'].includes(calcExpression.slice(-1))) return;
        calcExpression += value;
        screen.value = calcExpression;
    }
}

function useCalcAmount() {
    const screenValue = parseFloat(document.getElementById('calc-screen').value);
    if (!isNaN(screenValue) && screenValue > 0) {
        document.getElementById('exp-amount').value = screenValue;
    }
}

/**
 * 8. ANIMATED SLIDE DOWN ALERTS CREATOR
 */
function showNotification(title, description) {
    // Drop existing popups to prevent stacking bugs
    const oldOverlay = document.querySelector('.popup-overlay');
    if (oldOverlay) oldOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    overlay.innerHTML = `
        <div class="popup-box">
            <h3 class="text-base font-black text-white uppercase tracking-wide mb-1">${title}</h3>
            <p class="text-xs text-slate-400 mb-4 leading-relaxed">${description}</p>
            <button onclick="this.closest('.popup-overlay').remove()" class="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-2 rounded-lg text-xs">Dismiss Notification</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

function renderAll() {
    renderIncomes();
    renderExpenses();
    renderObligations();
}

// Check for incoming shared links on startup
processIncomingSharedPayload();

if (activeCurrentUser && !window.location.search.includes('sharePacket')) {
    switchPage('income-page');
    renderAll();
} else if (!window.location.search.includes('sharePacket')) {
    switchPage('home-page');
}