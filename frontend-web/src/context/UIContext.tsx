"use client";

import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
    selectedCategory: string; // "ALL" or ID
    setSelectedCategory: (id: string) => void;
    currentSection: string; // "HOME", "STORE", "ABOUT"
    setCurrentSection: (section: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [currentSection, setCurrentSection] = useState('HOME');

    return (
        <UIContext.Provider value={{
            selectedCategory,
            setSelectedCategory,
            currentSection,
            setCurrentSection
        }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
