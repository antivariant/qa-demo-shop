# Functional Requirements & Rules
*Source of Truth for QA and Development*

## 1. Visual Style & Color Palette
- **Primary Colors**: Black (`#000`), White (`#fff`).
- **Accent Colors**: 
  - **Warm Orange**: `#FF4D00` (Reference: Mascot outline).
  - **Cold Blue**: `#00D2FF` (Reference: Mascot sleeve pattern).
- **Consistency**: All pages must strictly adhere to this palette.

## 2. Store Layout (Grid & Sections)
- **Header Removal**: The explicit "Rolls" category title is removed.
- **Featured Label**: "Hacker's Choice" text moved to top-left corner, small size.
- **Featured Section (Left Side)**:
  - Layout: 2x2 grid of cards.
  - Sizing: Cards must fill available space.
  - Aspect Ratio: Fixed 2:3 (Width:Height).
  - Info Panel: visual style matches standard list cards.
- **Product List (Right Side)**:
  - Standard grid list interaction.
  - Deduplication: Products shown in Featured MUST NOT appear in this list.

## 3. Product Card Interaction
### Default State
- **Add Button**: Hidden by default.

### Hover State (Card)
- **Add Button**: Becomes visible (White color) when hovering anywhere on the card.

### Hover State (Button)
- **Add Button**: Changes color to **Warm Orange** when hovering specifically over the button.

### Cart Interaction
- **Click**: Adds item to cart. 
- **Active State (Item in Cart)**:
  - Button is REPLACED by a **Quantity Badge**.
  - **Badge Style**: Round, transparent background, white outline.
  - **Badge Visibility**: Always visible if quantity > 0.

### Quantity Controls (Active State)
- **Interaction**: Hovering over the Quantity Badge area reveals `+` and `-` buttons.
- **Animation**: Buttons "slide out" from behind the badge (left and right).
- **Persistence**: Controls remain visible as long as cursor is over the control area (Badge + Buttons).
- **Exit**: Buttons "slide in" (hide) when cursor leaves the area.

## 4. Navigation & Filtering
- **Category Filter**:
  - Selecting a category in the Global Menu filters BOTH Featured and List sections.
  - Default category: 'Rolls'.
- **Scroll Behavior**:
  - Clicking a category in Menu automally scrolls page to the Store section.
- **Active State Highlighting**:
  - Menu item must highlight to reflect the currently viewed section/category.
  - Scrolling through sections updates the highlighed menu item.
  - Scrolling to Store updates menu to highlight the active Category.
