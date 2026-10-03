import type { SVGAttributes } from 'react';

// KIYOMI STOCK logo — buket/flower icon
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Stem */}
            <path d="M20 38 L20 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            {/* Left leaf */}
            <path d="M20 28 C16 26 13 22 15 18 C17 22 19 25 20 28Z" fill="currentColor" opacity="0.7"/>
            {/* Right leaf */}
            <path d="M20 28 C24 26 27 22 25 18 C23 22 21 25 20 28Z" fill="currentColor" opacity="0.7"/>
            {/* Center flower */}
            <circle cx="20" cy="14" r="4" fill="currentColor"/>
            {/* Petals */}
            <ellipse cx="20" cy="7" rx="3" ry="4" fill="currentColor" opacity="0.85"/>
            <ellipse cx="20" cy="21" rx="3" ry="4" fill="currentColor" opacity="0.85"/>
            <ellipse cx="13" cy="14" rx="4" ry="3" fill="currentColor" opacity="0.85"/>
            <ellipse cx="27" cy="14" rx="4" ry="3" fill="currentColor" opacity="0.85"/>
            <ellipse cx="15.1" cy="9.1" rx="3" ry="4" transform="rotate(-45 15.1 9.1)" fill="currentColor" opacity="0.7"/>
            <ellipse cx="24.9" cy="9.1" rx="3" ry="4" transform="rotate(45 24.9 9.1)" fill="currentColor" opacity="0.7"/>
            <ellipse cx="15.1" cy="18.9" rx="3" ry="4" transform="rotate(45 15.1 18.9)" fill="currentColor" opacity="0.7"/>
            <ellipse cx="24.9" cy="18.9" rx="3" ry="4" transform="rotate(-45 24.9 18.9)" fill="currentColor" opacity="0.7"/>
            {/* Center dot */}
            <circle cx="20" cy="14" r="2.5" fill="white" opacity="0.9"/>
        </svg>
    );
}
