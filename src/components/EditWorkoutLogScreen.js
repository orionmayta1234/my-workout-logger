import React, { useState, useEffect, useCallback } from 'react';
import { Save, XCircle, Trash2 } from 'lucide-react';
// Assuming SET_TYPES is imported from your utils/helpers.js
// import { SET_TYPES } from '../utils/helpers'; 

// For standalone testing, define SET_TYPES if not importing
const SET_TYPES = {
    STANDARD: 'standard', WARMUP: 'warmup', DROPSET: 'dropset', AMRAP: 'amrap', TIMED: 'timed',
};

const formatDateForInput = (timestampOrDate) => {
    if (!timestampOrDate) return '';
    const date = timestampOrDate.toDate ? timestampOrDate.toDate() : new Date(timestampOrDate); // Handle both Firestore Timestamps and JS Dates
    if (isNaN(date.getTime())) return ''; // Invalid date
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const EditWorkoutLogScreen = React.memo(({
    logToEdit,
    onSaveEditedLog,
    onCancelEditLog,
    formatTime // Assuming this is for timed sets display, not date formatting
}) => {
    const [editedLogData, setEditedLogData] = useState(null);

    useEffect(() => {
        if (logToEdit) {
            // Deep clone and ensure startTime is a JS Date object for the input if it exists
            const initialData = JSON.parse(JSON.stringify(logToEdit));
            if (initialData.startTime && initialData.startTime.seconds) { // If it's a Firestore-like timestamp structure
                initialData.startTime = new Date(initialData.startTime.seconds * 1000);
            } else if (initialData.startTime && typeof initialData.startTime === 'string') {
                 initialData.startTime = new Date(initialData.startTime);
            }
            // Ensure exercises and loggedSets are initialized as arrays if they are missing
            initialData.exercises = (initialData.exercises || []).map(ex => ({
                ...ex,
                loggedSets: ex.loggedSets || []
            }));

            setEditedLogData(initialData);
        }
    }, [logToEdit]);

    const handleInputChange = useCallback((field, value) => {
        setEditedLogData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleDateChange = useCallback((e) => {
        const dateString = e.target.value; // YYYY-MM-DD
        if (dateString) {
            const [year, month, day] = dateString.split('-').map(Number);
            // Create a new Date object. We'll use the current time from the existing startTime
            // or default to noon to avoid timezone issues making it the "previous day".
            const existingStartTime = editedLogData?.startTime ? new Date(editedLogData.startTime) : new Date();
            const hours = existingStartTime instanceof Date && !isNaN(existingStartTime) ? existingStartTime.getHours() : 12;
            const minutes = existingStartTime instanceof Date && !isNaN(existingStartTime) ? existingStartTime.getMinutes() : 0;
            const seconds = existingStartTime instanceof Date && !isNaN(existingStartTime) ? existingStartTime.getSeconds() : 0;

            const newDate = new Date(year, month - 1, day, hours, minutes, seconds);
            setEditedLogData(prev => ({ ...prev, startTime: newDate }));
        }
    }, [editedLogData]);


    const handleExerciseSetChange = useCallback((exIndex, setIdx, field, value, dropIdx = null) => {
        setEditedLogData(prev => {
            if (!prev) return null;
            const updatedExercises = prev.exercises.map((ex, currentExIndex) => {
                if (exIndex === currentExIndex) {
                    const updatedLoggedSets = (ex.loggedSets || []).map((s, currentSetIndex) => {
                        if (setIdx === currentSetIndex) {
                            if (field === 'drops' && dropIdx !== null && typeof value === 'object') {
                                const currentDrops = s.drops || Array((ex.dropsConfig || []).length).fill({}); // Use dropsConfig from exercise definition for structure
                                const updatedDrops = currentDrops.map((drop, currentDropIdx) => {
                                    if (dropIdx === currentDropIdx) {
                                        return { ...drop, ...value };
                                    }
                                    return drop;
                                });
                                return { ...s, drops: updatedDrops };
                            }
                            return { ...s, [field]: value };
                        }
                        return s;
                    });
                    return { ...ex, loggedSets: updatedLoggedSets };
                }
                return ex;
            });
            return { ...prev, exercises: updatedExercises };
        });
    }, []);
    
    const handleRemoveLoggedSet = useCallback((exIndex, setIdx) => {
        setEditedLogData(prev => {
            if (!prev) return null;
            const updatedExercises = prev.exercises.map((ex, currentExIndex) => {
                if (exIndex === currentExIndex) {
                    const updatedLoggedSets = ex.loggedSets.filter((_, currentSetIndex) => setIdx !== currentSetIndex);
                    return { ...ex, loggedSets: updatedLoggedSets };
                }
                return ex;
            });
            return { ...prev, exercises: updatedExercises };
        });
    }, []);

    const handleSaveChanges = () => {
        if (editedLogData) {
            const logToSave = { ...editedLogData };
            // Ensure startTime is a JS Date object before saving.
            // Firestore SDK will convert JS Date to Firestore Timestamp.
            if (logToSave.startTime && typeof logToSave.startTime === 'string') {
                logToSave.startTime = new Date(logToSave.startTime);
            }
            // If endTime also needs to be preserved or set
            if (logToSave.endTime && typeof logToSave.endTime === 'string') {
                logToSave.endTime = new Date(logToSave.endTime);
            } else if (!logToSave.endTime && logToSave.startTime instanceof Date) {
                // If endTime is missing, but startTime is a valid date,
                // you might want to set endTime based on startTime or leave as is.
                // For simplicity, we'll assume if date is changed, endTime might need re-evaluation
                // or be set to a sensible value if it was based on serverTimestamp initially.
                // Or, just ensure it's also a Date object if it exists.
                // For now, just ensure it is a Date if it's a string.
            }

            onSaveEditedLog(logToSave);
        }
    };

    if (!editedLogData) {
        return <div className="p-4 text-center text-gray-400">Loading log details...</div>;
    }

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold mb-6 text-center text-pink-500">Edit Workout Log: {editedLogData.name}</h1>
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl space-y-6">
                <div>
                    <label htmlFor="logDate" className="block text-sm font-medium text-gray-300 mb-1">Date Completed</label>
                    <input
                        type="date"
                        id="logDate"
                        value={formatDateForInput(editedLogData.startTime)}
                        onChange={handleDateChange}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                </div>

                <div>
                    <label htmlFor="logBodyWeight" className="block text-sm font-medium text-gray-300 mb-1">Body Weight (lbs)</label>
                    <input
                        type="number"
                        id="logBodyWeight"
                        value={editedLogData.bodyWeight || ''}
                        onChange={(e) => handleInputChange('bodyWeight', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="e.g., 167.2"
                    />
                </div>

                <div>
                    <label htmlFor="logNotes" className="block text-sm font-medium text-gray-300 mb-1">Workout Notes</label>
                    <textarea
                        id="logNotes"
                        value={editedLogData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows="3"
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="How did it go? Any PRs?"
                    ></textarea>
                </div>

                <h3 className="text-xl font-semibold text-pink-400 border-t border-gray-700 pt-4 mt-4">Exercises</h3>
                {(editedLogData.exercises || []).map((exercise, exIndex) => (
                    <div key={exercise.id || exIndex} className="bg-gray-700 p-4 rounded-md space-y-3">
                        <h4 className="text-lg font-medium text-gray-200">{exercise.name} <span className="text-xs uppercase text-gray-500 ml-1">({exercise.setType || SET_TYPES.STANDARD})</span></h4>
                        {(exercise.loggedSets || []).map((set, setIdx) => (
                            <div key={setIdx} className="border border-gray-600 p-3 rounded-md space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Set {setIdx + 1}</span>
                                    <button onClick={() => handleRemoveLoggedSet(exIndex, setIdx)} className="text-red-500 hover:text-red-400 p-0.5" title="Remove this set">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                { (exercise.setType === SET_TYPES.STANDARD || exercise.setType === SET_TYPES.WARMUP || exercise.setType === SET_TYPES.AMRAP) && (
                                    <div className="flex items-center space-x-2">
                                        <input type="number" placeholder="Reps" value={set.reps || ''} onChange={(e) => handleExerciseSetChange(exIndex, setIdx, 'reps', e.target.value)} className="w-1/2 bg-gray-600 text-white border-gray-500 rounded p-1.5 text-sm"/>
                                        <input type="number" placeholder="lbs" value={set.weight || ''} onChange={(e) => handleExerciseSetChange(exIndex, setIdx, 'weight', e.target.value)} className="w-1/2 bg-gray-600 text-white border-gray-500 rounded p-1.5 text-sm"/>
                                    </div>
                                )}
                                {exercise.setType === SET_TYPES.TIMED && (
                                    <div>
                                        <label className="text-xs text-gray-400">Duration Achieved (s):</label>
                                        <input type="number" placeholder="Secs" value={set.durationAchieved || ''} onChange={(e) => handleExerciseSetChange(exIndex, setIdx, 'durationAchieved', e.target.value)} className="w-full bg-gray-600 text-white border-gray-500 rounded p-1.5 text-sm mt-1"/>
                                    </div>
                                )}
                                {exercise.setType === SET_TYPES.DROPSET && (
                                    <div className="space-y-1">
                                        {(exercise.dropsConfig || []).map((dropDef, dropIdx) => ( // Iterate over definition for structure
                                            <div key={dropIdx} className="flex items-center space-x-1 text-xs">
                                                <span className="text-gray-400 w-1/4">Drop {dropIdx + 1} (Tgt: {dropDef.reps}r @ {dropDef.weight}lbs):</span>
                                                <input type="number" placeholder="lbs" value={(set.drops && set.drops[dropIdx]?.weight) || ''} onChange={e => handleExerciseSetChange(exIndex, setIdx, 'drops', { weight: e.target.value }, dropIdx)} className="w-1/3 bg-gray-600 p-1 rounded"/>
                                                <input type="number" placeholder="reps" value={(set.drops && set.drops[dropIdx]?.reps) || ''} onChange={e => handleExerciseSetChange(exIndex, setIdx, 'drops', { reps: e.target.value }, dropIdx)} className="w-1/3 bg-gray-600 p-1 rounded"/>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                    <button onClick={onCancelEditLog} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSaveChanges} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center">
                        <Save size={18} className="mr-2"/> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
});

export default EditWorkoutLogScreen;