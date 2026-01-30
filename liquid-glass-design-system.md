# Apple Liquid Glass Design System
## Premium Web Application UI Guidelines

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Design Tokens](#design-tokens)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Component Library](#component-library)
6. [Page Designs](#page-designs)
7. [Animation Guidelines](#animation-guidelines)
8. [Tailwind CSS Mapping](#tailwind-css-mapping)
9. [Responsive Breakpoints](#responsive-breakpoints)

---

## Design Philosophy

### Liquid Glass Aesthetic
The Liquid Glass design language creates a sense of depth, luminosity, and premium quality through:

- **Frosted translucency** that mimics etched glass
- **Layered depth** with subtle shadows and blur
- **Light reflections** that add dimensionality
- **Smooth transitions** between states
- **Calm, minimal** visual hierarchy

### Core Principles
1. **Clarity** - Information is immediately understandable
2. **Deference** - UI gets out of the way of content
3. **Depth** - Layers create visual hierarchy
4. **Consistency** - Unified design language throughout

---

## Design Tokens

### Spacing Scale
```
xs:   4px   (0.25rem)
sm:   8px   (0.5rem)
md:   16px  (1rem)
lg:   24px  (1.5rem)
xl:   32px  (2rem)
2xl:  48px  (3rem)
3xl:  64px  (4rem)
4xl:  96px  (6rem)
```

### Border Radius
```
sm:   8px   (0.5rem)
md:   12px  (0.75rem)
lg:   16px  (1rem)
xl:   20px  (1.25rem)
2xl:  24px  (1.5rem)
full: 9999px
```

### Shadows (Soft & Layered)
```
shadow-sm:    0 1px 2px rgba(0,0,0,0.04)
shadow-md:    0 4px 12px rgba(0,0,0,0.05)
shadow-lg:    0 8px 24px rgba(0,0,0,0.06)
shadow-xl:    0 16px 48px rgba(0,0,0,0.08)
shadow-glow:  0 0 40px rgba(0,122,255,0.15)
```

### Blur Values
```
blur-sm:   4px
blur-md:   8px
blur-lg:   16px
blur-xl:   24px
blur-2xl:  40px
```

### Opacity Scale
```
0:   0%
10:  10%
20:  20%
30:  30%
40:  40%
50:  50%
60:  60%
70:  70%
80:  80%
90:  90%
100: 100%
```

---

## Color Palette

### Primary Colors
| Token | Hex | RGBA | Usage |
|-------|-----|------|-------|
| `--ios-blue` | #007AFF | rgba(0,122,255,1) | Primary actions, links, accents |
| `--ios-blue-light` | #5AC8FA | rgba(90,200,250,1) | Hover states, highlights |
| `--ios-blue-dark` | #0051D5 | rgba(0,81,213,1) | Active states |

### Glass Surface Colors
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--glass-primary` | rgba(255,255,255,0.72) | rgba(28,28,30,0.72) | Primary glass surfaces |
| `--glass-secondary` | rgba(255,255,255,0.52) | rgba(44,44,46,0.52) | Secondary glass surfaces |
| `--glass-tertiary` | rgba(255,255,255,0.32) | rgba(58,58,60,0.32) | Tertiary glass surfaces |
| `--glass-hover` | rgba(255,255,255,0.85) | rgba(44,44,46,0.85) | Hover states |

### Background Colors
| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--bg-primary` | #F5F5F7 | #000000 |
| `--bg-secondary` | #FFFFFF | #1C1C1E |
| `--bg-tertiary` | #F2F2F7 | #2C2C2E |
| `--bg-elevated` | #FFFFFF | #3A3A3C |

### Text Colors
| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--text-primary` | #000000 | #FFFFFF |
| `--text-secondary` | #3C3C43 (60%) | #EBEBF5 (60%) |
| `--text-tertiary` | #3C3C43 (30%) | #EBEBF5 (30%) |
| `--text-accent` | #007AFF | #0A84FF |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | #34C759 | Success states |
| `--warning` | #FF9500 | Warning states |
| `--error` | #FF3B30 | Error states |
| `--info` | #5AC8FA | Info states |

### Gradient Presets
```css
/* Subtle Glass Gradient */
--gradient-glass: linear-gradient(
  180deg,
  rgba(255,255,255,0.8) 0%,
  rgba(255,255,255,0.6) 100%
);

/* Light Reflection */
--gradient-shine: linear-gradient(
  135deg,
  rgba(255,255,255,0.4) 0%,
  rgba(255,255,255,0) 50%,
  rgba(255,255,255,0.1) 100%
);

/* Depth Shadow */
--gradient-depth: linear-gradient(
  180deg,
  rgba(0,0,0,0) 0%,
  rgba(0,0,0,0.05) 100%
);
```

---

## Typography

### Font Stack
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif;
--font-mono: 'SF Mono', SFMono-Regular, ui-monospace, monospace;
```

### Type Scale
| Style | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| Display | 48px / 3rem | 700 | 1.1 | -0.02em |
| Title 1 | 34px / 2.125rem | 700 | 1.2 | -0.02em |
| Title 2 | 28px / 1.75rem | 600 | 1.25 | -0.01em |
| Title 3 | 22px / 1.375rem | 600 | 1.3 | -0.01em |
| Headline | 20px / 1.25rem | 600 | 1.3 | 0 |
| Body | 17px / 1.0625rem | 400 | 1.5 | 0 |
| Callout | 16px / 1rem | 500 | 1.4 | 0 |
| Subhead | 15px / 0.9375rem | 400 | 1.4 | 0 |
| Footnote | 13px / 0.8125rem | 400 | 1.4 | 0 |
| Caption 1 | 12px / 0.75rem | 400 | 1.3 | 0 |
| Caption 2 | 11px / 0.6875rem | 500 | 1.2 | 0.02em |

### Typography Patterns
```
/* Page Title */
.text-title-1 {
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

/* Section Header */
.text-headline {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
}

/* Body Text */
.text-body {
  font-size: 17px;
  font-weight: 400;
  line-height: 1.5;
}

/* Label */
.text-caption {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.3;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
```

---

## Component Library

### 1. Glass Card

#### Base Style
```css
.glass-card {
  /* Background */
  background: rgba(255, 255, 255, 0.72);
  
  /* Backdrop blur for frosted effect */
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  
  /* Border */
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  
  /* Shadow for depth */
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(0, 0, 0, 0.02),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  
  /* Light reflection overlay */
  position: relative;
  overflow: hidden;
}

/* Light reflection shine effect */
.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  pointer-events: none;
  border-radius: inherit;
}
```

#### Variants
```css
/* Elevated Card */
.glass-card--elevated {
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

/* Subtle Card */
.glass-card--subtle {
  background: rgba(255, 255, 255, 0.52);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.03),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

/* Dark Mode */
.glass-card--dark {
  background: rgba(28, 28, 30, 0.72);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}
```

### 2. Floating Navigation Bar

```css
.glass-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  
  /* Glass effect */
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  
  /* Bottom border */
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  
  /* Height and padding */
  height: 64px;
  padding: 0 24px;
  
  /* Flex layout */
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Nav items */
.glass-nav__item {
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  transition: all 0.2s ease;
}

.glass-nav__item:hover {
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.9);
}

.glass-nav__item--active {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}
```

### 3. Buttons

#### Primary Button
```css
.btn-primary {
  /* Base */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  /* Size */
  height: 44px;
  padding: 0 24px;
  border-radius: 12px;
  
  /* Typography */
  font-size: 16px;
  font-weight: 600;
  
  /* Colors */
  background: #007AFF;
  color: white;
  
  /* Border */
  border: none;
  
  /* Shadow */
  box-shadow: 
    0 2px 8px rgba(0, 122, 255, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.1);
  
  /* Transition */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  background: #0051D5;
  transform: translateY(-1px);
  box-shadow: 
    0 4px 12px rgba(0, 122, 255, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 
    0 1px 4px rgba(0, 122, 255, 0.3);
}
```

#### Glass Button
```css
.btn-glass {
  /* Glass effect */
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  
  /* Other properties same as primary */
  color: #007AFF;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.btn-glass:hover {
  background: rgba(255, 255, 255, 0.8);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: rgba(0, 0, 0, 0.04);
  color: #007AFF;
  border: none;
  box-shadow: none;
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.08);
}
```

### 4. Input Fields

```css
.glass-input {
  /* Size */
  height: 48px;
  padding: 0 16px;
  border-radius: 12px;
  
  /* Glass effect */
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  
  /* Typography */
  font-size: 16px;
  color: #000000;
  
  /* Placeholder */
  &::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }
  
  /* Focus state */
  &:focus {
    outline: none;
    border-color: #007AFF;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
  }
}
```

### 5. iOS Toggle Switch

```css
.ios-toggle {
  position: relative;
  width: 51px;
  height: 31px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.16);
    border-radius: 31px;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    /* Thumb */
    &::before {
      content: '';
      position: absolute;
      height: 27px;
      width: 27px;
      left: 2px;
      bottom: 2px;
      background: white;
      border-radius: 50%;
      transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
  
  input:checked + .slider {
    background-color: #34C759;
  }
  
  input:checked + .slider::before {
    transform: translateX(20px);
  }
}
```

### 6. Segmented Control

```css
.segmented-control {
  display: inline-flex;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  padding: 2px;
  
  .segment {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.6);
    transition: all 0.2s ease;
    cursor: pointer;
    
    &:hover {
      color: rgba(0, 0, 0, 0.8);
    }
    
    &.active {
      background: white;
      color: #000000;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }
}
```

### 7. Search Bar

```css
.glass-search {
  display: flex;
  align-items: center;
  gap: 12px;
  
  /* Glass effect */
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  
  /* Size */
  height: 44px;
  padding: 0 16px;
  
  /* Icon */
  .search-icon {
    width: 18px;
    height: 18px;
    color: rgba(0, 0, 0, 0.4);
  }
  
  /* Input */
  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 16px;
    color: #000000;
    
    &::placeholder {
      color: rgba(0, 0, 0, 0.4);
    }
    
    &:focus {
      outline: none;
    }
  }
  
  /* Focus state */
  &:focus-within {
    background: rgba(255, 255, 255, 0.8);
    border-color: #007AFF;
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
  }
}
```

### 8. List Items

```css
.list-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
  
  &:active {
    background: rgba(0, 0, 0, 0.08);
  }
  
  /* Icon container */
  .icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(0, 122, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #007AFF;
  }
  
  /* Content */
  .content {
    flex: 1;
    
    .title {
      font-size: 16px;
      font-weight: 500;
      color: #000000;
    }
    
    .subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 2px;
    }
  }
  
  /* Chevron */
  .chevron {
    width: 20px;
    height: 20px;
    color: rgba(0, 0, 0, 0.3);
  }
}
```

### 9. Badge/Tag

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  
  &--primary {
    background: rgba(0, 122, 255, 0.1);
    color: #007AFF;
  }
  
  &--success {
    background: rgba(52, 199, 89, 0.1);
    color: #34C759;
  }
  
  &--warning {
    background: rgba(255, 149, 0, 0.1);
    color: #FF9500;
  }
  
  &--error {
    background: rgba(255, 59, 48, 0.1);
    color: #FF3B30;
  }
}
```

### 10. Modal/Sheet

```css
.glass-modal {
  /* Backdrop */
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
  
  /* Content */
  .modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    
    /* Glass card */
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(30px) saturate(180%);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    
    /* Shadow */
    box-shadow: 
      0 24px 64px rgba(0, 0, 0, 0.15),
      0 4px 12px rgba(0, 0, 0, 0.05);
    
    /* Size */
    width: 90%;
    max-width: 480px;
    max-height: 90vh;
    overflow: auto;
  }
}

/* Bottom Sheet (Mobile) */
.glass-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  
  /* Glass effect */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(30px) saturate(180%);
  border-radius: 24px 24px 0 0;
  
  /* Handle */
  &::before {
    content: '';
    display: block;
    width: 36px;
    height: 5px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    margin: 12px auto;
  }
}
```

---

## Page Designs

### 1. Landing Page

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  [Floating Glass Nav]                                    │
│  Logo    Home  Features  Pricing  [Sign In] [Sign Up]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │   HERO SECTION                                  │   │
│  │                                                 │   │
│  │   Book Your Journey                             │   │
│  │   Discover and book buses, flights, and hotels  │   │
│  │   at the best prices.                           │   │
│  │                                                 │   │
│  │   [Get Started] [Learn More]                    │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  SEARCH CARD (Glass)                            │   │
│  │                                                 │   │
│  │  [Bus] [Flight] [Hotel]  ← Segmented Control    │   │
│  │                                                 │   │
│  │  From: [_________]  To: [_________]             │   │
│  │  Date: [_________]  Passengers: [__▼]           │   │
│  │                                                 │   │
│  │           [      Search      ]                  │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  FEATURES SECTION                               │   │
│  │                                                 │   │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐          │   │
│  │  │ 🚌  │  │ ✈️  │  │ 🏨  │  │ 💎  │          │   │
│  │  │Bus  │  │Fly  │  │Stay │  │Save │          │   │
│  │  └─────┘  └─────┘  └─────┘  └─────┘          │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  HOW IT WORKS                                   │   │
│  │  1 → 2 → 3                                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Footer]                                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Specifications
- **Background**: Gradient from #F5F5F7 to #FFFFFF
- **Hero**: Large typography (48px), centered
- **Search Card**: Floating glass card with segmented control
- **Features**: 4-column grid with glass cards
- **Spacing**: 96px between sections

---

### 2. Login / Signup Page

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                      [Logo]                             │
│                   Lean Travel                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │   Welcome Back                                  │   │
│  │   Sign in to continue                           │   │
│  │                                                 │   │
│  │   ┌─────────┐ ┌─────────┐                       │   │
│  │   │ Password│ │   OTP   │  ← Segmented Control  │   │
│  │   └─────────┘ └─────────┘                       │   │
│  │                                                 │   │
│  │   Email                                         │   │
│  │   ┌─────────────────────────────────────┐      │   │
│  │   │ 📧 user@example.com                 │      │   │
│  │   └─────────────────────────────────────┘      │   │
│  │                                                 │   │
│  │   Password                                      │   │
│  │   ┌─────────────────────────────────────┐      │   │
│  │   │ 🔒 ••••••••                [👁️]     │      │   │
│  │   └─────────────────────────────────────┘      │   │
│  │                                                 │   │
│  │   [ ] Remember me          Forgot Password?     │   │
│  │                                                 │   │
│  │   ┌─────────────────────────────────────┐      │   │
│  │   │         Sign In                     │      │   │
│  │   └─────────────────────────────────────┘      │   │
│  │                                                 │   │
│  │   ───────────── or continue with ─────────────  │   │
│  │                                                 │   │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐        │   │
│  │   │ Google  │  │ Apple   │  │ Phone   │        │   │
│  │   └─────────┘  └─────────┘  └─────────┘        │   │
│  │                                                 │   │
│  │   Don't have an account? Sign Up                │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Specifications
- **Card Width**: 420px max
- **Card Padding**: 40px
- **Input Height**: 48px
- **Button Height**: 52px
- **Border Radius**: 20px for card, 12px for inputs

---

### 3. Search Results Page

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  [Floating Glass Nav]                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  SEARCH BAR (Compact)                           │   │
│  │  Delhi → Mumbai | 24 Jan | 2 Passengers [Edit]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Filters: [All] [AC] [Sleeper] [Price: Low-High] ▼     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  RESULT CARD 1 (Glass)                          │   │
│  │                                                 │   │
│  │  🚌 Volvo AC Sleeper              ₹1,299       │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━▶  16h 30m           │   │
│  │  18:00 Delhi        06:30 Mumbai              │   │
│  │                                                 │   │
│  │  [4.5★] 2,340 reviews    12 seats left        │   │
│  │                                                 │   │
│  │  Amenities: ❄️ 📶 🔌 🎧                        │   │
│  │                                                 │   │
│  │                    [  Select Seats  ]          │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  RESULT CARD 2 (Glass)                          │   │
│  │  ...                                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  RESULT CARD 3 (Glass)                          │   │
│  │  ...                                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Specifications
- **Card Padding**: 24px
- **Card Gap**: 16px
- **Route Line**: Gradient line with plane/bus icon
- **Price**: Right-aligned, bold
- **Reviews**: Star rating with count

---

### 4. Booking Details Page

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  [Floating Glass Nav]                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  JOURNEY SUMMARY                                │   │
│  │                                                 │   │
│  │  🚌 Volvo AC Sleeper                            │   │
│  │  Delhi → Mumbai                                 │   │
│  │  24 Jan, 2024 | 18:00 - 06:30 (+1)             │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  SELECT SEATS                                   │   │
│  │                                                 │   │
│  │     ┌─────────────────────────┐                │   │
│  │     │    [DRIVER]             │                │   │
│  │     │  ┌─┐ ┌─┐    ┌─┐ ┌─┐    │                │   │
│  │     │  │A│ │B│    │C│ │D│    │                │   │
│  │     │  └─┘ └─┘    └─┘ └─┘    │                │   │
│  │     │  ┌─┐ ┌─┐    ┌─┐ ┌─┐    │                │   │
│  │     │  │A│ │B│ ✓  │C│ │D│    │                │   │
│  │     │  └─┘ └─┘    └─┘ └─┘    │                │   │
│  │     └─────────────────────────┘                │   │
│  │                                                 │   │
│  │  Legend: ● Available  ● Selected  ● Booked     │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PASSENGER DETAILS                              │   │
│  │                                                 │   │
│  │  Passenger 1                                    │   │
│  │  Name: [____________________]                   │   │
│  │  Age:  [__]  Gender: (○) Male (○) Female        │   │
│  │                                                 │   │
│  │  + Add Passenger                                │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PRICE BREAKDOWN                                │   │
│  │                                                 │   │
│  │  Base Fare (2 seats)              ₹2,598       │   │
│  │  Convenience Fee                    ₹52        │   │
│  │  ─────────────────────────────────────────      │   │
│  │  Total                            ₹2,650       │   │
│  │                                                 │   │
│  │  [      Proceed to Payment      ]              │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 5. Payment Page

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  [Floating Glass Nav]                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PAYMENT METHOD                                 │   │
│  │                                                 │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │  Card   │ │  UPI    │ │ Wallet  │           │   │
│  │  └─────────┘ └─────────┘ └─────────┘           │   │
│  │                                                 │   │
│  │  Card Number                                    │   │
│  │  ┌─────────────────────────────────────┐       │   │
│  │  │ 💳 1234 5678 9012 3456              │       │   │
│  │  └─────────────────────────────────────┘       │   │
│  │                                                 │   │
│  │  Expiry: [__ / __]    CVV: [___] [?]          │   │
│  │                                                 │   │
│  │  [ ] Save card for future payments            │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ORDER SUMMARY                                  │   │
│  │                                                 │   │
│  │  Volvo AC Sleeper × 2             ₹2,598       │   │
│  │  Convenience Fee                    ₹52        │   │
│  │  ─────────────────────────────────────────      │   │
│  │  Total Payable                    ₹2,650       │   │
│  │                                                 │   │
│  │  ┌─────────────────────────────────────┐       │   │
│  │  │     Pay ₹2,650                      │       │   │
│  │  └─────────────────────────────────────┘       │   │
│  │                                                 │   │
│  │  🔒 Secured by Razorpay                        │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 6. Booking Confirmation Page

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  [Floating Glass Nav]                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │              ┌─────────┐                        │   │
│  │              │    ✓    │  ← Animated check      │   │
│  │              └─────────┘                        │   │
│  │                                                 │   │
│  │         Booking Confirmed!                      │   │
│  │                                                 │   │
│  │    Your booking has been confirmed.             │   │
│  │    Booking ID: #LT123456789                     │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  TICKET DETAILS                                 │   │
│  │                                                 │   │
│  │  🚌 Volvo AC Sleeper                            │   │
│  │  Delhi → Mumbai                                 │   │
│  │  24 Jan, 2024 | 18:00 - 06:30 (+1)             │   │
│  │                                                 │   │
│  │  Seats: L1, L2                                  │   │
│  │  Passengers: John Doe, Jane Doe                 │   │
│  │                                                 │   │
│  │  Boarding Point: Kashmere Gate ISBT            │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  WHAT'S NEXT?                                   │   │
│  │                                                 │   │
│  │  [📧 Email Ticket]  [📱 SMS Ticket]             │   │
│  │                                                 │   │
│  │  [    Download Ticket    ]                      │   │
│  │                                                 │   │
│  │  [    View My Bookings   ]                      │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Specifications
- **Success Animation**: Checkmark with scale + fade
- **Confetti**: Optional subtle celebration effect
- **Ticket**: QR code placeholder
- **Actions**: Clear CTAs for next steps

---

### 7. User Dashboard

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  [Floating Glass Nav]                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  👤 John Doe                                    │   │
│  │  john@example.com | +91 98765 43210            │   │
│  │                                                 │   │
│  │  [Edit Profile]  [Wallet: ₹500]                │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  QUICK ACTIONS                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 🎫 My    │ │ 💳 Pay-  │ │ 🔔 Noti- │ │ ⚙️ Set-  │  │
│  │ Bookings │ │ ments    │ │ fications│ │ tings    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  UPCOMING TRIPS                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🚌 Delhi → Mumbai                              │   │
│  │  24 Jan, 2024 | 18:00                          │   │
│  │  [View Details]  [Cancel]                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  RECENT BOOKINGS                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ✈️ Mumbai → Bangalore     ₹4,500  [Completed] │   │
│  │  🏨 Taj Palace, Mumbai     ₹8,000  [Completed] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  SAVED PASSENGERS                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  👤 Jane Doe (Spouse)                          │   │
│  │  👤 Mike Doe (Child)                           │   │
│  │  [+ Add New]                                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 8. Admin Dashboard

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  [Glass Sidebar]              [Floating Glass Header]   │
│  ┌──────────┐               ┌────────────────────────┐ │
│  │          │               │ Admin Panel    [👤] [🔔]│ │
│  │  Logo    │               └────────────────────────┘ │
│  │          │                                            │
│  │ Dashboard│  ┌────────────────────────────────────┐  │
│  │ Users    │  │  STATS CARDS                       │  │
│  │ Partners │  │                                    │  │
│  │ Bookings │  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │  │
│  │ Cancella-│  │  │ 👤 │ │ 📅 │ │ ₹  │ │ ⚠️ │     │  │
│  │ tions    │  │  │1.2K│ │ 856│ │12L │ │ 23 │     │  │
│  │ Reports  │  │  └────┘ └────┘ └────┘ └────┘     │  │
│  │ Settings │  │  Users  Book. Revenue Pending     │  │
│  │          │  └────────────────────────────────────┘  │
│  │ [👤 Admin│                                            │
│  │  Logout] │  ┌────────────────────────────────────┐  │
│  │          │  │  CHART: Bookings Over Time         │  │
│  └──────────┘  │  ╱╲                                  │  │
│                │ ╱  ╲    ╱╲                          │  │
│                │╱    ╲__╱  ╲__                       │  │
│                └────────────────────────────────────┘  │
│                                                         │
│                ┌────────────────────────────────────┐  │
│                │  RECENT BOOKINGS                   │  │
│                │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│                │  #LT123 | John Doe | ₹2,500 | ✓   │  │
│                │  #LT124 | Jane Doe | ₹4,200 | ✓   │  │
│                │  #LT125 | Mike Doe | ₹1,800 | ⏳  │  │
│                │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│                │  [View All]                        │  │
│                └────────────────────────────────────┘  │
│                                                         │
│                ┌────────────────────────────────────┐  │
│                │  QUICK ACTIONS                     │  │
│                │  [+ Add Partner] [Review Cancellations]│
│                └────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Specifications
- **Sidebar Width**: 260px
- **Sidebar Background**: rgba(28, 28, 30, 0.9)
- **Stats Cards**: 4-column grid
- **Charts**: Recharts or Chart.js
- **Tables**: Striped rows with hover states

---

## Animation Guidelines

### 1. Micro-interactions

#### Button Hover
```css
.btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: scale(0.98);
  transition-duration: 0.1s;
}
```

#### Card Hover
```css
.glass-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
}
```

#### Input Focus
```css
.glass-input {
  transition: all 0.2s ease;
}

.glass-input:focus {
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15);
}
```

### 2. Page Transitions

#### iOS-style Page Transition
```css
/* Enter */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Exit */
.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transition: opacity 0.2s ease;
}
```

### 3. Loading States

#### Skeleton Loading
```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.04) 25%,
    rgba(0, 0, 0, 0.08) 50%,
    rgba(0, 0, 0, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### Spinner
```css
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(0, 122, 255, 0.2);
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 4. Success Animation

```css
.success-check {
  animation: check-bounce 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes check-bounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

### 5. Modal/Sheet Animation

```css
.modal-backdrop {
  animation: fade-in 0.3s ease;
}

.modal-content {
  animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translate(-50%, -40%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
```

---

## Tailwind CSS Mapping

### Custom Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // iOS Colors
        'ios-blue': '#007AFF',
        'ios-blue-light': '#5AC8FA',
        'ios-blue-dark': '#0051D5',
        'ios-green': '#34C759',
        'ios-orange': '#FF9500',
        'ios-red': '#FF3B30',
        
        // Glass Surfaces
        'glass': {
          light: 'rgba(255, 255, 255, 0.72)',
          lighter: 'rgba(255, 255, 255, 0.52)',
          dark: 'rgba(28, 28, 30, 0.72)',
        },
        
        // Backgrounds
        'bg-primary': '#F5F5F7',
        'bg-secondary': '#FFFFFF',
        'bg-tertiary': '#F2F2F7',
      },
      
      backdropBlur: {
        'glass': '20px',
        'glass-lg': '30px',
      },
      
      boxShadow: {
        'glass': '0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 40px rgba(0, 122, 255, 0.15)',
      },
      
      borderRadius: {
        'glass': '20px',
        'ios': '12px',
      },
      
      fontFamily: {
        'sf': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Helvetica Neue', 'sans-serif'],
      },
      
      animation: {
        'fade-in': 'fade-in 0.3s ease',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'shimmer': 'shimmer 1.5s infinite',
      },
      
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};
```

### Utility Classes

```css
/* Glass Card */
.glass {
  @apply bg-white/70 backdrop-blur-glass border border-white/30 rounded-glass;
  @apply shadow-glass;
}

.glass-dark {
  @apply bg-gray-900/70 backdrop-blur-glass border border-white/10 rounded-glass;
}

/* Button */
.btn-ios {
  @apply h-11 px-6 rounded-ios font-semibold text-base;
  @apply bg-ios-blue text-white;
  @apply shadow-md transition-all duration-200;
  @apply hover:bg-ios-blue-dark hover:-translate-y-0.5;
  @apply active:scale-95 active:translate-y-0;
}

.btn-glass {
  @apply h-11 px-6 rounded-ios font-semibold text-base;
  @apply bg-white/60 backdrop-blur text-ios-blue;
  @apply border border-white/40;
}

/* Input */
.input-ios {
  @apply h-12 px-4 rounded-ios text-base;
  @apply bg-white/60 backdrop-blur border border-black/5;
  @apply focus:outline-none focus:border-ios-blue focus:ring-4 focus:ring-ios-blue/10;
}

/* Nav */
.nav-glass {
  @apply fixed top-0 left-0 right-0 z-50;
  @apply bg-white/70 backdrop-blur-glass border-b border-black/5;
  @apply h-16 px-6;
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Responsive Patterns

```css
/* Card Grid */
.card-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4;
}

/* Container */
.container-ios {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* Typography Scale */
.text-responsive-title {
  @apply text-2xl sm:text-3xl lg:text-4xl font-bold;
}

/* Navigation */
.nav-responsive {
  @apply hidden md:flex;
}

.nav-mobile {
  @apply flex md:hidden;
}
```

---

## Accessibility Guidelines

### Color Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text (18px+)
- Minimum 3:1 for UI components

### Focus States
- Visible focus indicators
- 2px outline or ring
- High contrast focus color

### Motion
- Respect `prefers-reduced-motion`
- Provide static alternatives
- No essential information in animation

### Screen Readers
- Semantic HTML
- ARIA labels where needed
- Alt text for images

---

## Implementation Notes

### Required Dependencies
```bash
npm install tailwindcss-animate
npm install @radix-ui/react-dialog
npm install @radix-ui/react-tabs
npm install lucide-react
```

### Browser Support
- Chrome 88+
- Safari 14+
- Firefox 78+
- Edge 88+

### Performance Tips
1. Use `will-change` sparingly
2. Prefer `transform` over position changes
3. Use CSS containment where possible
4. Lazy load below-fold content

---

*Design System Version 1.0*
*Last Updated: January 2025*