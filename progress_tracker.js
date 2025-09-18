import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
    getFirestore,
    collection,
    getDocs,
    setDoc,
    deleteDoc,
    doc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
    "projectId": "fitness-tracker-app-92104",
    "appId": "1:168375783884:web:804c8ffbcacab93efccd69",
    "storageBucket": "fitness-tracker-app-92104.firebasestorage.app",
    "apiKey": "AIzaSyDRXpla8dug0hsjsZ-gSKnPVZwlk2in5J0",
    "authDomain": "fitness-tracker-app-92104.firebaseapp.com",
    "messagingSenderId": "168375783884"
};

function main() {
    // --- DOM Elements ---
    const monthYearDisplay = document.getElementById('month-year-display');
    const calendarGrid = document.getElementById('calendar-grid');
    const weekdayHeader = document.getElementById('weekday-header');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const totalDaysCount = document.getElementById('total-days-count');
    const weeklyStreakCount = document.getElementById('weekly-streak-count'); // New
    const currentStreakCount = document.getElementById('current-streak-count');
    const longestStreakCount = document.getElementById('longest-streak-count');
    const errorContainer = document.getElementById('error-container');

    // --- Validate Elements ---
    const requiredElements = [monthYearDisplay, calendarGrid, weekdayHeader, prevMonthBtn, nextMonthBtn, totalDaysCount, weeklyStreakCount, currentStreakCount, longestStreakCount, errorContainer];
    if (requiredElements.some(el => !el)) {
        throw new Error("One or more essential HTML elements for the calendar are missing. Check the element IDs in progress_tracker.html.");
    }

    // --- State ---
    let currentDate = new Date();
    let completedDates = new Set();

    // Initialize Firebase
    const db = getFirestore(initializeApp(firebaseConfig));

    // --- Functions ---
    function renderWeekdayHeader() {
        errorContainer.style.display = 'none';
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdayHeader.innerHTML = '';
        weekdays.forEach(day => {
            const dayLabel = document.createElement('div');
            dayLabel.textContent = day;
            weekdayHeader.appendChild(dayLabel);
        });
    }

    async function fetchCompletedDates() {
        const querySnapshot = await getDocs(collection(db, 'workout_days'));
        completedDates.clear();
        querySnapshot.forEach(doc => {
            completedDates.add(doc.id);
        });
    }

    async function renderCalendar() {
        await fetchCompletedDates();
        calendarGrid.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        monthYearDisplay.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const lastDateOfMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarGrid.appendChild(document.createElement('div'));
        }

        for (let i = 1; i <= lastDateOfMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = i.toString();

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const cellDate = new Date(dateStr);
            cellDate.setHours(0, 0, 0, 0);

            if (cellDate.getTime() === today.getTime()) {
                dayCell.classList.add('current-day');
            }

            if (completedDates.has(dateStr)) {
                dayCell.classList.add('done');
            }

            dayCell.addEventListener('click', () => toggleDate(dateStr, dayCell, db));
            calendarGrid.appendChild(dayCell);
        }

        updateAllStats();
    }

    async function toggleDate(dateStr, cell, db) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cellDate = new Date(dateStr);

        if (cellDate > today) {
            console.log("Cannot log workouts for future dates.");
            return;
        }

        if (completedDates.has(dateStr)) {
            completedDates.delete(dateStr);
            cell.classList.remove('done');
            await deleteDoc(doc(db, "workout_days", dateStr));
        } else {
            completedDates.add(dateStr);
            cell.classList.add('done');
            await setDoc(doc(db, "workout_days", dateStr), { completed: true });
        }
        updateAllStats();
    }

    function calculateStreaks() {
        if (completedDates.size === 0) {
            return { currentStreak: 0, longestStreak: 0 };
        }

        const sortedDates = [...completedDates].map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());

        let longestStreak = 0;
        let currentStreak = 0;

        if (sortedDates.length > 0) {
            longestStreak = 1;
            currentStreak = 1;
        }

        for (let i = 1; i < sortedDates.length; i++) {
            const diff = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
        }

        if (sortedDates.length > 0) {
             const lastDate = sortedDates[sortedDates.length - 1];
             const today = new Date();
             today.setHours(0, 0, 0, 0);
             const yesterday = new Date();
             yesterday.setDate(today.getDate() - 1);
             yesterday.setHours(0, 0, 0, 0);

             if (lastDate.getTime() !== today.getTime() && lastDate.getTime() !== yesterday.getTime()) {
                 currentStreak = 0;
             }
        }

        return { currentStreak, longestStreak };
    }
    
    function calculateWeeklyWorkouts() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        let count = 0;
        for (const dateStr of completedDates) {
            const d = new Date(dateStr);
            if (d >= startOfWeek && d <= endOfWeek) {
                count++;
            }
        }
        return count;
    }

    function updateAllStats() {
        totalDaysCount.textContent = completedDates.size.toString();
        
        weeklyStreakCount.textContent = calculateWeeklyWorkouts().toString();

        const { currentStreak, longestStreak } = calculateStreaks();
        currentStreakCount.textContent = currentStreak.toString();
        longestStreakCount.textContent = longestStreak.toString();
    }

    // --- Event Listeners ---
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // --- Initial Render ---
    renderWeekdayHeader();
    renderCalendar();
}


// --- Script Entry Point ---
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main(); // DOM is already ready
    }
} catch (error) {
    console.error("A critical error occurred:", error);
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.textContent = `A critical error occurred: ${error.message}. Please report this exact message so I can fix it.`;
        errorContainer.style.display = 'block';
    }
    const calendarGrid = document.getElementById('calendar-grid');
    if (calendarGrid) {
        calendarGrid.innerHTML = ''; // Clear loading message on error
    }
}
