import PublicSchedule from '@/components/PublicSchedule'
import { notFound } from 'next/navigation'

interface PublicSchedulePageProps {
  params: {
    username: string
  }
}

export default function PublicSchedulePage({ params }: PublicSchedulePageProps) {
  const { username } = params

  // Basic validation for username format
  if (!username || !/^[a-zA-Z0-9]+$/.test(username)) {
    notFound()
  }

  return <PublicSchedule username={username} />
}

export async function generateMetadata({ params }: PublicSchedulePageProps) {
  const { username } = params
  
  return {
    title: `${username}'s Schedule - Weekly Scheduler`,
    description: `View ${username}'s public weekly schedule`,
    openGraph: {
      title: `${username}'s Schedule`,
      description: `View ${username}'s public weekly schedule`,
      type: 'website',
    },
  }
}