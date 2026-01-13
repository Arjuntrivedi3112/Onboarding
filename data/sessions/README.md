# Session Data Storage

This directory stores all session notes and doubts as JSON files in the GitHub repository.

## Files

- `sessions.json` - Array of all session objects
- `doubts.json` - Array of all doubts across all sessions

## Data Structure

### Session Object
```json
{
  "id": "unique-id",
  "title": "Session Title",
  "date": "2026-01-07",
  "time": "14:30",
  "summary": "One-line takeaway",
  "tags": ["tag1", "tag2"],
  "overview": "Detailed session overview",
  "media": ["image-url-1", "image-url-2"],
  "understanding": "Main learning content",
  "outcomes": "Actionables and next steps"
}
```

### Doubt Object
```json
{
  "id": "unique-id",
  "sessionId": "session-id",
  "text": "The doubt or question",
  "createdAt": "2026-01-07T14:30:00Z",
  "status": "open" // or "resolved"
}
```

## Usage Workflow

### Manual Workflow (No GitHub API)
1. Create/edit sessions in the app
2. Click "Export" to download updated JSON files
3. Replace files in `data/sessions/` directory
4. Commit and push to GitHub
5. App reads from these files on load

### Automated Workflow (GitHub API - requires setup)
1. Add GitHub personal access token to environment variables
2. App automatically commits changes to this directory
3. Changes sync across all users viewing the repo

## Advantages of GitHub Storage
- Version control - full history of all changes
- Collaboration - multiple people can contribute
- Backup - data is never lost
- Portable - data lives with the code
- Free - no database costs
