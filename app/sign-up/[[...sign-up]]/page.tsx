import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return <div className="h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <SignUp />
  </div>
}