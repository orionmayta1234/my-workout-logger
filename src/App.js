import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut,
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    addDoc, 
    collection, 
    query, 
    onSnapshot, 
    deleteDoc, 
    // serverTimestamp, // No longer used for workoutLog start/end times
    writeBatch 
} from 'firebase/firestore';
import { 
    Clock, Dumbbell, 
    Home, 
    Calendar, 
    LogOut, MessageSquareWarning, AlertTriangle 
} from 'lucide-react';

// Import Components
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import CreateEditWorkoutScreen from './components/CreateEditWorkoutScreen';
import ActiveWorkoutScreen from './components/ActiveWorkoutScreen';
import WorkoutHistoryScreen from './components/WorkoutHistoryScreen';
import TimerDisplay from './components/TimerDisplay';
import Modal from './components/Modal';

// Import Helpers and Constants
import { 
    generateId, 
    SET_TYPES, 
    DEFAULT_EXERCISE, 
    formatPreviousPerformanceString 
} from './utils/helpers'; 

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDZP5VN_0wlESJ241x5nDPL9zEnMf41Fz4",
  authDomain: "workout-logger-336c4.firebaseapp.com",
  projectId: "workout-logger-336c4",
  storageBucket: "workout-logger-336c4.appspot.com", 
  messagingSenderId: "262377379612",
  appId: "1:262377379612:web:42333319dd6d49ffdc0cd9"
};
const appId = firebaseConfig.appId;


// --- Main App Component ---
function App() {
    // --- Firebase State ---
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // --- App State ---
    const [workouts, setWorkouts] = useState([]);
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [currentScreen, setCurrentScreen] = useState('home');
    const [editingWorkout, setEditingWorkout] = useState(null);
    const [workoutLogs, setWorkoutLogs] = useState([]);
    
    const [infoModalMessage, setInfoModalMessage] = useState('');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [replacingExerciseIndex, setReplacingExerciseIndex] = useState(null);
    const [tempReplaceName, setTempReplaceName] = useState('');

    // --- Timer State ---
    const [timerActive, setTimerActive] = useState(false);
    const [timerPaused, setTimerPaused] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(180);
    const timerIntervalRef = useRef(null);
    const pageHiddenTimestampRef = useRef(null);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [inSetTimer, setInSetTimer] = useState(null); 
    const inSetTimerIntervalRef = useRef(null);

    // --- Body Weight State ---
    const [bodyWeight, setBodyWeight] = useState('');
    const [showBodyWeightInput, setShowBodyWeightInput] = useState(false);

    // --- Notes State ---
    const [workoutNotes, setWorkoutNotes] = useState('');
    
    // Refs for drag and drop
    const draggedItemIndex = useRef(null);
    const touchDragItemIndexRef = useRef(null); 
    const touchDragOverItemIndexRef = useRef(null); 
    const draggedElementRef = useRef(null);


    // --- Request Notification Permission ---
    useEffect(() => { if (!("Notification" in window)) { console.log("This browser does not support desktop notification"); } else if (Notification.permission !== "denied") { Notification.requestPermission().then(permission => { setNotificationPermission(permission); }); } }, []);
    
    // --- Firebase Initialization and Auth Listener ---
    useEffect(() => { try { const app = initializeApp(firebaseConfig); const firestoreDb = getFirestore(app); const firebaseAuth = getAuth(app); setDb(firestoreDb); setAuth(firebaseAuth); const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => { setUser(currentUser); setIsAuthReady(true); if (!currentUser) { setCurrentScreen('home'); setWorkouts([]); setWorkoutLogs([]); setActiveWorkout(null); setEditingWorkout(null); } }); return () => unsubscribe(); } catch (error) { console.error("Error initializing Firebase:", error); setIsAuthReady(true); } }, []);
    const userId = user ? user.uid : null;

    // --- Google Sign-In/Out Handlers ---
    const handleSignInWithGoogle = useCallback(async () => { if (!auth) { console.error("Firebase Auth not initialized for Google Sign-In"); return; } const provider = new GoogleAuthProvider(); try { await signInWithPopup(auth, provider); setCurrentScreen('home'); } catch (error) { console.error("Error signing in with Google:", error); } }, [auth]);
    const handleSignOut = useCallback(async () => { if (!auth) { console.error("Firebase Auth not initialized for Sign Out"); return; } try { await signOut(auth); } catch (error) { console.error("Error signing out:", error); } }, [auth]);

    // --- Data Fetching ---
    useEffect(() => { if (!db || !userId || !isAuthReady) { if (isAuthReady && !userId) setWorkouts([]); return; } const workoutsCollectionPath = `artifacts/${appId}/users/${userId}/workouts`; const q = query(collection(db, workoutsCollectionPath)); const unsubscribe = onSnapshot(q, (querySnapshot) => { const fetchedWorkouts = []; querySnapshot.forEach((doc) => { fetchedWorkouts.push({ id: doc.id, ...doc.data() }); }); setWorkouts(fetchedWorkouts.sort((a, b) => (a.order || 0) - (b.order || 0) || (a.name || "").localeCompare(b.name || ""))); }, (error) => console.error("Error fetching workouts:", error)); return () => unsubscribe(); }, [db, userId, isAuthReady]);
    useEffect(() => { if (!db || !userId || !isAuthReady) { if (isAuthReady && !userId) setWorkoutLogs([]); return; } const logsCollectionPath = `artifacts/${appId}/users/${userId}/workoutLogs`; const q = query(collection(db, logsCollectionPath)); const unsubscribe = onSnapshot(q, (querySnapshot) => { const fetchedLogs = []; querySnapshot.forEach((doc) => { fetchedLogs.push({ id: doc.id, ...doc.data() }); }); setWorkoutLogs(fetchedLogs.sort((a, b) => (b.startTime?.toDate?.() || 0) - (a.startTime?.toDate?.() || 0))); }, (error) => console.error("Error fetching workout logs:", error)); return () => unsubscribe(); }, [db, userId, isAuthReady]);
    
    // --- Timer Logic ---
    const formatTime = useCallback((totalSeconds) => { const minutes = Math.floor(totalSeconds / 60); const seconds = totalSeconds % 60; return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; }, []);
    useEffect(() => { if (timerActive && !timerPaused) { timerIntervalRef.current = setInterval(() => { setTimerSeconds(prev => { if (prev <= 1) { clearInterval(timerIntervalRef.current); setTimerActive(false); if (notificationPermission === "granted") { new Notification("FitTrack Timer", { body: "Your rest timer is up! Time for the next set.", icon: "/dumbbell.svg" }); } return 0; } return prev - 1; }); }, 1000); } else { clearInterval(timerIntervalRef.current); } return () => clearInterval(timerIntervalRef.current); }, [timerActive, timerPaused, notificationPermission]);
    useEffect(() => { const handleVisibilityChange = () => { if (!timerActive || timerPaused) return; if (document.hidden) { pageHiddenTimestampRef.current = Date.now(); } else { if (pageHiddenTimestampRef.current) { const hiddenDurationMs = Date.now() - pageHiddenTimestampRef.current; const hiddenDurationSeconds = Math.round(hiddenDurationMs / 1000); setTimerSeconds(prevSeconds => { const newSeconds = prevSeconds - hiddenDurationSeconds; if (newSeconds <= 0) { clearInterval(timerIntervalRef.current); setTimerActive(false); if (notificationPermission === "granted") { new Notification("FitTrack Timer", { body: "Your rest timer is up! (Corrected after tab focus)", icon: "/dumbbell.svg" }); } return 0; } return newSeconds; }); pageHiddenTimestampRef.current = null; } } }; document.addEventListener("visibilitychange", handleVisibilityChange); return () => { document.removeEventListener("visibilitychange", handleVisibilityChange); }; }, [timerActive, timerPaused, notificationPermission]); 
    const startTimer = useCallback((duration = 180) => { setTimerSeconds(duration); setTimerActive(true); setTimerPaused(false); pageHiddenTimestampRef.current = null; }, []);
    const pauseTimer = useCallback(() => { setTimerPaused(true); clearInterval(timerIntervalRef.current); pageHiddenTimestampRef.current = null; }, []);
    const resumeTimer = useCallback(() => { setTimerPaused(false); pageHiddenTimestampRef.current = null; }, []);
    const stopTimer = useCallback(() => { setTimerActive(false); setTimerPaused(false); setTimerSeconds(180); clearInterval(timerIntervalRef.current); pageHiddenTimestampRef.current = null; }, []);
    
    // --- Info/Error Modal ---
    const showInfoModal = useCallback((message) => { setInfoModalMessage(String(message)); setIsInfoModalOpen(true); }, []); 
    
    // --- Shared Reorder Logic ---
    const performReorderAndUpdateFirestore = useCallback(async (sourceIndex, targetIndex, itemType, currentItems, setItemsCallback, collectionName) => { if (sourceIndex === null || targetIndex === null || sourceIndex === targetIndex) { return; } const reorderedItems = [...currentItems]; const [draggedActualItem] = reorderedItems.splice(sourceIndex, 1); reorderedItems.splice(targetIndex, 0, draggedActualItem); setItemsCallback(reorderedItems); if (itemType === 'workout plan' && db && userId && collectionName) { const batch = writeBatch(db); const collRef = collection(db, `artifacts/${appId}/users/${userId}/${collectionName}`); reorderedItems.forEach((item, newOrderIndex) => { if (item.id) { const docRef = doc(collRef, item.id); batch.update(docRef, { order: newOrderIndex }); } }); try { await batch.commit(); console.log(`${itemType} order updated in Firestore.`); } catch (error) { console.error(`Error updating ${itemType} order:`, error); showInfoModal(`Failed to save new order for ${itemType}s. Please try again.`); } } else if (itemType === 'exercise') { console.log("Exercise order updated in local state."); } }, [db, userId, showInfoModal]);
    
    // --- Workout Template Management Callbacks ---
    const handleCreateNewWorkout = useCallback(() => { const newOrder = workouts.length > 0 ? Math.max(...workouts.map(w => w.order || 0)) + 1 : 0; setEditingWorkout({ id: null, name: '', order: newOrder, exercises: [{ ...DEFAULT_EXERCISE, id: generateId() }] }); setCurrentScreen('createWorkout'); }, [workouts]);
    const handleEditWorkoutTemplate = useCallback((workout) => { setEditingWorkout(JSON.parse(JSON.stringify(workout))); setCurrentScreen('createWorkout'); }, []);
    const handleSaveWorkoutTemplate = useCallback(async () => { if (!editingWorkout) { showInfoModal("No workout data to save."); return; } if (!editingWorkout.name.trim()) { showInfoModal("Workout Plan Name is required."); return; } const emptyExercise = editingWorkout.exercises.find(ex => !ex.name.trim()); if (emptyExercise) { showInfoModal(`All exercises must have a name. Exercise #${editingWorkout.exercises.indexOf(emptyExercise) + 1} is missing a name.`); return; } if (!db || !userId) { showInfoModal("Cannot save: Database connection or User ID is missing."); return; } const workoutToSave = { ...editingWorkout, exercises: editingWorkout.exercises.filter(ex => ex.name.trim() !== '') }; if(typeof workoutToSave.order === 'undefined') { workoutToSave.order = workouts.length > 0 ? Math.max(...workouts.map(w => w.order || 0)) + 1 : 0; } try { const workoutsCollectionPath = `artifacts/${appId}/users/${userId}/workouts`; if (workoutToSave.id) { await setDoc(doc(db, workoutsCollectionPath, workoutToSave.id), workoutToSave, { merge: true }); } else { const { id, ...dataForNewWorkout } = workoutToSave; await addDoc(collection(db, workoutsCollectionPath), dataForNewWorkout); } setEditingWorkout(null); setCurrentScreen('home'); } catch (error) { console.error("Error saving workout template:", error); showInfoModal("Error saving workout: " + ( String(error.message) || "Unknown error")); } }, [db, userId, editingWorkout, showInfoModal, workouts]);
    const requestDeleteWorkoutTemplate = useCallback((workoutId) => { setItemToDelete({ id: workoutId, type: 'template' }); setConfirmModalMessage("Are you sure you want to delete this workout plan? This action cannot be undone."); setIsConfirmModalOpen(true); }, []);
    const handleWorkoutNameChange = useCallback((newName) => { setEditingWorkout(prev => ({ ...prev, name: newName })); }, []);
    const handleExerciseChange = useCallback((exerciseIndex, field, value) => { setEditingWorkout(prev => ({ ...prev, exercises: prev.exercises.map((ex, i) => i === exerciseIndex ? { ...ex, [field]: field === 'supersetWithNext' ? !ex.supersetWithNext : value } : ex) })); }, []);
    const addExerciseToTemplate = useCallback(() => { setEditingWorkout(prev => ({ ...prev, exercises: [...prev.exercises, { ...DEFAULT_EXERCISE, id: generateId() }] })); }, []);
    const removeExerciseFromTemplate = useCallback((exerciseId) => { setEditingWorkout(prev => ({ ...prev, exercises: prev.exercises.filter(ex => ex.id !== exerciseId) })); }, []);
    
    // --- Drag and Drop for Workout Plans (HomeScreen) ---
    const handleWorkoutPlanDragStart = useCallback((e, index) => { draggedItemIndex.current = index; e.dataTransfer.effectAllowed = 'move'; if (e.currentTarget) { e.currentTarget.classList.add('opacity-50', 'border-pink-500', 'border-2'); } }, []);
    const handleWorkoutPlanDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);
    const handleWorkoutPlanDrop = useCallback((e, targetIndex) => { e.preventDefault(); const sourceIndex = draggedItemIndex.current; if (e.currentTarget) { e.currentTarget.classList.remove('opacity-50', 'border-pink-500', 'border-2');} performReorderAndUpdateFirestore(sourceIndex, targetIndex, 'workout plan', workouts, setWorkouts, 'workouts'); }, [workouts, setWorkouts, performReorderAndUpdateFirestore]);
    const handleWorkoutPlanDragEnd = useCallback((e) => { if (e.currentTarget) { e.currentTarget.classList.remove('opacity-50', 'border-pink-500', 'border-2');} draggedItemIndex.current = null; }, []);
    const handleWorkoutPlanTouchMoveCallback = useCallback((e) => { if (touchDragItemIndexRef.current === null || !draggedElementRef.current) return; e.preventDefault(); const touch = e.touches[0]; const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY); document.querySelectorAll('.workout-plan-item.drop-target-touch').forEach(el => el.classList.remove('drop-target-touch')); touchDragOverItemIndexRef.current = null; if (elementUnderTouch) { const dropTarget = elementUnderTouch.closest('.workout-plan-item'); if (dropTarget && dropTarget !== draggedElementRef.current) { dropTarget.classList.add('drop-target-touch'); const targetId = dropTarget.id.replace('workout-plan-', ''); const targetIndex = workouts.findIndex(w => w.id === targetId); if (targetIndex !== -1) { touchDragOverItemIndexRef.current = targetIndex; } } } }, [workouts]);
    const handleWorkoutPlanTouchEndCallback = useCallback(() => { document.removeEventListener('touchmove', handleWorkoutPlanTouchMoveCallback); document.removeEventListener('touchend', handleWorkoutPlanTouchEndCallback); if (draggedElementRef.current) { draggedElementRef.current.classList.remove('opacity-60', 'ring-2', 'ring-pink-500', 'z-50', 'dragging-touch'); } document.querySelectorAll('.workout-plan-item.drop-target-touch').forEach(el => el.classList.remove('drop-target-touch')); const sourceIndex = touchDragItemIndexRef.current; const targetIndex = touchDragOverItemIndexRef.current; if (sourceIndex !== null && targetIndex !== null && sourceIndex !== targetIndex) { performReorderAndUpdateFirestore(sourceIndex, targetIndex, 'workout plan', workouts, setWorkouts, 'workouts'); } touchDragItemIndexRef.current = null; touchDragOverItemIndexRef.current = null; draggedElementRef.current = null; }, [workouts, setWorkouts, performReorderAndUpdateFirestore, handleWorkoutPlanTouchMoveCallback]); 
    const handleWorkoutPlanTouchStart = useCallback((e, index) => { touchDragItemIndexRef.current = index; draggedElementRef.current = e.currentTarget; if (e.currentTarget) { e.currentTarget.classList.add('opacity-60', 'ring-2', 'ring-pink-500', 'z-50', 'dragging-touch'); } document.addEventListener('touchmove', handleWorkoutPlanTouchMoveCallback, { passive: false }); document.addEventListener('touchend', handleWorkoutPlanTouchEndCallback); }, [handleWorkoutPlanTouchMoveCallback, handleWorkoutPlanTouchEndCallback]);
    
    // --- Drag and Drop for Exercises (CreateEditWorkoutScreen) ---
    const handleExerciseDragStart = useCallback((e, index) => { draggedItemIndex.current = index; e.dataTransfer.effectAllowed = 'move'; e.currentTarget.classList.add('opacity-50', 'ring-2', 'ring-pink-500'); }, []);
    const handleExerciseDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);
    const handleExerciseDrop = useCallback((e, targetIndex) => { e.preventDefault(); const sourceIndex = draggedItemIndex.current; if (e.currentTarget) e.currentTarget.classList.remove('opacity-50', 'ring-2', 'ring-pink-500'); if (editingWorkout) { performReorderAndUpdateFirestore(sourceIndex, targetIndex, 'exercise', editingWorkout.exercises, (newExercises) => setEditingWorkout(prev => ({...prev, exercises: newExercises})), null); } }, [editingWorkout, setEditingWorkout, performReorderAndUpdateFirestore]); 
    const handleExerciseDragEnd = useCallback((e) => { if(e.currentTarget) e.currentTarget.classList.remove('opacity-50', 'ring-2', 'ring-pink-500'); draggedItemIndex.current = null; }, []);
    const handleExerciseTouchMoveCallback = useCallback((e) => { if (touchDragItemIndexRef.current === null || !draggedElementRef.current || !editingWorkout) return; e.preventDefault(); const touch = e.touches[0]; const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY); document.querySelectorAll('.exercise-item.drop-target-touch').forEach(el => el.classList.remove('drop-target-touch')); touchDragOverItemIndexRef.current = null; if (elementUnderTouch) { const dropTarget = elementUnderTouch.closest('.exercise-item'); if (dropTarget && dropTarget !== draggedElementRef.current) { dropTarget.classList.add('drop-target-touch'); const targetId = dropTarget.id.replace('exercise-item-', ''); const targetIndex = editingWorkout.exercises.findIndex(ex => ex.id === targetId); if (targetIndex !== -1) { touchDragOverItemIndexRef.current = targetIndex; } } } }, [editingWorkout]);
    const handleExerciseTouchEndCallback = useCallback(() => { document.removeEventListener('touchmove', handleExerciseTouchMoveCallback); document.removeEventListener('touchend', handleExerciseTouchEndCallback); if (draggedElementRef.current) { draggedElementRef.current.classList.remove('opacity-60', 'ring-2', 'ring-pink-500', 'z-50', 'dragging-touch'); } document.querySelectorAll('.exercise-item.drop-target-touch').forEach(el => el.classList.remove('drop-target-touch')); const sourceIndex = touchDragItemIndexRef.current; const targetIndex = touchDragOverItemIndexRef.current; if (editingWorkout && sourceIndex !== null && targetIndex !== null && sourceIndex !== targetIndex) { performReorderAndUpdateFirestore(sourceIndex, targetIndex, 'exercise', editingWorkout.exercises, (newExercises) => setEditingWorkout(prev => ({...prev, exercises: newExercises})), null); } touchDragItemIndexRef.current = null; touchDragOverItemIndexRef.current = null; draggedElementRef.current = null; }, [editingWorkout, setEditingWorkout, performReorderAndUpdateFirestore, handleExerciseTouchMoveCallback]); 
    const handleExerciseTouchStart = useCallback((e, index) => { touchDragItemIndexRef.current = index; draggedElementRef.current = e.currentTarget; if (e.currentTarget) e.currentTarget.classList.add('opacity-60', 'ring-2', 'ring-pink-500', 'z-50', 'dragging-touch'); document.addEventListener('touchmove', handleExerciseTouchMoveCallback, { passive: false }); document.addEventListener('touchend', handleExerciseTouchEndCallback); }, [handleExerciseTouchMoveCallback, handleExerciseTouchEndCallback]);
    
    // --- Active Workout Management Callbacks ---
    const handleStartWorkout = useCallback((workoutTemplate) => { let previousPerformanceData = {}; if (workoutLogs && workoutLogs.length > 0) { const relevantLogs = workoutLogs.filter(log => log.templateId === workoutTemplate.id && log.isCompleted).sort((a, b) => (b.startTime?.toDate?.() || 0) - (a.startTime?.toDate?.() || 0)); if (relevantLogs.length > 0) { const lastLog = relevantLogs[0]; (lastLog.exercises || []).forEach(prevEx => { const performanceString = formatPreviousPerformanceString(prevEx); if (performanceString) { previousPerformanceData[prevEx.name] = performanceString; } }); } } setActiveWorkout({ templateId: workoutTemplate.id, name: workoutTemplate.name, startTime: new Date(), exercises: workoutTemplate.exercises.map(ex => ({ ...ex, id: ex.id || generateId(), loggedSets: Array(parseInt(ex.targetSets, 10) || 1).fill(null).map(() => ({ reps: '', weight: '', completed: false, durationAchieved: null, drops: ex.setType === SET_TYPES.DROPSET ? Array((ex.drops || []).length).fill({reps:'', weight:''}) : null })), isSkipped: false, previousPerformance: previousPerformanceData[ex.name] || null })), isCompleted: false }); setWorkoutNotes(''); setBodyWeight(''); setShowBodyWeightInput(true); setCurrentScreen('activeWorkout'); setReplacingExerciseIndex(null); }, [workoutLogs]);
    const handleUnlogSet = useCallback((exerciseIndex, setIndex) => { setActiveWorkout(prevWorkout => { const newExercises = prevWorkout.exercises.map((exercise, exIdx) => { if (exIdx === exerciseIndex) { const newLoggedSets = exercise.loggedSets.map((set, sIdx) => { if (sIdx === setIndex) { return { ...set, reps: '', weight: '', completed: false, durationAchieved: null, drops: exercise.setType === SET_TYPES.DROPSET ? Array((exercise.drops || []).length).fill({reps:'', weight:''}) : null }; } return set; }); return { ...exercise, loggedSets: newLoggedSets }; } return exercise; }); return { ...prevWorkout, exercises: newExercises }; }); }, []);
    const handleToggleSkipExercise = useCallback((exerciseIndex) => { setActiveWorkout(prevWorkout => { const newExercises = prevWorkout.exercises.map((ex, idx) => { if (idx === exerciseIndex) { return { ...ex, isSkipped: !ex.isSkipped }; } return ex; }); return { ...prevWorkout, exercises: newExercises }; }); }, []);
    const handleStartReplaceExercise = useCallback((exerciseIndex, currentName) => { setReplacingExerciseIndex(exerciseIndex); setTempReplaceName(currentName); }, []);
    const handleConfirmReplaceExercise = useCallback((exerciseIndex) => { if (!tempReplaceName.trim()) { showInfoModal("New exercise name cannot be empty."); return; } setActiveWorkout(prevWorkout => { const newExercises = prevWorkout.exercises.map((ex, idx) => { if (idx === exerciseIndex) { return { ...ex, name: tempReplaceName }; } return ex; }); return { ...prevWorkout, exercises: newExercises }; }); setReplacingExerciseIndex(null); setTempReplaceName(''); }, [tempReplaceName, showInfoModal]);
    const handleCancelReplaceExercise = useCallback(() => { setReplacingExerciseIndex(null); setTempReplaceName(''); }, []);
    
    const handleLogSet = useCallback((exerciseIndex, setIndex, setData) => {
        setActiveWorkout(prevWorkout => {
            if (!prevWorkout) return null;
    
            const updatedExercises = prevWorkout.exercises.map((ex, exIdx) => {
                if (exIdx === exerciseIndex) {
                    const updatedLoggedSets = ex.loggedSets.map((s, sIdx) => {
                        if (sIdx === setIndex) {
                            return { ...s, ...setData, completed: true };
                        }
                        return s;
                    });
                    return { ...ex, loggedSets: updatedLoggedSets };
                }
                return ex;
            });
            
            const currentExercise = updatedExercises[exerciseIndex];
            const numTargetSets = parseInt(currentExercise.targetSets, 10) || 0;
            const completedSetsForCurrentExercise = currentExercise.loggedSets.filter(s => s.completed).length;
            const allSetsForCurrentExerciseDone = completedSetsForCurrentExercise >= numTargetSets;
    
            let shouldStartMainRestTimer = true;
            let showSupersetMessage = false;
    
            if (currentExercise.supersetWithNext) {
                if (allSetsForCurrentExerciseDone) {
                    shouldStartMainRestTimer = false; 
                    showSupersetMessage = true;
                }
                // If not all sets are done for THIS exercise in the superset, timer will run (shouldStartMainRestTimer is true)
            }
            // If it's not supersetWithNext (standalone or last in a superset), timer always runs.
    
            if (shouldStartMainRestTimer) {
                startTimer(); 
            } else if (showSupersetMessage) {
                const nextExerciseName = updatedExercises[exerciseIndex + 1]?.name || "the next exercise";
                showInfoModal(`Superset: Move to ${nextExerciseName}! No long rest.`);
            }
            
            return { ...prevWorkout, exercises: updatedExercises };
        });
    }, [startTimer, showInfoModal]);

    const handleAddSetToExercise = useCallback((exerciseIndex) => { setActiveWorkout(prevWorkout => { const newExercises = prevWorkout.exercises.map((exercise, exIdx) => { if (exIdx === exerciseIndex) { const newLoggedSets = [...exercise.loggedSets, { reps: '', weight: '', completed: false, durationAchieved: null, drops: exercise.setType === SET_TYPES.DROPSET ? Array((exercise.drops || []).length).fill({reps:'', weight:''}) : null }]; return { ...exercise, loggedSets: newLoggedSets }; } return exercise; }); return { ...prevWorkout, exercises: newExercises }; }); }, []);
    const handleSetInputChange = useCallback((exerciseIndex, setIndex, field, value, dropIndex = null) => { setActiveWorkout(prevWorkout => { const newExercises = prevWorkout.exercises.map((exercise, exIdx) => { if (exIdx === exerciseIndex) { const newLoggedSets = exercise.loggedSets.map((set, sIdx) => { if (sIdx === setIndex) { if (field === 'drops' && dropIndex !== null && typeof value === 'object') { const updatedDrops = (set.drops || Array((exercise.drops || []).length).fill({})).map((d, di) => di === dropIndex ? {...d, ...value } : d); return { ...set, drops: updatedDrops }; } return { ...set, [field]: value }; } return set; }); return { ...exercise, loggedSets: newLoggedSets }; } return exercise; }); return { ...prevWorkout, exercises: newExercises }; }); }, []);
    const handleFinishWorkout = useCallback(async () => { if (!db || !userId || !activeWorkout) return; const finalBodyWeight = bodyWeight || activeWorkout.bodyWeight || ''; const finalNotes = workoutNotes || activeWorkout.notes || ''; const workoutLog = { ...activeWorkout, bodyWeight: finalBodyWeight, notes: finalNotes, endTime: new Date(), isCompleted: true, exercises: activeWorkout.exercises.map(ex => ({ ...ex, loggedSets: ex.loggedSets.filter(s => s.completed || ex.isSkipped) })) }; try { await addDoc(collection(db, `artifacts/${appId}/users/${userId}/workoutLogs`), workoutLog); setActiveWorkout(null); setCurrentScreen('home'); stopTimer(); setBodyWeight(''); setWorkoutNotes(''); setShowBodyWeightInput(false); } catch (error) { console.error("Error finishing workout:", error); showInfoModal("Error saving workout log: " + (String(error.message) || "Unknown error")); } }, [db, userId, activeWorkout, bodyWeight, workoutNotes, stopTimer, showInfoModal]);
    const handleCancelActiveWorkout = useCallback(() => { setActiveWorkout(null); setCurrentScreen('home'); stopTimer(); setReplacingExerciseIndex(null); setTempReplaceName(''); }, [stopTimer]);
    const handleCancelCreateEdit = useCallback(() => { setEditingWorkout(null); setCurrentScreen('home'); }, []);
    const handleEditWorkoutPlanFromLog = useCallback(async (templateId) => { if (!db || !userId || !templateId) { showInfoModal("Cannot find original plan: Missing template information from log."); return; } try { const templateDocRef = doc(db, `artifacts/${appId}/users/${userId}/workouts`, templateId); const templateSnap = await getDoc(templateDocRef); if (templateSnap.exists()) { handleEditWorkoutTemplate({ id: templateSnap.id, ...templateSnap.data() }); } else { showInfoModal("Original workout plan not found. It may have been deleted."); } } catch (error) { console.error("Error fetching workout plan for editing:", error); showInfoModal("Error fetching plan: " + (String(error.message) || "Unknown error")); } }, [db, userId, handleEditWorkoutTemplate, showInfoModal]); 
    const requestDeleteWorkoutLog = useCallback((logId) => { setItemToDelete({ id: logId, type: 'log' }); setConfirmModalMessage("Are you sure you want to delete this workout log? This action cannot be undone."); setIsConfirmModalOpen(true); }, []);
    const handleConfirmDelete = useCallback(async () => { if (!db || !userId || !itemToDelete) { showInfoModal("Cannot delete: Missing required information."); setIsConfirmModalOpen(false); setItemToDelete(null); return; } const { id, type } = itemToDelete; let collectionPath = ''; let successMessage = ''; let errorMessagePrefix = ''; if (type === 'template') { collectionPath = `artifacts/${appId}/users/${userId}/workouts`; successMessage = "Workout plan deleted successfully."; errorMessagePrefix = "Error deleting template: "; } else if (type === 'log') { collectionPath = `artifacts/${appId}/users/${userId}/workoutLogs`; successMessage = "Workout log deleted successfully."; errorMessagePrefix = "Error deleting log: "; } else { showInfoModal("Invalid item type for deletion."); setIsConfirmModalOpen(false); setItemToDelete(null); return; } try { await deleteDoc(doc(db, collectionPath, id)); console.log(successMessage); } catch (error) { console.error(`Raw error object during delete ${type}:`, error); let detailMessage = "An unknown error occurred."; if (error) { if (typeof error.message === 'string' && error.message.trim() !== '') { detailMessage = error.message; } else if (typeof error === 'string' && error.trim() !== '') { detailMessage = error; } else { try { const errStr = JSON.stringify(error); if (errStr !== '{}') detailMessage = errStr; } catch (e) { /* ignore */ } } } showInfoModal(errorMessagePrefix + detailMessage); } finally { setIsConfirmModalOpen(false); setItemToDelete(null); } }, [db, userId, itemToDelete, showInfoModal]);
    
    // In-Set Timer for Timed Sets
    const handleStartInSetTimer = useCallback((exerciseIndex, setIndex, duration) => {
        if (inSetTimerIntervalRef.current) clearInterval(inSetTimerIntervalRef.current); 
        setInSetTimer({ exerciseIndex, setIndex, secondsLeft: duration, intervalId: null });
        
        inSetTimerIntervalRef.current = setInterval(() => {
            setInSetTimer(currentTimer => {
                if (!currentTimer || currentTimer.secondsLeft <= 1) {
                    clearInterval(inSetTimerIntervalRef.current);
                    if (currentTimer) { 
                         handleLogSet(currentTimer.exerciseIndex, currentTimer.setIndex, { durationAchieved: duration, completed: true });
                    }
                    return null; 
                }
                return { ...currentTimer, secondsLeft: currentTimer.secondsLeft - 1 };
            });
        }, 1000);
    }, [handleLogSet]); 


    const renderAppContent = () => { 
        switch (currentScreen) { 
            case 'home': return <HomeScreen workouts={workouts} onStartWorkout={handleStartWorkout} onEditWorkoutTemplate={handleEditWorkoutTemplate} onDeleteWorkoutTemplate={requestDeleteWorkoutTemplate} onCreateNewWorkout={handleCreateNewWorkout} onWorkoutPlanDragStart={handleWorkoutPlanDragStart} onWorkoutPlanDragOver={handleWorkoutPlanDragOver} onWorkoutPlanDrop={handleWorkoutPlanDrop} onWorkoutPlanDragEnd={handleWorkoutPlanDragEnd} onWorkoutPlanTouchStart={handleWorkoutPlanTouchStart} onWorkoutPlanTouchMove={handleWorkoutPlanTouchMoveCallback} onWorkoutPlanTouchEnd={handleWorkoutPlanTouchEndCallback} />; 
            case 'createWorkout': return <CreateEditWorkoutScreen editingWorkout={editingWorkout} onWorkoutNameChange={handleWorkoutNameChange} onExerciseChange={handleExerciseChange} onAddExerciseToTemplate={addExerciseToTemplate} onRemoveExerciseFromTemplate={removeExerciseFromTemplate} onSaveWorkoutTemplate={handleSaveWorkoutTemplate} onCancel={handleCancelCreateEdit} onExerciseDragStart={handleExerciseDragStart} onExerciseDragOver={handleExerciseDragOver} onExerciseDrop={handleExerciseDrop} onExerciseDragEnd={handleExerciseDragEnd} onExerciseTouchStart={handleExerciseTouchStart} onExerciseTouchMove={handleExerciseTouchMoveCallback} onExerciseTouchEnd={handleExerciseTouchEndCallback} />; 
            case 'activeWorkout': return <ActiveWorkoutScreen activeWorkout={activeWorkout} bodyWeight={bodyWeight} workoutNotes={workoutNotes} onSetBodyWeight={setBodyWeight} onSetWorkoutNotes={setWorkoutNotes} onSetInputChange={handleSetInputChange} onAddSetToExercise={handleAddSetToExercise} onLogSet={handleLogSet} onUnlogSet={handleUnlogSet} onFinishWorkout={handleFinishWorkout} onCancelWorkout={handleCancelActiveWorkout} showBodyWeightInput={showBodyWeightInput} onHideBodyWeightInput={() => setShowBodyWeightInput(false)} onToggleSkipExercise={handleToggleSkipExercise} onStartReplaceExercise={handleStartReplaceExercise} replacingExerciseIndex={replacingExerciseIndex} onConfirmReplaceExercise={handleConfirmReplaceExercise} onCancelReplaceExercise={handleCancelReplaceExercise} tempReplaceName={tempReplaceName} onSetTempReplaceName={setTempReplaceName} onStartInSetTimer={handleStartInSetTimer} inSetTimer={inSetTimer} formatTime={formatTime} />; 
            case 'workoutHistory': return <WorkoutHistoryScreen workoutLogs={workoutLogs} onEditWorkoutPlanFromLog={handleEditWorkoutPlanFromLog} onDeleteWorkoutLog={requestDeleteWorkoutLog} />; 
            default: setCurrentScreen('home'); return <HomeScreen workouts={workouts} onStartWorkout={handleStartWorkout} onEditWorkoutTemplate={handleEditWorkoutTemplate} onDeleteWorkoutTemplate={requestDeleteWorkoutTemplate} onCreateNewWorkout={handleCreateNewWorkout} onWorkoutPlanDragStart={handleWorkoutPlanDragStart} onWorkoutPlanDragOver={handleWorkoutPlanDragOver} onWorkoutPlanDrop={handleWorkoutPlanDrop} onWorkoutPlanDragEnd={handleWorkoutPlanDragEnd} onWorkoutPlanTouchStart={handleWorkoutPlanTouchStart} onWorkoutPlanTouchMove={handleWorkoutPlanTouchMoveCallback} onWorkoutPlanTouchEnd={handleWorkoutPlanTouchEndCallback} />; 
        } 
    };
    
    if (!isAuthReady) { return <div className="flex justify-center items-center h-screen bg-gray-900 text-white"><Clock className="animate-spin mr-2" />Authenticating...</div>; }
    if (!user) { return <LoginScreen onSignInWithGoogle={handleSignInWithGoogle} />; }
    
    return ( 
        <> 
            <Modal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title="Information" confirmText="OK" iconType="info" > 
                <p className="text-gray-300">{infoModalMessage}</p>
            </Modal> 
            <Modal isOpen={isConfirmModalOpen} onClose={() => { setIsConfirmModalOpen(false); setItemToDelete(null); }} title="Confirm Deletion" showCancelButton={true} onConfirm={handleConfirmDelete} confirmText="Delete" cancelText="Cancel" iconType="confirm"> 
                <p className="text-gray-300">{confirmModalMessage}</p>
            </Modal> 
            <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col"> 
                <header className="bg-gray-800 shadow-md sticky top-0 z-40"> <div className="container mx-auto px-4 py-3 flex justify-between items-center"><div className="text-2xl font-bold text-pink-500 flex items-center"><Dumbbell size={28} className="mr-2"/> FitTrack</div><div className="flex items-center">{user.photoURL && <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full mr-3"/>}<span className="text-sm text-gray-300 mr-4 hidden sm:inline">{user.displayName || user.email}</span><button onClick={handleSignOut} className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-1.5 px-3 rounded-lg text-sm flex items-center"><LogOut size={16} className="mr-1.5"/> Sign Out</button></div></div> </header> 
                <main className="flex-grow container mx-auto px-0 sm:px-4 py-4"> {renderAppContent()} </main> 
                <TimerDisplay timerActive={timerActive} timerSeconds={timerSeconds} timerPaused={timerPaused} onResumeTimer={resumeTimer} onPauseTimer={pauseTimer} onStopTimer={stopTimer} formatTime={formatTime} /> 
                <footer className="bg-gray-800 border-t border-gray-700 p-3 sticky bottom-0 z-30 mt-auto"> <nav className="container mx-auto flex justify-around items-center"><button onClick={() => setCurrentScreen('home')} className={`flex flex-col items-center p-2 rounded-md ${currentScreen === 'home' ? 'text-pink-400' : 'text-gray-400 hover:text-pink-300'}`}><Home size={22}/> <span className="text-xs mt-1">Home</span></button><button onClick={() => setCurrentScreen('workoutHistory')} className={`flex flex-col items-center p-2 rounded-md ${currentScreen === 'workoutHistory' ? 'text-pink-400' : 'text-gray-400 hover:text-pink-300'}`}><Calendar size={22}/> <span className="text-xs mt-1">History</span></button></nav> </footer> 
            </div> 
        </> 
    );
}

export default App;
