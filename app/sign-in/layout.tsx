export const metadata = {
  title: 'Sign In - AskAlpha',
  description: 'Sign in to your AskAlpha account and access AI-powered equity research reports.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <>{children}</>
  )
}
