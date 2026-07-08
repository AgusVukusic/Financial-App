# Financial App 💰

A modern, full-featured personal and group finance tracking application built with React, Vite, and Firebase. This app allows users to seamlessly track their expenses, manage multiple accounts, set budgets, and share expenses with friends or roommates in real time.

## 🚀 Key Features

* **Personal Finance Dashboard**: Get a quick overview of your net worth, total balance, income, and expenses for any given month.
* **Multiple Accounts Management**: Track money across various platforms—banks, virtual wallets, credit cards, or physical cash. Transfers between accounts are handled intelligently.
* **Shared Expenses & Groups**: Create groups with friends or family, add shared expenses, and let the app automatically calculate who owes whom. Includes a complete debt settlement workflow with real-time UI updates.
* **Budgeting & Alerts**: Set monthly budgets per category (Food, Transport, Home, etc.) and receive visual warnings when you are close to or exceeding your limits.
* **Rich Analytics & Reports**: Visualize your spending habits through interactive charts and export your data as CSV or PDF reports.
* **Progressive Web App (PWA)**: Installable directly on your mobile device or desktop for a native-like experience.
* **Dark/Light Mode**: Beautifully designed UI with fluid animations using Framer Motion and full theme support.

## 🛠️ Technology Stack

* **Frontend Framework**: [React 19](https://react.dev/) powered by [Vite](https://vitejs.dev/)
* **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication & Cloud Firestore)
* **Animations**: [Framer Motion](https://www.framer.com/motion/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Charts**: [Recharts](https://recharts.org/)
* **PDF Generation**: [jsPDF](https://parall.ax/products/jspdf)

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AgusVukusic/Financial-App.git
   cd Financial-App
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   Ensure you have your Firebase project set up. Add your `firebase.js` configuration file in the `src/` directory with your project credentials.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## 📐 Architecture & Design Decisions

* **Real-time Syncing**: We leverage Firestore's `onSnapshot` listeners to ensure that whenever a group member adds an expense or settles a debt, all other members see the updates instantly without refreshing the page.
* **Smart Account Handling**: Settlements or transfers made with "Cash" are processed immediately without requiring confirmation from the receiver, streamlining the user experience for physical money exchanges.
* **Component-Driven UI**: The UI is broken down into modular components (e.g., `TransactionList`, `BalanceCard`, `GroupDetails`) with a central design system for buttons, inputs, and modals (`ui/Button`, `ui/Select`, etc.), ensuring consistency and easy maintainability.

## 📝 Architectural Decision Records (ADRs)

1. **Local Sorting for Same-Day Transactions**: To avoid needing complex composite indexes in Firestore for sorting by date and creation time, we retrieve transactions and sort them locally in `useTransactions.js`. We fallback to `createdAt.toMillis()` when the ISO date strings are identical.
2. **Instant "Cash" Settlement Processing**: Settlements using cash accounts bypass the "Confirm Receive" pending state. Because cash is physical and immediate, it auto-completes on the sender's side and assigns the receiver's cash account instantly to minimize unnecessary UI blockers.
3. **Robust Account Type Fallbacks**: In cases where legacy accounts don't have a `type` defined in Firestore, the application uses a dynamic `isCashAccount` helper that checks both the `type` field and if the account name `.toLowerCase().includes('efectivo')`.

## ⚠️ Supuestos y Limitaciones

* **Firestore Security Rules**: The app assumes the user has properly configured Firestore rules allowing `userId` filtering.
* **Authentication Requirement**: All components assume an authenticated state after `WelcomeScreen` and rely heavily on `user.uid` for querying.
* **No Multi-Currency Support**: All formatting defaults to the standard locale currency without dynamic currency conversion logic.
* **Date Handling**: Transactions default to 12:00:00 PM (midday) of their local ISO string to avoid unexpected day shifts due to timezone offsets when rendering.

---

*Desarrollado con ❤️ y la asistencia de agentes autónomos especializados.*
