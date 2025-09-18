import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const firebaseConfig = {
    "projectId": "fitness-tracker-app-92104",
    "appId": "1:168375783884:web:804c8ffbcacab93efccd69",
    "storageBucket": "fitness-tracker-app-92104.firebasestorage.app",
    "apiKey": "AIzaSyDRXpla8dug0hsjsZ-gSKnPVZwlk2in5J0",
    "authDomain": "fitness-tracker-app-92104.firebaseapp.com",
    "messagingSenderId": "168375783884"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutButton = document.getElementById('logout-button');
const addWorkoutForm = document.getElementById('add-workout-form');
const workoutList = document.getElementById('workout-list');

let userId = null;

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid;
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        displayWorkouts();
    } else {
        userId = null;
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
});

// Register
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Error registering: ", error);
    }
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Error logging in: ", error);
    }
});

// Logout
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error logging out: ", error);
    }
});

// Add workout
addWorkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('workout-name').value;
    const duration = document.getElementById('workout-duration').value;
    const sets = document.getElementById('workout-sets').value;
    const reps = document.getElementById('workout-reps').value;

    if (!userId) return;

    try {
        await addDoc(collection(db, 'users', userId, 'workouts'), {
            name,
            duration,
            sets,
            reps,
        });
        addWorkoutForm.reset();
        displayWorkouts();
    } catch (error) {
        console.error("Error adding document: ", error);
    }
});

// Display workouts
async function displayWorkouts() {
    if (!userId) return;

    workoutList.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'workouts'));
    querySnapshot.forEach((doc) => {
        const workout = doc.data();
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="workout-details">
                <strong>${workout.name}</strong> - ${workout.duration} mins
                ${workout.sets ? `, ${workout.sets} sets` : ''}
                ${workout.reps ? `, ${workout.reps} reps` : ''}
            </div>
            <button class="delete-button">Delete</button>
        `;
        li.setAttribute('data-id', doc.id);
        workoutList.appendChild(li);
    });
}

// Delete workout
workoutList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-button')) {
        const id = e.target.parentElement.getAttribute('data-id');
        if (!userId) return;

        try {
            await deleteDoc(doc(db, 'users', userId, 'workouts', id));
            displayWorkouts();
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    }
});