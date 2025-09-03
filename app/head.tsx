export default function Head() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://askalpha.tech';
  return (
    <>
      <link rel="canonical" href={`${site}/`} />
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#0a0c10" media="(prefers-color-scheme: dark)" />
      <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    </>
  );
}


