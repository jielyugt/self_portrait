# MBTI Portrait Generator - System Documentation

## Overview
The Portrait Generator uses MBTI (Myers-Briggs Type Indicator) personality dimensions to select facial features from different face files. Users adjust 4 continuous sliders representing the MBTI dimensions, and the system maps the calculated scores to specific face variations.

## Updated System Architecture
The system now maps MBTI scores directly to face files rather than morphing a single base face:
- Score = -1 → Uses features from `face_1.json`
- Score = +1 → Uses features from `face_N.json` (where N is the number of available faces)
- Intermediate scores select the closest face file

## MBTI Slider System

### The Four Dimensions
1. **E/I (Extraversion/Introversion)**
   - Range: -1 (Full Extraversion) to +1 (Full Introversion)
   - Default: 0 (Neutral)

2. **S/N (Sensing/Intuition)**  
   - Range: -1 (Full Sensing) to +1 (Full Intuition)
   - Default: 0 (Neutral)

3. **T/F (Thinking/Feeling)**
   - Range: -1 (Full Thinking) to +1 (Full Feeling)
   - Default: 0 (Neutral)

4. **J/P (Judging/Perceiving)**
   - Range: -1 (Full Judging) to +1 (Full Perceiving)
   - Default: 0 (Neutral)

## Updated Feature Weights (Normalized to sum |weights| = 1.0)

### Eye Selection
- **E/I Weight (-0.3)**: Extraverts favor lower-numbered faces
- **S/N Weight (-0.2)**: Sensors favor lower-numbered faces  
- **J/P Weight (0.5)**: Perceivers favor higher-numbered faces
- *Calculation*: `eye_score = -0.3×e_i - 0.2×s_n + 0.5×j_p`

### Mouth Selection
- **E/I Weight (-0.5)**: Extraverts favor lower-numbered faces
- **T/F Weight (-0.5)**: Thinkers favor lower-numbered faces
- *Calculation*: `mouth_score = -0.5×e_i - 0.5×t_f`

### Head Selection  
- **S/N Weight (0.6)**: Intuitives favor higher-numbered faces
- **T/F Weight (0.4)**: Feelers favor higher-numbered faces
- *Calculation*: `head_score = 0.6×s_n + 0.4×t_f`

### Proportion Selection
- **E/I Weight (0.7)**: Introverts favor higher-numbered faces
- **J/P Weight (0.3)**: Perceivers favor higher-numbered faces
- *Calculation*: `proportion_score = 0.7×e_i + 0.3×j_p`

### Movement Control (NEW)
- **S/N Weight (-0.4)**: Sensors reduce animation movement
- **J/P Weight (0.6)**: Perceivers increase animation movement
- *Calculation*: `movement_score = -0.4×s_n + 0.6×j_p`

## Calculation Formula

Each feature parameter is calculated as:
```
parameter_value = (e_i_weight × e_i_value) + (s_n_weight × s_n_value) + (t_f_weight × t_f_value) + (j_p_weight × j_p_value)
```

For example, the eye parameter:
```
eye_value = (-0.3 × e_i) + (-0.2 × s_n) + (0.1 × t_f) + (0.5 × j_p)
```

## User Interface Features

### Real-time Updates
- Sliders provide immediate visual feedback
- Portrait morphs in real-time as sliders are adjusted
- Parameter values are displayed numerically

### Value Display
- Shows current personality tendency (e.g., "E0.7", "Neutral", "I0.3")
- Displays calculated face parameters (Eye, Mouth, Head, Proportion)

### Randomize Function
- Generates random MBTI values across all dimensions
- Useful for exploration and discovering different personality-based faces

### Keyboard Shortcuts
- Press 'S' to save the current portrait as PNG

## Technical Implementation

### File Structure
- `mbti-ui.js` - MBTI slider interface controller
- `config.js` - Updated with MBTI configuration and feature weights
- `sketch.js` - Modified to use MBTI system instead of face blending
- `index.html` - Updated UI layout for sliders

### Key Functions
- `handleMBTIChange()` - Processes MBTI value changes
- `generateMBTIFace()` - Creates face based on MBTI parameters
- `calculateFaceParameters()` - Converts MBTI to face parameters
- `applyFaceParameterToPoints()` - Modifies face geometry

## Customization Options

### Adjusting Feature Weights
Edit the `MBTI.FEATURE_WEIGHTS` section in `config.js` to modify how personality dimensions affect facial features.

### Adding New Features
1. Add new feature weights to `MBTI.FEATURE_WEIGHTS`
2. Create corresponding parameter application function
3. Update the rendering system to use the new parameter

### Changing Base Face
Currently uses `face_1.json` as the base. This can be made configurable or dynamic based on additional parameters.
