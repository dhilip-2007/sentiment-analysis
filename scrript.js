
/* ============================================
   SENTILYTICS - SENTIMENT ANALYSIS APP
   Beginner-friendly JavaScript
============================================ */

/* 1. App state */

const STORAGE_KEY = "sentilytics_history";

let analysisHistory = loadHistory();
let currentResult = null;


/* 2. Sentiment dictionaries */

const positiveWords = [
    "good", "great", "excellent", "amazing", "awesome",
    "wonderful", "fantastic", "best", "love", "loved",
    "like", "liked", "happy", "enjoy", "enjoyed",
    "beautiful", "perfect", "brilliant", "super", "nice",
    "helpful", "friendly", "easy", "fast", "success",
    "successful", "impressive", "recommend", "delightful",
    "outstanding", "positive", "favorite", "fresh",
    "comfortable", "useful", "reliable", "smooth",
    "exciting", "satisfied", "worth", "pleased", "thank"
];

const negativeWords = [
    "bad", "worst", "terrible", "awful", "horrible",
    "hate", "hated", "dislike", "angry", "sad",
    "boring", "poor", "slow", "broken", "failed",
    "failure", "problem", "problems", "difficult",
    "disappointing", "disappointed", "useless", "waste",
    "expensive", "annoying", "unhappy", "negative",
    "dirty", "rude", "confusing", "error", "errors",
    "bug", "bugs", "painful", "ugly", "late",
    "unreliable", "frustrating", "frustrated", "regret",
    "complaint", "complaints", "refund"
];

const neutralWords = [
    "okay", "ok", "average", "normal", "ordinary",
    "standard", "regular", "moderate", "fine",
    "acceptable", "typical", "common"
];

/* Words that can reverse the meaning of nearby words. */

const negationWords = [
    "not", "no", "never", "neither", "hardly",
    "cannot", "can't", "isn't", "wasn't", "don't",
    "doesn't", "didn't", "won't", "wouldn't",
    "couldn't", "shouldn't", "nothing"
];

/* Words that increase or reduce sentiment strength. */

const intensifiers = {
    "very": 1.5,
    "really": 1.4,
    "extremely": 1.8,
    "absolutely": 1.7,
    "incredibly": 1.7,
    "so": 1.3,
    "too": 1.2,
    "slightly": 0.6,
    "somewhat": 0.7,
    "barely": 0.5,
    "quite": 1.2
};


/* 3. Find elements safely */

function getElement(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = getElement(id);

    if (element) {
        element.textContent = value;
    }
}

function showElement(id) {
    const element = getElement(id);

    if (element) {
        element.classList.remove("hidden");
    }
}

function hideElement(id) {
    const element = getElement(id);

    if (element) {
        element.classList.add("hidden");
    }
}


/* 4. Show notifications */

function showToast(message) {
    let toast = getElement("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


/* 5. Read and save history */

function loadHistory() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn("Could not load analysis history.", error);
        return [];
    }
}

function saveHistory() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(analysisHistory)
        );
    } catch (error) {
        console.warn("Could not save history.", error);
        showToast("Unable to save history in this browser.");
    }
}


/* 6. Normalize input text */

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[’‘]/g, "'")
        .replace(/[^a-z0-9'\s!?.,-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getTokens(text) {
    return normalizeText(text)
        .split(/\s+/)
        .filter(Boolean);
}


/* 7. Check dictionary membership */

function isPositive(word) {
    return positiveWords.includes(word);
}

function isNegative(word) {
    return negativeWords.includes(word);
}

function isNeutral(word) {
    return neutralWords.includes(word);
}


/* 8. Check whether a word is negated */

function isNegated(tokens, index) {
    const start = Math.max(0, index - 3);

    for (let i = start; i < index; i++) {
        if (negationWords.includes(tokens[i])) {
            return true;
        }
    }

    return false;
}


/* 9. Get nearby intensity */

function getIntensity(tokens, index) {
    if (index <= 0) {
        return 1;
    }

    const previousWord = tokens[index - 1];

    return intensifiers[previousWord] || 1;
}


/* 10. Calculate sentiment */

function calculateSentiment(text) {
    const normalized = normalizeText(text);
    const tokens = getTokens(text);

    let positiveScore = 0;
    let negativeScore = 0;
    let neutralCount = 0;

    const matchedPositive = [];
    const matchedNegative = [];
    const matchedNeutral = [];

    tokens.forEach((word, index) => {
        const negated = isNegated(tokens, index);
        const intensity = getIntensity(tokens, index);

        if (isPositive(word)) {
            if (negated) {
                negativeScore += intensity;
                matchedNegative.push(word);
            } else {
                positiveScore += intensity;
                matchedPositive.push(word);
            }
        } else if (isNegative(word)) {
            if (negated) {
                positiveScore += intensity;
                matchedPositive.push(word);
            } else {
                negativeScore += intensity;
                matchedNegative.push(word);
            }
        } else if (isNeutral(word)) {
            neutralCount++;
            matchedNeutral.push(word);
        }
    });

    /*
       Handle common phrases that a simple word dictionary
       may misunderstand.
    */

    if (/\bnot bad\b/.test(normalized)) {
        negativeScore = Math.max(0, negativeScore - 1);
        positiveScore += 1;
    }

    if (/\bnot good\b/.test(normalized)) {
        positiveScore = Math.max(0, positiveScore - 1);
        negativeScore += 1;
    }

    if (/\bvery bad\b/.test(normalized)) {
        negativeScore += 0.5;
    }

    if (/\bno problem\b/.test(normalized)) {
        positiveScore += 0.5;
    }

    if (/\bnot only\b/.test(normalized)) {
        // "Not only" is not usually a negative phrase.
        positiveScore = Math.max(0, positiveScore);
    }

    /*
       Exclamation marks can add emphasis, but do not
       determine sentiment on their own.
    */

    const exclamationCount = (text.match(/!/g) || []).length;

    if (exclamationCount > 0) {
        if (positiveScore > negativeScore) {
            positiveScore += Math.min(exclamationCount * 0.15, 0.6);
        } else if (negativeScore > positiveScore) {
            negativeScore += Math.min(exclamationCount * 0.15, 0.6);
        }
    }

    let sentiment = "Neutral";
    let score = 0;

    if (positiveScore > negativeScore) {
        sentiment = "Positive";
        score = positiveScore - negativeScore;
    } else if (negativeScore > positiveScore) {
        sentiment = "Negative";
        score = negativeScore - positiveScore;
    }

    /*
       This confidence value is a heuristic, not a
       calibrated machine-learning probability.
    */

    const totalScore = positiveScore + negativeScore;

    let confidence = 50;

    if (totalScore > 0) {
        confidence =
            50 + (Math.abs(positiveScore - negativeScore) /
            totalScore) * 45;

        confidence = Math.min(95, Math.round(confidence));
    } else if (neutralCount > 0) {
        confidence = 65;
    }

    if (tokens.length <= 2 && totalScore > 0) {
        confidence = Math.min(confidence, 75);
    }

    const wordCount = tokens.length;

    return {
        sentiment,
        confidence,
        positiveScore,
        negativeScore,
        neutralCount,
        wordCount,
        positiveWords: [...new Set(matchedPositive)],
        negativeWords: [...new Set(matchedNegative)],
        neutralWords: [...new Set(matchedNeutral)],
        score
    };
}


/* 11. Generate result explanation */

function getExplanation(result) {
    if (result.sentiment === "Positive") {
        return "The text contains more positive words than negative words. The app classified the overall tone as positive.";
    }

    if (result.sentiment === "Negative") {
        return "The text contains more negative words than positive words. The app classified the overall tone as negative.";
    }

    return "The text has balanced sentiment, neutral words, or no words recognized by the dictionary. The app classified the tone as neutral.";
}


/* 12. Display sentiment result */

function displayResult(text, result) {
    const resultBox = getElement("resultBox");

    if (!resultBox) {
        console.warn(
            'Result area not found. Add an element with id="resultBox".'
        );
        return;
    }

    resultBox.classList.add("visible");

    const resultHeading = getElement("resultHeading");

    if (resultHeading) {
        resultHeading.className = "result-heading " +
            result.sentiment.toLowerCase();
    }

    const emojiMap = {
        Positive: "😊",
        Negative: "😞",
        Neutral: "😐"
    };

    setText("resultEmoji", emojiMap[result.sentiment]);
    setText("resultTitle", result.sentiment + " Sentiment");
    setText("resultSubtitle", "Analysis completed successfully");

    setText("confidenceValue", result.confidence + "%");
    setText("resultExplanation", getExplanation(result));

    const progressBar = getElement("confidenceBar");

    if (progressBar) {
        progressBar.className =
            "progress-bar " + result.sentiment.toLowerCase();

        progressBar.style.width = result.confidence + "%";
    }

    setText("resultWordCount", result.wordCount);
    setText("resultPositiveCount", result.positiveWords.length);
    setText("resultNegativeCount", result.negativeWords.length);

    displayImportantWords(result);
    displayBreakdown(result);

    resultBox.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


/* 13. Display important words */

function displayImportantWords(result) {
    const container = getElement("importantWords");

    if (!container) {
        return;
    }

    container.replaceChildren();

    const words = [
        ...result.positiveWords.map(word => ({
            word,
            type: "positive"
        })),
        ...result.negativeWords.map(word => ({
            word,
            type: "negative"
        })),
        ...result.neutralWords.map(word => ({
            word,
            type: "neutral"
        }))
    ];

    if (words.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent =
            "No sentiment-related words were recognized.";
        container.appendChild(empty);
        return;
    }

    words.forEach(item => {
        const chip = document.createElement("span");

        chip.className = "word-chip " + item.type;
        chip.textContent = item.word;

        container.appendChild(chip);
    });
}


/* 14. Display sentiment breakdown */

function displayBreakdown(result) {
    const total =
        result.positiveWords.length +
        result.negativeWords.length +
        result.neutralWords.length;

    let positivePercent = 0;
    let negativePercent = 0;
    let neutralPercent = 0;

    if (total > 0) {
        positivePercent = Math.round(
            result.positiveWords.length / total * 100
        );

        negativePercent = Math.round(
            result.negativeWords.length / total * 100
        );

        neutralPercent = Math.max(
            0,
            100 - positivePercent - negativePercent
        );
    }

    setText("positivePercent", positivePercent + "%");
    setText("negativePercent", negativePercent + "%");
    setText("neutralPercent", neutralPercent + "%");

    const positiveBar = getElement("positiveBar");
    const negativeBar = getElement("negativeBar");
    const neutralBar = getElement("neutralBar");

    if (positiveBar) {
        positiveBar.style.width = positivePercent + "%";
    }

    if (negativeBar) {
        negativeBar.style.width = negativePercent + "%";
    }

    if (neutralBar) {
        neutralBar.style.width = neutralPercent + "%";
    }
}


/* 15. Run analysis */

function analyzeText() {
    const input = getElement("textInput");

    if (!input) {
        showToast('Text box with id="textInput" was not found.');
        return;
    }

    const text = input.value.trim();

    if (!text) {
        showToast("Please enter some text to analyze.");
        input.focus();
        return;
    }

    if (text.length > 10000) {
        showToast("Please keep the text under 10,000 characters.");
        return;
    }

    const result = calculateSentiment(text);

    currentResult = {
        id: createId(),
        text,
        sentiment: result.sentiment,
        confidence: result.confidence,
        wordCount: result.wordCount,
        date: new Date().toISOString(),
        positiveWords: result.positiveWords,
        negativeWords: result.negativeWords,
        neutralWords: result.neutralWords
    };

    analysisHistory.unshift(currentResult);

    // Keep recent history manageable.
    analysisHistory = analysisHistory.slice(0, 100);

    saveHistory();
    displayResult(text, result);
    renderHistory();
    updateStatistics();

    showToast("Sentiment analysis completed!");
}


/* 16. Create a unique result ID */

function createId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}


/* 17. Insert example text */

function useExample(type) {
    const examples = {
        positive:
            "I absolutely love this application! It is amazing, fast, helpful, and easy to use.",

        negative:
            "I hate this product. It is terrible, slow, confusing, and disappointing.",

        neutral:
            "The product arrived today. It has a standard design and normal features.",

        mixed:
            "The design is beautiful, but the application is slow and frustrating.",

        short:
            "Great service!"
    };

    const input = getElement("textInput");

    if (!input) {
        showToast('Text box with id="textInput" was not found.');
        return;
    }

    input.value = examples[type] || examples.positive;

    updateCharacterCount();
    input.focus();
}


/* 18. Clear the input */

function clearInput() {
    const input = getElement("textInput");

    if (input) {
        input.value = "";
        input.focus();
    }

    updateCharacterCount();

    const resultBox = getElement("resultBox");

    if (resultBox) {
        resultBox.classList.remove("visible");
    }

    currentResult = null;
}


/* 19. Character and word count */

function updateCharacterCount() {
    const input = getElement("textInput");

    if (!input) {
        return;
    }

    const text = input.value;
    const words = getTokens(text).length;

    setText("characterCount", text.length);
    setText("liveWordCount", words);

    const characterCount = getElement("characterCount");

    if (characterCount) {
        characterCount.classList.toggle(
            "over-limit",
            text.length > 10000
        );
    }
}


/* 20. Render history table */

function renderHistory(searchTerm = "") {
    const tbody = getElement("historyBody");

    if (!tbody) {
        return;
    }

    tbody.replaceChildren();

    const query = searchTerm.toLowerCase().trim();

    const filtered = analysisHistory.filter(item => {
        return (
            item.text.toLowerCase().includes(query) ||
            item.sentiment.toLowerCase().includes(query)
        );
    });

    if (filtered.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-state";
        cell.textContent = query
            ? "No matching analyses found."
            : "No analyses yet. Analyze some text to get started.";

        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    filtered.forEach(item => {
        const row = document.createElement("tr");

        const textCell = document.createElement("td");
        textCell.className = "table-text";
        textCell.textContent = item.text;
        textCell.title = item.text;

        const sentimentCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className =
            "pill " + item.sentiment.toLowerCase();

        badge.textContent = item.sentiment;
        sentimentCell.appendChild(badge);

        const confidenceCell = document.createElement("td");
        confidenceCell.textContent = item.confidence + "%";

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(item.date);

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-row";
        deleteButton.textContent = "Delete";
        deleteButton.type = "button";
        deleteButton.dataset.id = item.id;
        deleteButton.setAttribute(
            "aria-label",
            "Delete analysis"
        );

        actionCell.appendChild(deleteButton);

        row.append(
            textCell,
            sentimentCell,
            confidenceCell,
            dateCell,
            actionCell
        );

        tbody.appendChild(row);
    });
}


/* 21. Format date and time */

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* 22. Delete a history record */

function deleteHistoryItem(id) {
    const before = analysisHistory.length;

    analysisHistory = analysisHistory.filter(
        item => item.id !== id
    );

    if (analysisHistory.length === before) {
        return;
    }

    saveHistory();
    renderHistory(getSearchTerm());
    updateStatistics();

    showToast("Analysis removed from history.");
}


/* 23. Clear all history */

function clearHistory() {
    if (analysisHistory.length === 0) {
        showToast("Your history is already empty.");
        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to delete all analysis history?"
    );

    if (!confirmed) {
        return;
    }

    analysisHistory = [];
    currentResult = null;

    saveHistory();
    renderHistory();
    updateStatistics();

    showToast("All history has been cleared.");
}


/* 24. Read search term */

function getSearchTerm() {
    const search = getElement("historySearch");

    return search ? search.value : "";
}


/* 25. Update dashboard statistics */

function updateStatistics() {
    const total = analysisHistory.length;

    const positive = analysisHistory.filter(
        item => item.sentiment === "Positive"
    ).length;

    const negative = analysisHistory.filter(
        item => item.sentiment === "Negative"
    ).length;

    const neutral = analysisHistory.filter(
        item => item.sentiment === "Neutral"
    ).length;

    const averageConfidence = total > 0
        ? Math.round(
            analysisHistory.reduce(
                (sum, item) => sum + item.confidence,
                0
            ) / total
        )
        : 0;

    setText("totalAnalyses", total);
    setText("totalPositive", positive);
    setText("totalNegative", negative);
    setText("totalNeutral", neutral);
    setText("averageConfidence", averageConfidence + "%");

    setText("positiveCount", positive);
    setText("negativeCount", negative);
    setText("neutralCount", neutral);

    const positivePercent = total
        ? Math.round(positive / total * 100)
        : 0;

    const negativePercent = total
        ? Math.round(negative / total * 100)
        : 0;

    const neutralPercent = Math.max(
        0,
        100 - positivePercent - negativePercent
    );

    setText("dashboardPositivePercent", positivePercent + "%");
    setText("dashboardNegativePercent", negativePercent + "%");
    setText("dashboardNeutralPercent", neutralPercent + "%");

    const dashboardPositiveBar = getElement(
        "dashboardPositiveBar"
    );

    const dashboardNegativeBar = getElement(
        "dashboardNegativeBar"
    );

    const dashboardNeutralBar = getElement(
        "dashboardNeutralBar"
    );

    if (dashboardPositiveBar) {
        dashboardPositiveBar.style.width =
            positivePercent + "%";
    }

    if (dashboardNegativeBar) {
        dashboardNegativeBar.style.width =
            negativePercent + "%";
    }

    if (dashboardNeutralBar) {
        dashboardNeutralBar.style.width =
            neutralPercent + "%";
    }
}


/* 26. Export history as CSV */

function exportCSV() {
    if (analysisHistory.length === 0) {
        showToast("There is no history to export.");
        return;
    }

    const headers = [
        "Text",
        "Sentiment",
        "Confidence",
        "Word Count",
        "Date"
    ];

    const rows = analysisHistory.map(item => [
        item.text,
        item.sentiment,
        item.confidence + "%",
        item.wordCount,
        formatDate(item.date)
    ]);

    const csvCell = value => {
        let safeValue = String(value ?? "");

        /*
           Reduce the risk of spreadsheet formula execution
           when opening CSV files in spreadsheet programs.
        */

        if (/^[\s]*[=+\-@\t\r]/.test(safeValue)) {
            safeValue = "'" + safeValue;
        }

        return '"' + safeValue.replace(/"/g, '""') + '"';
    };

    const csvContent = [headers, ...rows]
        .map(row => row.map(csvCell).join(","))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "sentiment-analysis-history.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showToast("CSV export started.");
}


/* 27. Copy current result */

async function copyResult() {
    if (!currentResult) {
        showToast("Analyze some text first.");
        return;
    }

    const content = [
        "Sentiment Analysis Result",
        "-------------------------",
        "Text: " + currentResult.text,
        "Sentiment: " + currentResult.sentiment,
        "Confidence estimate: " + currentResult.confidence + "%",
        "Word count: " + currentResult.wordCount,
        "Date: " + formatDate(currentResult.date),
        "",
        "Note: This result uses a simple dictionary-based method."
    ].join("\n");

    try {
        await navigator.clipboard.writeText(content);
        showToast("Result copied to clipboard!");
    } catch (error) {
        /*
           Clipboard access may require HTTPS or localhost.
        */

        const temporary = document.createElement("textarea");

        temporary.value = content;
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";

        document.body.appendChild(temporary);
        temporary.select();

        const copied = document.execCommand("copy");
        temporary.remove();

        showToast(
            copied
                ? "Result copied to clipboard!"
                : "Copy failed. Please copy the result manually."
        );
    }
}


/* 28. Print current page */

function printResults() {
    if (!currentResult) {
        showToast("Analyze some text before printing.");
        return;
    }

    window.print();
}


/* 29. Navigation between sections */

function setupNavigation() {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => {
            document.querySelectorAll(".nav-link")
                .forEach(item => item.classList.remove("active"));

            link.classList.add("active");

            const target = link.dataset.target;

            if (target) {
                const section = getElement(target);

                if (section) {
                    section.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            }
        });
    });
}


/* 30. Connect buttons to functions */

function setupEventListeners() {
    const analyzeButton = getElement("analyzeButton");
    const clearButton = getElement("clearButton");
    const clearHistoryButton = getElement("clearHistoryButton");
    const exportButton = getElement("exportButton");
    const copyButton = getElement("copyButton");
    const printButton = getElement("printButton");
    const textInput = getElement("textInput");
    const historySearch = getElement("historySearch");
    const historyBody = getElement("historyBody");

    if (analyzeButton) {
        analyzeButton.addEventListener("click", analyzeText);
    }

    if (clearButton) {
        clearButton.addEventListener("click", clearInput);
    }

    if (clearHistoryButton) {
        clearHistoryButton.addEventListener(
            "click",
            clearHistory
        );
    }

    if (exportButton) {
        exportButton.addEventListener("click", exportCSV);
    }

    if (copyButton) {
        copyButton.addEventListener("click", copyResult);
    }

    if (printButton) {
        printButton.addEventListener("click", printResults);
    }

    if (textInput) {
        textInput.addEventListener(
            "input",
            updateCharacterCount
        );

        textInput.addEventListener("keydown", event => {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key === "Enter"
            ) {
                analyzeText();
            }
        });
    }

    if (historySearch) {
        historySearch.addEventListener("input", () => {
            renderHistory(historySearch.value);
        });
    }

    if (historyBody) {
        /*
           Event delegation allows delete buttons to work
           even when table rows are recreated.
        */

        historyBody.addEventListener("click", event => {
            const button = event.target.closest(".delete-row");

            if (button && button.dataset.id) {
                deleteHistoryItem(button.dataset.id);
            }
        });
    }

    document.querySelectorAll("[data-example]").forEach(button => {
        button.addEventListener("click", () => {
            useExample(button.dataset.example);
        });
    });

    setupNavigation();
}


/* 31. Initialize application */

function initializeApp() {
    setupEventListeners();
    updateCharacterCount();
    renderHistory();
    updateStatistics();

    /*
       Optional: show today's date if the HTML has
       an element with id="currentDate".
    */

    const currentDate = getElement("currentDate");

    if (currentDate) {
        currentDate.textContent =
            new Date().toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric"
            });
    }

    console.log("Sentilytics initialized successfully.");
}


/* 32. Start after HTML has loaded */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );
} else {
    initializeApp();
}
