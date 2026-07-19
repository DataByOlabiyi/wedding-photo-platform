import { SiteHeader } from '@/components/site-header'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader showActions={false} />
      <div className="flex flex-1 items-center justify-center px-4 py-12">{children}</div>
    </div>
  )
}
