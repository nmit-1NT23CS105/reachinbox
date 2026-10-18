/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                figma: {
                    green: '#00a854',
                    greenHover: '#00875a',
                    greenLight: '#e6f4ea',
                    greenBorder: '#a8dab5',
                    bg: '#ffffff',
                    sidebar: '#ffffff',
                    card: '#ffffff',
                    input: '#f1f3f4',
                    border: '#e5e7eb',
                    textPrimary: '#111827',
                    textSecondary: '#5f6368',
                    textMuted: '#9ca3af',
                    orangeBadge: '#fff3e0',
                    orangeText: '#d97706',
                    grayBadge: '#f1f3f4',
                    grayBadgeText: '#5f6368',
                },
                brand: {
                    green: '#00a854',
                    greenLight: '#e6f4ea',
                },
            },
            borderRadius: {
                pill: '9999px',
                card: '16px',
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
