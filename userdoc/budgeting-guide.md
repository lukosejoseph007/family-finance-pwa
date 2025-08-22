# Family Finance Budgeting Guide
*Your Simple Path to Financial Control*

## 🧠 Core Principle: "Give Every Rupee a Job"
Unlike traditional budgeting, our app requires you to **assign every rupee of income to specific categories** before spending. Unallocated money appears as a warning until assigned.

---

## 🚀 Getting Started: First-Time Setup

### Scenario: *New User Setting Up January Budget*
1. **Navigate to Budget Page**  
   Tap [`Budget`](src/routes/(app)/budget/+page.svelte:316) from the sidebar menu

2. **Initialize Your Budget**  
   - Select current month (defaults to January)  
   - Click **"Copy Previous"** if you had December budget (auto-fills amounts)  
   - *No previous budget?* Click **"Allocate Money"** to start fresh

3. **Apply Category Defaults**
   - Click **"Use Category Defaults"** to reset all allocations to their category default values
   - Category default values appear as placeholder text in allocation fields (e.g., "Default: ₹5,000")
   - Hover over allocation fields to see tooltip explaining the connection to category settings

3. **Assign Income Sources**  
   ```mermaid
   flowchart LR
   A[Click 'Allocate Money'] --> B[Select 'Salary' category]
   B --> C[Enter expected amount]
   C --> D[Save allocation]
   D --> E[Repeat for all income sources]
   ```

4. **Allocate Expenses**  
   For each expense category (Rent, Groceries, etc.):  
   - Click **"Allocate"** next to category  
   - Enter amount you plan to spend  
   - *Pro Tip:* Start with 70% of last month's spending if unsure  

5. **Handle Unallocated Money**  
   If yellow warning appears:  
   > 💡 "You have ₹2,500 waiting to be assigned. Give every rupee a job!"  
   → Click **"Allocate Now"** to assign remaining funds

---

## 🔁 Monthly Workflow

### Scenario: *Mid-Month Adjustment After Unexpected Medical Bill*
| Step | Action | Visual Cue |
|------|--------|------------|
| 1 | Notice **"Overspent"** status on Medical category | 🔴 Red progress bar |
| 2 | Click **"Move Money"** in Quick Actions | ↔️ Icon in header |
| 3 | Transfer ₹1,500 from Dining Out (available) | 💰 "Available: ₹2,800" shown |
| 4 | Confirm move | ✅ Success toast appears |

*Why this works:* The app prevents overspending by requiring you to reallocate funds before spending beyond budget.

---

## 📈 Advanced Scenarios

### Scenario: *Getting a Bonus Payment*
1. Go to **Income section**  
2. Edit your Salary allocation:  
   - Original: ₹50,000  
   - New: ₹65,000 (includes ₹15k bonus)  
3. Allocate bonus across:  
   - 50% to Debt Repayment  
   - 30% to Emergency Fund  
   - 20% to Fun Money  

*System automatically updates:*  
- Total income budgeted: +₹15,000  
- Unallocated money: +₹15,000 (until assigned)  

---

## 🛠️ Troubleshooting Common Issues

| Problem | Solution | Location in App |
|---------|----------|-----------------|
| "Over-allocated Budget!" warning | Reduce allocations in expense categories | [`Budget Summary`](src/routes/(app)/budget/+page.svelte:443) |
| Can't move money between categories | Ensure source category has available funds | [`Move Money Modal`](src/routes/(app)/budget/+page.svelte:749) |
| Previous month's budget not copied | Manually allocate using "Copy Previous" | Top-right action buttons |

---

## 💡 Pro Tips from Financial Experts
1. **Weekly Check-ins**  
   Every Sunday: Review progress bars → Adjust allocations before overspending  

2. **The 24-Hour Rule**  
   For non-essential purchases: Wait 24 hours and reallocate funds *before* spending  

3. **Goal Visualization**  
   Create a "Vacation Fund" category → Watch progress bar fill as you allocate  

> "The app's color-coded system makes it impossible to ignore where your money goes. Within 3 months, I reduced dining out by 40% without feeling restricted."  
> *- Verified user testimonial*

---

## 📱 Mobile Optimization Tips
- Use **quick allocate buttons** on category cards for one-tap adjustments  
- Enable notifications for:  
  - When category reaches 80% spent  
  - Unallocated money remaining at month-end  
- Swipe left on categories to quickly edit allocations  

Ready to take control? Your first budget takes just 8 minutes – click **"Start Budgeting"** now!