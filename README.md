# Enriched Properties LLC Website

A professional real estate acquisitions website with integrated CRM dashboard for managing leads, properties, and contracts.

## Features

### Public Marketing Site (index.html)
- Professional real estate acquisitions landing page
- Services showcase for hedge fund partnerships
- Contact forms for lead generation
- Responsive design with modern UI
- SEO optimized content

### Password-Protected Dashboard (dashboard.html)
- Complete CRM system with lead management
- Property portfolio tracking
- Contract management system
- Analytics and reporting
- Secure authentication system

## Quick Start

1. Upload all files to your GitHub repository
2. Enable GitHub Pages in repository settings
3. Access your site at: `https://yourusername.github.io/your-repo-name`

## Login Credentials

**Dashboard Access:**
- Username: `admin`
- Password: `enriched2024`

## File Structure

```
website/
├── index.html              # Public marketing site
├── dashboard.html           # CRM dashboard
├── css/
│   └── styles.css          # Custom styles
├── js/
│   ├── main.js             # Public site functionality
│   └── dashboard.js        # Dashboard CRM system
├── assets/                 # Images and other assets
└── README.md              # This file
```

## Deployment to GitHub Pages

1. Create a new repository on GitHub
2. Upload all files from the `website` folder to the repository
3. Go to repository Settings > Pages
4. Select "Deploy from a branch" 
5. Choose "main" branch and "/ (root)" folder
6. Your site will be available at the GitHub Pages URL

## CRM Features

### Lead Management
- Add, edit, and delete leads
- Track lead status (new, contacted, qualified, under contract, closed)
- Store contact information and property details
- Lead source tracking
- Notes and follow-up management

### Property Portfolio
- Track acquired properties
- Property details (bedrooms, bathrooms, square footage)
- Purchase price tracking
- Property status management
- Notes and condition tracking

### Contract Management
- Contract creation and tracking
- Status management (draft, active, executed)
- Closing date tracking
- Purchase price management

### Analytics Dashboard
- Key performance metrics
- Lead source analysis
- Conversion rate tracking
- Deal pipeline visualization
- Monthly performance reports

## Data Storage

The CRM uses browser localStorage for data persistence. Data is automatically saved and will persist between sessions. For production use, consider integrating with a backend database.

## Customization

### Branding
- Update company colors in `tailwind.config` section of HTML files
- Modify logo and company name throughout the site
- Update contact information in forms and footer

### Content
- Customize service descriptions based on your offerings
- Update testimonials and statistics
- Modify form fields based on your lead qualification needs

### Styling
- Custom CSS is in `css/styles.css`
- Tailwind CSS classes are used throughout for rapid styling
- Responsive design works on desktop, tablet, and mobile

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement approach

## Security Notes

- Authentication is client-side only (suitable for GitHub Pages)
- For production use, implement server-side authentication
- HTTPS is automatically provided by GitHub Pages
- Data is stored locally in browser

## Support

For questions or customization requests, contact your development team.

## License

Copyright © 2024 Enriched Properties LLC. All rights reserved.