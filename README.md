# Democracy AI

**Making Federal Legislation Accessible, Understandable, and Actionable for All Americans**

![Democracy AI](https://img.shields.io/badge/status-MVP-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Node](https://img.shields.io/badge/node-v18%2B-green)

## 🎯 Mission

Democracy AI removes barriers to understanding federal legislation. By combining Congress.gov data with transparent AI analysis, we empower citizens to understand bills affecting their lives and take meaningful civic action—whether that's contacting representatives, sharing information, or joining advocacy groups.

## ✨ Features

### MVP (Current)
- 🔍 **Search Federal Bills** - Find bills by keyword, bill number, or topic
- 🤖 **AI-Powered Interpretation** - Get plain-language breakdowns of complex legislation
- 💬 **Follow-up Questions** - Ask Claude AI clarifying questions about bills
- 📚 **Transparent Sources** - See exactly where the AI got its information and its limitations
- 📄 **Full Bill Text Access** - Direct links to official bill text on Congress.gov (PDF, TXT, XML)
- 📱 **Responsive Design** - Works on mobile, tablet, and desktop

### Phase 1 (Coming Soon)
- 📤 **Share Interpretations** - Share bill summaries on Twitter, Facebook, Email
- 📞 **Contact Your Representative** - One-click contact to your House rep and Senators
- 📊 **Bill Status Tracking** - Real-time updates on bill progress through Congress

### Phase 2 (Planned)
- 🏛️ **Advocacy Group Directory** - Find organizations working on issues you care about
- ⭐ **Save & Bookmark Bills** - Create personalized lists of bills to follow
- 🎯 **Personalized Recommendations** - Get bills tailored to your interests
- 📈 **Impact Dashboard** - Track your civic engagement

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5
- CSS3
- JavaScript (Vanilla)

**Backend:**
- Node.js
- Express.js
- Axios (HTTP requests)

**APIs:**
- [Congress.gov API](https://api.congress.gov/) - Federal bill data
- [Claude AI API](https://www.anthropic.com/) - Bill interpretation

**Deployment Ready:**
- Vercel (Frontend)
- Railway or Render (Backend)

---

## 📋 Prerequisites

Before you get started, you'll need:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **Congress.gov API Key** (Free) - [Sign Up](https://api.congress.gov/sign-up/)
4. **Claude AI API Key** (Paid) - [Get Key](https://console.anthropic.com/settings/keys)
5. **Git** - [Download](https://git-scm.com/)

---

## 🚀 Getting Started

### Step 1: Clone the Repository

```bash
git clone https://github.com/sharkbyte-x/Democracy.AI.git
cd Democracy.AI
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the project root (do NOT commit this to GitHub):

```bash
touch .env
```

Add your API keys:

```env
CONGRESS_API_KEY=your_congress_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
PORT=3000
```

**To get your API keys:**

**Congress.gov API:**
1. Go to https://api.congress.gov/sign-up/
2. Fill out the form with your email
3. Check your email for the API key
4. Copy and paste into `.env`

**Claude AI API:**
1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Copy and paste into `.env`
4. Add billing info to your Anthropic account

### Step 4: Start the Server

```bash
node server.js
```
