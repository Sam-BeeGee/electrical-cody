import React from 'react';

// --- Default Bot Icon ---
const DefaultBotIcon = ({ color, path }) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill={color} />
        <path d={path} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// --- Trade-Specific Icons ---
export const ElectricalIcon = () => <DefaultBotIcon color="#16a34a" path="M17 6L9 18H15L15 26L23 14H17L17 6Z" />;
export const HvacIcon = () => <DefaultBotIcon color="#d97706" path="M12 4V20M12 4H8M12 4H16M12 20H8M12 20H16M4 12H20M4 12V8M4 12V16M20 12V8M20 12V16" />;
export const PlumberIcon = () => <DefaultBotIcon color="#0284c7" path="M12 4V8M12 8H4V16H12V20M12 8H20V16H12" />;
export const ArchitectIcon = () => <DefaultBotIcon color="#7c3aed" path="M4 20L16 4L28 20H4ZM12 14L16 20L20 14" />;
export const SprinklerIcon = () => <DefaultBotIcon color="#db2777" path="M12 2L12 6M12 22L12 18M2 12L6 12M22 12L18 12M6 6L9 9M18 18L15 15M6 18L9 15M18 6L15 9" />;
export const StructuralIcon = () => <DefaultBotIcon color="#64748b" path="M4 20V8H28V20M10 8V4H22V8M16 8V20" />;
