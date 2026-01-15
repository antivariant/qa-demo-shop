import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    selectedCategory: string;
    currentSection: string;
}

const initialState: UIState = {
    selectedCategory: 'all', // Show all products by default
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
