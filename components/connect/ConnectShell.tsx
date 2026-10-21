import type { ReactNode } from 'react'
import ContourBackdrop from '@/components/ContourBackdrop'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

export function ConnectShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="connect-page flex min-h-screen flex-col bg-[#060913] text-[#eef4f8]">
      <Navbar />
      <div className="relative z-10 flex-1">
        <ContourBackdrop />
        <div className="relative">{children}</div>
      </div>
      <Footer />
    </div>
  )
}
