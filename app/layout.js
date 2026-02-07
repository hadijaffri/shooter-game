import './globals.css';

export const metadata = {
  title: 'Neon Arena - Multiplayer Shooter',
  description: 'A fast-paced online multiplayer top-down shooter game',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
