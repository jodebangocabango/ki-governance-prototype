export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // Login page uses its own minimal layout — no dock, no nav, no language switcher
  return <>{children}</>
}
