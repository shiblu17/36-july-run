document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.getElementById("searchForm");
    const phoneInput = document.getElementById("phoneInput");
    const resultsSection = document.getElementById("resultsSection");
    const successCard = document.getElementById("successCard");
    const notFoundCard = document.getElementById("notFoundCard");
    
    // Result displays
    const participantName = document.getElementById("participantName");
    const detailPhone = document.getElementById("detailPhone");
    const detailEmail = document.getElementById("detailEmail");
    const detailTx = document.getElementById("detailTx");
    const bibDisplay = document.getElementById("bibDisplay");
    const tshirtSizeDisplay = document.getElementById("tshirtSizeDisplay");
    
    const btnTryAgain = document.getElementById("btnTryAgain");

    // Handle Form Submit
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const query = phoneInput.value.trim();
        if (!query) return;

        // Perform Search
        const result = findRegistration(query);

        // Show Results section
        resultsSection.classList.remove("hidden");

        if (result) {
            // Populate data
            participantName.textContent = result.name || "N/A";
            detailPhone.textContent = maskPhoneNumber(result.phone);
            detailEmail.textContent = maskEmail(result.email);
            detailTx.textContent = maskTxId(result.tx);
            bibDisplay.textContent = result.bib || "---";
            tshirtSizeDisplay.textContent = result.size || "L";
            
            // Toggle visibility
            successCard.classList.remove("hidden");
            notFoundCard.classList.add("hidden");
            
            // Fire Confetti!
            triggerConfetti();
        } else {
            // Toggle visibility
            successCard.classList.add("hidden");
            notFoundCard.classList.remove("hidden");
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

    // Search logic helper
    function findRegistration(query) {
        // Strip everything except numbers from search query
        const cleanQuery = query.replace(/\D/g, "");
        if (!cleanQuery) return null;

        // Search in registrations database (data.js)
        // Check if global registrations exists
        if (typeof registrations === "undefined") {
            console.error("Registrations database not loaded.");
            return null;
        }

        return registrations.find(runner => {
            const cleanRunnerPhone = runner.phone.replace(/\D/g, "");
            if (!cleanRunnerPhone) return false;

            // Direct match
            if (cleanRunnerPhone === cleanQuery) return true;

            // Match last 10 digits (Standard Bangladesh mobile number length minus leading 0)
            if (cleanRunnerPhone.length >= 10 && cleanQuery.length >= 10) {
                if (cleanRunnerPhone.slice(-10) === cleanQuery.slice(-10)) return true;
            }

            // Fallback: search query is contained within stored number (or vice-versa) for shorter inputs
            if (cleanQuery.length >= 6) {
                if (cleanRunnerPhone.endsWith(cleanQuery) || cleanQuery.endsWith(cleanRunnerPhone)) {
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

    function maskTxId(tx) {
        if (!tx) return "N/A";
        if (tx.length <= 4) return tx;
        // e.g. DGI0H5BKSE -> DGI0***KSE
        return tx.substring(0, 4) + "***" + tx.substring(tx.length - 3);
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
