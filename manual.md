# Class Tracker – User Manual

Welcome! This guide walks you through the **Class Tracker** application, describing every button and control you’ll see on the screen and how to use them. No technical jargon—just plain instructions for everyday users.

---

## 1️⃣ Selecting a Class
- **Dropdown menu (top‑left)** – Shows all classes you have created.
- Click the dropdown, then click the class name you want to work with. The rest of the interface updates to display that class’s data.

---

## 2️⃣ Managing Classes
| Button | What it does | How to use |
|--------|--------------|------------|
| **New Class** | Creates a fresh class for a new group of students. | Click → Enter a name when prompted (e.g., "Math 101") → Choose the number of rows and columns for the grid (default is 5×5). A new date view for today will be added automatically.
| **Rename** | Changes the name of the currently selected class. | Click → Type the new name in the prompt that appears → Press **OK**.
| **Delete** | Removes the selected class permanently. | Click → Confirm the deletion when asked. (Be careful – this cannot be undone.)

---

## 3️⃣ Editing Criteria
- **Edit Criteria** button opens a panel where you can define or change the criteria that students are evaluated on (e.g., "Homework", "Participation").
- After making changes, click **Save** to apply them to the current class or date view.

---

## 4️⃣ Data Menu (Export / Import)
- Click the **Data** button to open a small overlay with four options:
  - **Export Class** – Saves the whole class (including all dates and student data) as a JSON file you can keep on your computer.
  - **Export CSV** – Generates a spreadsheet‑friendly CSV of the current view’s data.
  - **Export Student Collated CSV** – Creates a CSV that combines every student’s data across all dates, useful for reporting.
  - **Import Classes** – Allows you to bring in previously exported JSON files. (Only available when edit mode is enabled.)
- Click any option; the file will download automatically. For import, select the file after the dialog appears.

---

## 5️⃣ Viewing Trends (Charts)
1. **Trend** button – Opens a modal window where you can pick which numeric criterion to chart.
2. Inside the modal, you’ll see a row of buttons—one for each numeric criterion (e.g., "Score", "Points").
3. Click the button that matches the metric you want to visualise.
4. The line chart appears instantly, showing how the selected value has changed over time for every student.
5. To close the chart, click anywhere outside the white dialog area or press **Esc** (if supported).

---

## 6️⃣ Managing Date Views
- When you create a new class, a view for today is added automatically.
- To add a new date view, click the **Add Date** button (requires edit mode to be enabled) and enter the date in `YYYY-MM-DD` format when prompted. The new view will inherit the seating arrangement and criteria from the most recent view, with all numeric counters reset to **0**.
- To remove the currently displayed date view, click **Remove Date** (requires edit mode). This cannot be undone.
- Use the **<** and **>** navigation buttons or the date dropdown to switch between existing views.

---

## 7️⃣ General Tips
- All actions are **immediate**; you’ll see changes on screen right away.
- If something looks wrong, use the **Delete** button to remove a class or view and start over.
- Keep regular **exports** of your classes so you have backups.
- The Trend chart is read‑only—just for visualising progress; it does not modify any data.

---

That’s everything you need to get started. Enjoy tracking your classes!

If you encounter any issues, please report them at https://github.com/pnjacket/class-tracker/issues.
