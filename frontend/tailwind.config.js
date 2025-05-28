/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens mapped to CSS variables
        bg:             "var(--color-bg)",
        surface:        "var(--color-surface)",
        "surface-alt":  "var(--color-surface-alt)",
        divider:        "var(--color-divider)",
        border:         "var(--color-border)",
        "border-strong":"var(--color-border-strong)",
        primary:        "var(--color-primary)",
        secondary:      "var(--color-secondary)",
        muted:          "var(--color-muted)",
        subtle:         "var(--color-subtle)",
        placeholder:    "var(--color-placeholder)",
        disabled:       "var(--color-disabled)",
        inverse:        "var(--color-inverse)",
        
        // Interactive states
        "hover-bg":     "var(--color-hover-bg)",
        "hover-border": "var(--color-hover-border)",
        "active-bg":    "var(--color-active-bg)",
        "focus-ring":   "var(--color-focus-ring)",
        
        // Status colors
        success:        "var(--color-success)",
        "success-bg":   "var(--color-success-bg)",
        warning:        "var(--color-warning)",
        "warning-bg":   "var(--color-warning-bg)",
        error:          "var(--color-error)",
        "error-bg":     "var(--color-error-bg)",
        info:           "var(--color-info)",
        "info-bg":      "var(--color-info-bg)",
        
        // Strategic accent colors
        "accent-primary":   "var(--color-accent-primary)",
        "accent-secondary": "var(--color-accent-secondary)",
        "accent-teal":      "var(--color-accent-teal)",
        
        // Category colors
        "category-gdpr":    "var(--color-category-gdpr)",
        "category-sox":     "var(--color-category-sox)",
        "category-hipaa":   "var(--color-category-hipaa)",
        "category-pci":     "var(--color-category-pci)",
        "category-iso":     "var(--color-category-iso)",
        "category-ccpa":    "var(--color-category-ccpa)",
        
        // Alert backgrounds
        "alert-success-bg": "var(--color-alert-success-bg)",
        "alert-warning-bg": "var(--color-alert-warning-bg)",
        "alert-error-bg":   "var(--color-alert-error-bg)",
        "alert-info-bg":    "var(--color-alert-info-bg)",
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        'lg': '0.5rem',
        'md': '0.375rem',
        'sm': '0.25rem',
      },
    },
  },
  plugins: [],
} 