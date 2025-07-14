# Weekly Scheduler

A cloud-based weekly scheduling application with user authentication and persistent data storage.

## Features

- **User Authentication**: Secure sign-up and sign-in with Supabase Auth
- **Persistent Storage**: Schedule data saved to Supabase database
- **Cross-Platform**: Access your schedule from any device
- **Real-time Updates**: Changes are automatically saved to the cloud
- **Conflict Detection**: Visual indicators for scheduling conflicts
- **Export Functionality**: Copy schedule as formatted text
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

## Setup Instructions

### 1. Clone and Install Dependencies

\`\`\`bash
git clone <your-repo-url>
cd weekly-scheduler
npm install
\`\`\`

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of \`supabase_schema.sql\`
3. Get your project URL and anon key from Settings > API

### 3. Environment Variables

1. Copy \`.env.local.example\` to \`.env.local\`
2. Add your Supabase credentials:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 4. Development

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - \`NEXT_PUBLIC_SUPABASE_URL\`
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
4. Deploy!

## Database Schema

The application uses a single table \`schedule_entries\` with the following structure:

- \`id\`: UUID primary key
- \`user_id\`: UUID foreign key to auth.users
- \`week_key\`: String identifying the week (MM/DD/YYYY format)
- \`day_index\`: Integer (0-6 for Monday-Sunday)
- \`start_time\`: String in HH:MM format
- \`end_time\`: String in HH:MM format (nullable)
- \`description\`: Text description of the event
- \`created_at\`: Timestamp
- \`updated_at\`: Timestamp

Row Level Security (RLS) ensures users can only access their own data.

## Usage

1. **Sign Up/Sign In**: Create an account or log in with existing credentials
2. **Navigate Weeks**: Use Previous/Next Week buttons to browse different weeks
3. **Add Entries**: Select a time from the dropdown to add a new schedule entry
4. **Edit Entries**: Click on time selectors or description fields to edit
5. **Delete Entries**: Click the trash icon to remove entries
6. **Export**: Use "Copy Schedule" to export as formatted text
7. **Sign Out**: Click the sign out button when finished

## Features in Detail

### Conflict Detection
The app automatically detects and highlights time conflicts with amber coloring.

### Smart Time Suggestions
When adding new entries, the app suggests the next available time slot.

### Persistent Storage
All changes are automatically saved to the cloud database.

### Responsive Design
Optimized for desktop and mobile viewing with adaptive layouts.