import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    selectedCategory: string;
    currentSection: string;
}

const initialState: UIState = {
    selectedCategory: 'rolls', // Default matching existing context
    currentSection: 'HOME',
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setSelectedCategory: (state, action: PayloadAction<string>) => {
            state.selectedCategory = action.payload;
        },
        setCurrentSection: (state, action: PayloadAction<string>) => {
            state.currentSection = action.payload;
        },
    },
});

export const { setSelectedCategory, setCurrentSection } = uiSlice.actions;
export default uiSlice.reducer;
