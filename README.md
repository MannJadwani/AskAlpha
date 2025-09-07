## SEO Health

- [ ] Sitemap 200 + application/xml at https://www.askalpha.tech/sitemap.xml
- [ ] Robots allows /
- [ ] Apex → www 308 redirect
- [ ] Blog posts: absolute canonical to self
- [ ] No “noindex” on public pages
- [ ] /blog lists all non-draft posts and homepage links to 3–5 posts
- [ ] JSON-LD present on posts
- [ ] OG/Twitter images are absolute

Verification commands:

```bash
curl -IL https://www.askalpha.tech/sitemap.xml
curl -IL https://www.askalpha.tech/blog/<some-slug>
npm run lint:seo
npm run build && npm start
```
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Set up environment variables

This application requires API keys to function properly:

1. Create a `.env.local` file in the root directory
2. Add your API keys to the file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PERPLEXITY_API_KEY=your_perplexity_api_key_here  # Optional, enhances research quality
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
3. You can get an OpenAI API key by signing up at [OpenAI Platform](https://platform.openai.com/)
4. For enhanced research, optionally get a Perplexity API key from [Perplexity API](https://www.perplexity.ai/api)
5. For authentication, sign up for a free Supabase account at [Supabase](https://supabase.com/)

### Start the development server

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Features

- Generate comprehensive equity research reports with structured sections
- Customize the number of sections in your report (1-20)
- Detailed analysis including business model, market position, financials, and more
- Uses OpenAI to create structured reports in JSON format
- Optional Perplexity API integration for enhanced company research
- Modern, professional user interface designed for equity research
- Uses marked for Markdown parsing with sanitization for security

## How It Works

1. Enter a company name or ticker symbol
2. Specify how many sections you want in your report (1-20)
3. Click "Generate Report"
4. The application will:
   - Research the company using Perplexity API (if configured)
   - Generate a structured report with the specified number of sections using OpenAI
   - Present the report in a clean, professional format

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

**Note:** When deploying, make sure to add your `OPENAI_API_KEY` and optional `PERPLEXITY_API_KEY` to your environment variables in your hosting platform.
# equivision-sass
# AskAlpha
