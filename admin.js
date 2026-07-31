document.addEventListener("DOMContentLoaded", () => {
    // Auth elements
    const loginCard = document.getElementById("loginCard");
    const loginForm = document.getElementById("loginForm");
    const passwordInput = document.getElementById("passwordInput");
    const authError = document.getElementById("authError");
    const dashboardWrapper = document.getElementById("dashboardWrapper");
    
    // Toolbar and stats
    const btnLogout = document.getElementById("btnLogout");
    const btnExport = document.getElementById("btnExport");
    const statTotal = document.getElementById("statTotal");
    const statSizes = document.getElementById("statSizes");
    const statActive = document.getElementById("statActive");
    
    // Add form & search
    const addRunnerForm = document.getElementById("addRunnerForm");
    const tableSearch = document.getElementById("tableSearch");
    const runnersTableBody = document.getElementById("runnersTableBody");

    // Default password
    const ADMIN_PASSWORD = "SHIBLU17";
    
    // Database instance
    let db = [];

    // Check auth status on load
    if (sessionStorage.getItem("isAdmin") === "true") {
        showDashboard();
    } else {
        showLogin();
    }

    // Handle Login Submit
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const pwd = passwordInput.value;
        if (pwd === ADMIN_PASSWORD) {
            sessionStorage.setItem("isAdmin", "true");
            authError.classList.add("hidden");
            passwordInput.value = "";
            showDashboard();
        } else {
            authError.classList.remove("hidden");
            passwordInput.focus();
        }
    });

    // Handle Logout
    btnLogout.addEventListener("click", () => {
        sessionStorage.removeItem("isAdmin");
        showLogin();
    });

    // Handle Export data.js
    btnExport.addEventListener("click", () => {
        exportDatabase();
    });

    // Handle Add Runner Form
    addRunnerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const name = document.getElementById("runnerName").value.trim();
        const phone = document.getElementById("runnerPhone").value.trim();
        const email = document.getElementById("runnerEmail").value.trim() || "";
        const tx = document.getElementById("runnerTx").value.trim() || "";
        const bib = document.getElementById("runnerBib").value.trim();
        const size = document.getElementById("runnerSize").value;

        // Check if BIB already exists
        const bibExists = db.some(r => r.bib === bib);
        if (bibExists) {
            alert(`Error: BIB number ${bib} is already assigned!`);
            return;
        }

        const newRunner = { tx, name, email, phone, size, bib };
        db.push(newRunner);
        saveDb();
        
        // Reset and refresh
        addRunnerForm.reset();
        renderTable();
        updateStats();
        
        alert(`Ranner successfully added! (BIB: ${bib})`);
    });

    // Handle Table Search
    tableSearch.addEventListener("input", () => {
        renderTable(tableSearch.value.trim());
    });

    // Auth screen toggling
    function showLogin() {
        loginCard.classList.remove("hidden");
        dashboardWrapper.classList.add("hidden");
    }

    function showDashboard() {
        loginCard.classList.add("hidden");
        dashboardWrapper.classList.remove("hidden");
        loadDatabase();
        updateStats();
        renderTable();
    }

    // Database loaders
    function loadDatabase() {
        const localData = localStorage.getItem("registrations");
        if (localData) {
            db = JSON.parse(localData);
        } else if (typeof registrations !== "undefined") {
            db = registrations;
            saveDb();
        } else {
            db = [];
        }
    }

    function saveDb() {
        localStorage.setItem("registrations", JSON.stringify(db));
    }

    // Stats calculations
    function updateStats() {
        statTotal.textContent = db.length;
        
        // Count runners with valid t-shirt sizes
        const sizeCount = db.filter(r => r.size && r.size !== "Other").length;
        statSizes.textContent = sizeCount;
        
        // Success registrations (if they have a BIB, they are active/successful)
        const activeCount = db.filter(r => r.bib).length;
        statActive.textContent = activeCount;
    }

    // Render Table Row
    function renderTable(filter = "") {
        runnersTableBody.innerHTML = "";
        
        let filteredDb = db;
        if (filter) {
            const cleanFilter = filter.toLowerCase();
            filteredDb = db.filter(r => 
                (r.name && r.name.toLowerCase().includes(cleanFilter)) ||
                (r.phone && r.phone.includes(cleanFilter)) ||
                (r.bib && r.bib.includes(cleanFilter)) ||
                (r.tx && r.tx.toLowerCase().includes(cleanFilter))
            );
        }

        // Sort by BIB ascending
        filteredDb.sort((a, b) => parseInt(a.bib) - parseInt(b.bib));

        if (filteredDb.length === 0) {
            runnersTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">কোনো রেকর্ড পাওয়া যায়নি।</td></tr>`;
            return;
        }

        filteredDb.forEach(runner => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${runner.bib || "N/A"}</strong></td>
                <td>${runner.name || "N/A"}</td>
                <td>${runner.phone || "N/A"}</td>
                <td><span class="tshirt-badge">${runner.size || "N/A"}</span></td>
                <td>${runner.email || "N/A"}</td>
                <td><code>${runner.tx || "N/A"}</code></td>
                <td>
                    <button class="btn-delete" data-bib="${runner.bib}" title="মুছে ফেলুন">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            
            // Delete action listener
            tr.querySelector(".btn-delete").addEventListener("click", (e) => {
                const bibToDelete = e.currentTarget.getAttribute("data-bib");
                deleteRunner(bibToDelete);
            });

            runnersTableBody.appendChild(tr);
        });
    }

    // Delete runner logic
    function deleteRunner(bib) {
        const runner = db.find(r => r.bib === bib);
        if (!runner) return;
        
        const confirmDelete = confirm(`Are you sure you want to delete registration for ${runner.name || 'Unnamed Runner'} (BIB: ${bib})?`);
        if (confirmDelete) {
            db = db.filter(r => r.bib !== bib);
            saveDb();
            renderTable(tableSearch.value.trim());
            updateStats();
        }
    }

    // Export data.js logic
    function exportDatabase() {
        // Sort database by BIB ascending before export
        const sortedDb = [...db].sort((a, b) => parseInt(a.bib) - parseInt(b.bib));

        let fileContent = `const registrations = [\n`;
        sortedDb.forEach((runner, idx) => {
            const comma = idx === sortedDb.length - 1 ? "" : ",";
            fileContent += `  { tx: ${JSON.stringify(runner.tx)}, name: ${JSON.stringify(runner.name)}, email: ${JSON.stringify(runner.email)}, phone: ${JSON.stringify(runner.phone)}, size: ${JSON.stringify(runner.size)}, bib: ${JSON.stringify(runner.bib)} }${comma}\n`;
        });
        fileContent += `];\n\nif (typeof module !== 'undefined') {\n  module.exports = registrations;\n}\n`;

        // Trigger file download
        const blob = new Blob([fileContent], { type: "application/javascript;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "data.js";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert("data.js successfully exported! Replace the data.js file in your project folder with this downloaded file, commit and push to publish changes to all users.");
    }
});
