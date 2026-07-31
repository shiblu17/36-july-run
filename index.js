document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.getElementById("searchForm");
    const phoneInput = document.getElementById("phoneInput");
    const resultsSection = document.getElementById("resultsSection");
    const successCard = document.getElementById("successCard");
    const notFoundCard = document.getElementById("notFoundCard");
    const multipleResultsCard = document.getElementById("multipleResultsCard");
    const multipleNamesList = document.getElementById("multipleNamesList");
    
    // Result displays
    const participantName = document.getElementById("participantName");
    const detailPhone = document.getElementById("detailPhone");
    const detailEmail = document.getElementById("detailEmail");
    const bibDisplay = document.getElementById("bibDisplay");
    const tshirtSizeDisplay = document.getElementById("tshirtSizeDisplay");
    
    const btnTryAgain = document.getElementById("btnTryAgain");

    // Database instance loading with cache busting version check
    let db = [];
    const localVersion = localStorage.getItem("registrations_version");
    const currentVersion = typeof dbVersion !== "undefined" ? dbVersion : "default";
    
    if (typeof registrations !== "undefined" && localVersion !== currentVersion) {
        // Reset local storage to match the updated data.js from server
        db = registrations;
        localStorage.setItem("registrations", JSON.stringify(db));
        localStorage.setItem("registrations_version", currentVersion);
    } else {
        const localData = localStorage.getItem("registrations");
        if (localData) {
            db = JSON.parse(localData);
        } else if (typeof registrations !== "undefined") {
            db = registrations;
            localStorage.setItem("registrations", JSON.stringify(db));
            localStorage.setItem("registrations_version", currentVersion);
        }
    }

    // Handle Form Submit
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const query = phoneInput.value.trim();
        if (!query) return;

        // Perform Search (returns list of matches)
        const results = findRegistrations(query);

        // Show Results section
        resultsSection.classList.remove("hidden");

        if (results.length === 0) {
            // Not Found
            successCard.classList.add("hidden");
            multipleResultsCard.classList.add("hidden");
            notFoundCard.classList.remove("hidden");
        } else if (results.length === 1) {
            // Single Match found
            multipleResultsCard.classList.add("hidden");
            notFoundCard.classList.add("hidden");
            successCard.classList.remove("hidden");
            displayRegistration(results[0]);
        } else {
            // Multiple Matches found
            successCard.classList.add("hidden");
            notFoundCard.classList.add("hidden");
            multipleResultsCard.classList.remove("hidden");
            
            // Build Select list
            multipleNamesList.innerHTML = "";
            results.forEach(runner => {
                const btn = document.createElement("button");
                btn.className = "btn-runner-select";
                
                const metaText = runner.bib 
                    ? `বিআইবি: ${runner.bib} | সাইজ: ${runner.size}` 
                    : `ভেরিফিকেশন পেন্ডিং | সাইজ: ${runner.size}`;
                
                btn.innerHTML = `
                    <div class="runner-select-info">
                        <span class="runner-select-name">${runner.name}</span>
                        <span class="runner-select-meta">${metaText}</span>
                    </div>
                    <div class="runner-select-action">
                        <span>নির্বাচন করুন</span>
                        <i class="fa-solid fa-chevron-right"></i>
                    </div>
                `;
                
                btn.addEventListener("click", () => {
                    multipleResultsCard.classList.add("hidden");
                    successCard.classList.remove("hidden");
                    displayRegistration(runner);
                });
                
                multipleNamesList.appendChild(btn);
            });
        }
        
        // Scroll results into view smoothly
        resultsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    // Reset button
    btnTryAgain.addEventListener("click", () => {
        phoneInput.value = "";
        resultsSection.classList.add("hidden");
        phoneInput.focus();
    });

    // Display Registration Data
    function displayRegistration(result) {
        // Populate data
        participantName.textContent = result.name || "N/A";
        detailPhone.textContent = maskPhoneNumber(result.phone);
        detailEmail.textContent = maskEmail(result.email);
        tshirtSizeDisplay.textContent = result.size || "L";

        // Handle BIB display and Verification Status Badge dynamically
        const statusBadge = document.getElementById("statusBadge");
        const statusIcon = document.getElementById("statusIcon");
        const statusText = document.getElementById("statusText");
        
        if (result.verify === "YES" && result.bib) {
            // Registration Successful
            statusBadge.className = "status-badge success animate-pulse";
            statusIcon.className = "fa-solid fa-circle-check";
            statusText.textContent = "রেজিস্ট্রেশন সফল হয়েছে";
            bibDisplay.textContent = result.bib;
            
            // Fire Confetti!
            triggerConfetti();
        } else {
            // Registration Pending Verification
            statusBadge.className = "status-badge pending animate-pulse";
            statusIcon.className = "fa-solid fa-triangle-exclamation";
            statusText.textContent = "ভেরিফিকেশন পেন্ডিং";
            bibDisplay.textContent = "PENDING";
        }
    }

    // Search logic helper
    function findRegistrations(query) {
        // Strip everything except numbers from search query
        const cleanQuery = query.replace(/\D/g, "");
        if (!cleanQuery) return [];

        // Search in loaded db instance
        return db.filter(runner => {
            const cleanRunnerPhone = runner.phone.replace(/\D/g, "");
            if (!cleanRunnerPhone) return false;

            // Direct match
            if (cleanRunnerPhone === cleanQuery) return true;

            // Match last 10 digits (Standard Bangladesh mobile number length minus leading 0)
            if (cleanRunnerPhone.length >= 10 && cleanQuery.length >= 10) {
                if (cleanRunnerPhone.slice(-10) === cleanQuery.slice(-10)) return true;
            }

            // Fallback: search query is contained within stored number (or vice-versa) for shorter/longer inputs
            if (cleanQuery.length >= 6) {
                if (cleanRunnerPhone.includes(cleanQuery) || cleanQuery.includes(cleanRunnerPhone)) {
                    return true;
                }
                
                // Also match last 10 digits if query is a substring of stored number
                const last10Query = cleanQuery.slice(-10);
                if (cleanRunnerPhone.includes(last10Query)) {
                    return true;
                }
            }

            return false;
        });
    }

    // Masking helpers for privacy
    function maskPhoneNumber(phone) {
        const clean = phone.replace(/\D/g, "");
        if (clean.length < 6) return phone;
        // Show first 3 and last 3 digits, mask middle
        return clean.substring(0, 3) + "XXXX" + clean.substring(clean.length - 4);
    }

    function maskEmail(email) {
        if (!email || !email.includes("@")) return "N/A";
        const parts = email.split("@");
        const local = parts[0];
        const domain = parts[1];
        if (local.length <= 2) {
            return local[0] + "***@" + domain;
        }
        return local.substring(0, 2) + "***" + local.substring(local.length - 1) + "@" + domain;
    }


    // Confetti Animation Burst
    function triggerConfetti() {
        // Duration of confetti
        const duration = 2.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, animate a bit higher than random
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }
});
