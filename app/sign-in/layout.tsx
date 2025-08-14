export const metadata = {
  title: 'Sign In - AskAlpha',
  description: 'Sign in to your AskAlpha account and access AI-powered equity research reports.',
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
