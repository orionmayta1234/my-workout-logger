// src/utils/helpers.js

export const SET_TYPES = {
    STANDARD: 'standard',
    WARMUP: 'warmup',
    DROPSET: 'dropset',
    AMRAP: 'amrap',
    TIMED: 'timed',
};

export const DEFAULT_EXERCISE = {
    id: '',
    name: '',
    targetSets: 3,
    setType: SET_TYPES.STANDARD,
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetWeight: '',
    targetDuration: 60,
    drops: [{ weight: '', reps: '' }],
};

export const generateId = () => Math.random().toString(36).substr(2, 9);


export const formatRepRange = (min, max) => {
    const minReps = parseInt(min, 10);
    const maxReps = parseInt(max, 10);
    if (!isNaN(minReps) && !isNaN(maxReps) && minReps !== maxReps) {
        return `${minReps}-${maxReps} reps`; // Removed unnecessary escape from '-'
    } else if (!isNaN(minReps)) {
        return `${minReps} reps`;
    } else if (!isNaN(maxReps)) {
        return `${maxReps} reps`;
    }
    return 'reps';
};

export const formatSetTarget = (exercise) => {
    switch (exercise.setType) {
        case SET_TYPES.TIMED:
            return `${exercise.targetDuration || 'N/A'}s`;
        case SET_TYPES.DROPSET:
            // Removed unnecessary escapes from ( and )
            return `Drop Set (${(exercise.drops || []).length} drops)`;
        case SET_TYPES.AMRAP:
            return `AMRAP`;
        case SET_TYPES.WARMUP:
        case SET_TYPES.STANDARD:
        default:
            return formatRepRange(exercise.targetRepsMin, exercise.targetRepsMax);
    }
};

export const formatPreviousPerformanceString = (exerciseLog) => {
    if (!exerciseLog || !exerciseLog.loggedSets || exerciseLog.loggedSets.length === 0) return null;
    const completedSets = exerciseLog.loggedSets.filter(s => s.completed);
    if (completedSets.length === 0) return null;
    
    const numSets = completedSets.length; // numSets is now used in all return paths

    switch (exerciseLog.setType) {
        case SET_TYPES.TIMED:
            const durations = completedSets.map(s => s.durationAchieved ? `${s.durationAchieved}s` : 'N/A').join(', ');
            // Corrected: Use template literals correctly
            return `${numSets} set${numSets > 1 ? 's' : ''} of ${durations}`;
        case SET_TYPES.DROPSET:
            // Corrected: Use template literals correctly
            return `${numSets} drop set${numSets > 1 ? 's' : ''} completed`;
        case SET_TYPES.AMRAP:
            const amrapReps = completedSets.map(s => s.reps || 'N/A').join(', ');
            const amrapWeight = completedSets[0]?.weight;
            // Corrected: Use template literals correctly
            return `${numSets} set${numSets > 1 ? 's' : ''} AMRAP: (${amrapReps}) reps ${amrapWeight ? `@ ${amrapWeight}lbs` : ''}`;
        case SET_TYPES.WARMUP:
        case SET_TYPES.STANDARD:
        default:
            const repsList = completedSets.map(s => String(s.reps || '').trim());
            const weightsList = completedSets.map(s => String(s.weight || '').trim());
            const uniqueReps = [...new Set(repsList.filter(r => r))];
            const uniqueWeights = [...new Set(weightsList.filter(w => w))];
            
            let repsDisplay;
            if (uniqueReps.length === 1) repsDisplay = `${uniqueReps[0]} reps`;
            // Corrected: no backslash for ( or )
            else if (uniqueReps.length > 1) repsDisplay = `(${repsList.join(', ')}) reps`;
            else repsDisplay = 'N/A reps';
            
            let weightDisplay = '';
            if (uniqueWeights.length === 1 && uniqueWeights[0]) weightDisplay = `@ ${uniqueWeights[0]}lbs`;
            // Corrected: no backslash for ( or )
            else if (uniqueWeights.length > 1) weightDisplay = `@ (${weightsList.join(', ')}) lbs`;
            
            // Corrected: Use template literals correctly
            return `${numSets} set${numSets > 1 ? 's' : ''} of ${repsDisplay} ${weightDisplay}`;
    }
};