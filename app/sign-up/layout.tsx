export const metadata = {
  title: 'Sign Up - AskAlpha',
  description: 'Create your AskAlpha account and start generating AI-powered equity research reports.',
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
