# Regulatory Compliance Assistant

A comprehensive regulatory compliance platform that helps organizations manage, analyze, and ensure compliance with various regulatory frameworks using AI-powered document analysis and intelligent search capabilities.

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Document Analysis**: Automatically analyze compliance documents against regulatory frameworks
- **Intelligent Search**: Semantic search across all compliance documents with relevance scoring
- **Real-time Compliance Monitoring**: Track compliance status and identify gaps
- **Interactive Dashboard**: Modern, responsive dashboard with dark/light mode support
- **Document Management**: Upload, categorize, and manage compliance documents
- **Risk Assessment**: Identify and prioritize compliance risks
- **Audit Trail**: Complete audit logging for compliance reporting

### 🚀 Enhanced Dashboard Features
- **Fixed Header Layout**: Header stays at top while only content scrolls for better navigation
- **Responsive Scrollbars**: Custom themed scrollbars that adapt to light/dark mode
- **Sparkline Trends**: Mini charts showing trend direction for all key metrics
- **Collapsible Sidebar**: Accordion-style navigation with filters and quick actions
- **Drag & Drop Upload**: Bulk file upload with support for folders and ZIP files
- **Risk Alerts**: Real-time high-severity compliance findings with direct action links
- **Action Items**: Integrated pending reviews and approvals with assignment tracking
- **Compliance Tools**: Built-in risk assessment, policy generator, and audit report tools

### ⌨️ Keyboard Shortcuts & Accessibility
- **⌘K** - Focus search bar
- **Ctrl+U** - Open upload dialog
- **Ctrl+B** - Toggle sidebar
- **Ctrl+Shift+D** - Toggle dark/light theme
- **WCAG Compliant**: Proper contrast ratios and ARIA roles
- **Tab Navigation**: Full keyboard navigation support

### 🔄 Smart Features
- **Popular Searches**: AI-suggested queries based on usage patterns
- **Document Preview**: Inline PDF/text preview with collaboration tools
- **Export Capabilities**: Download audit trails as CSV/JSON
- **Theme Persistence**: Remembers user preferences across sessions
- **Skeleton Loading**: Smooth loading states for better UX

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: FastAPI, Python 3.11+
- **AI/ML**: Sentence Transformers, Pinecone Vector Database
- **Search**: Semantic search with embedding-based similarity
- **UI Components**: Custom component library with accessibility support
- **Icons**: Lucide React for consistent iconography

## 🚀 Quick Start

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- npm or yarn
- Pinecone API key ([Sign up](https://www.pinecone.io/))
- Perplexity API key ([Sign up](https://www.perplexity.ai/))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/regulatory-compliance-assistant.git
cd regulatory-compliance-assistant
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual API keys
```

3. Install all dependencies:
```bash
npm run setup
```

4. Start the application:
```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
npm run dev
```

> **For detailed setup instructions for team members, see [SETUP.md](SETUP.md)**

## 📁 Project Structure

```
regulatory-compliance-assistant/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/         # Base UI components (buttons, cards, etc.)
│   │   │   └── layout/     # Layout components (header, sidebar)
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript type definitions
│   │   └── lib/            # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── app/                     # FastAPI backend application
├── scrapers/               # Web scrapers for regulatory data
├── metadata/               # Document metadata and schemas
├── requirements.txt        # Python dependencies
├── main.py                # Backend entry point
└── package.json           # Root package.json for scripts
```

## 🎮 Usage

### Dashboard Overview

The enhanced dashboard provides a comprehensive view of your compliance status:

1. **Metrics Cards**: Key performance indicators with trend sparklines
2. **Risk Alerts**: High-priority compliance issues requiring immediate attention
3. **Action Items**: Pending reviews, approvals, and assignments
4. **Coverage Heatmap**: Visual representation of policy coverage gaps

### Search & Discovery

- **Inline Search**: Results display directly on the dashboard without navigation
- **Smart Suggestions**: Popular searches based on global usage patterns
- **Advanced Filtering**: Filter by category, date range, severity, and more
- **Relevance Scoring**: AI-powered ranking of search results

### Document Management

- **Bulk Upload**: Drag and drop multiple files or entire folders
- **Preview Modal**: Inline document preview with collaboration tools
- **Metadata Extraction**: Automatic categorization and tagging
- **Version Control**: Track document changes and updates

### Collaboration Features

- **Comments**: Add comments to documents and findings
- **Assignments**: Assign action items to team members
- **Notifications**: Real-time alerts for new matches and updates
- **Audit Export**: Download complete audit trails for reporting

## 🔧 API Endpoints

### Core Endpoints
- `GET /api/documents` - List all documents
- `POST /api/documents/upload` - Upload new documents
- `POST /api/search` - Search documents with filters
- `GET /api/health` - System health check
- `GET /api/compliance/analyze` - Analyze document compliance

### Enhanced Endpoints
- `GET /api/metrics` - Dashboard metrics with trends
- `GET /api/alerts` - Risk alerts and notifications
- `GET /api/actions` - Action items and assignments
- `GET /api/coverage` - Policy coverage analysis
- `POST /api/export` - Export audit trails

## 🎨 UI Components

The platform includes a comprehensive component library:

### Base Components
- **Button**: Multiple variants with accessibility support
- **Card**: Flexible container with header/content sections
- **Input**: Form inputs with validation states
- **Modal**: Accessible overlay dialogs
- **Accordion**: Collapsible content sections

### Advanced Components
- **Sparkline**: Mini trend charts for metrics
- **Heatmap**: Visual coverage representation
- **DragDropZone**: File upload with drag & drop
- **Skeleton**: Loading state placeholders

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K | Focus search bar |
| Ctrl+U | Open upload dialog |
| Ctrl+B | Toggle sidebar |
| Ctrl+Shift+D | Toggle theme |
| Esc | Close modals |
| Tab/Shift+Tab | Navigate elements |
| ↑/↓ | Navigate search results |

## 🌙 Theme Support

The application supports both light and dark themes with:
- **Automatic Persistence**: Theme preference saved to localStorage
- **System Integration**: Respects system theme preferences
- **Smooth Transitions**: Animated theme switching
- **Accessibility**: Maintains contrast ratios in both modes

## 🔧 Development

### Frontend Development

```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Backend Development

```bash
python main.py       # Start FastAPI server
pytest              # Run tests
black .             # Format code
flake8 .            # Lint code
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
