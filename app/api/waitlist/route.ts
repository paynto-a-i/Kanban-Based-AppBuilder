import { NextRequest, NextResponse } from 'next/server'

interface WaitlistSubmission {
  name: string
  email: string
  company?: string
  role?: string
  message?: string
  submittedAt: string
}

// In-memory storage for development (replace with database in production)
const waitlistSubmissions: WaitlistSubmission[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const submission: WaitlistSubmission = {
      name: body.name,
      email: body.email,
      company: body.company || '',
      role: body.role || '',
      message: body.message || '',
      submittedAt: new Date().toISOString()
    }

    // Store submission (in production, save to database)
    waitlistSubmissions.push(submission)

    // Log submission for development visibility
    console.log('New waitlist submission:', submission)
    console.log('Total submissions:', waitlistSubmissions.length)

    // TODO: In production, you would:
    // 1. Save to a database (Supabase, MongoDB, etc.)
    // 2. Send a confirmation email to the user
    // 3. Notify the team via Slack/email
    // 4. Add to a CRM or email marketing platform

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully joined the waitlist!',
        submittedAt: submission.submittedAt
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Waitlist submission error:', error)
    return NextResponse.json(
      { error: 'Failed to process submission. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // For admin/debugging purposes - could be protected in production
  return NextResponse.json({
    count: waitlistSubmissions.length,
    submissions: waitlistSubmissions
  })
}
