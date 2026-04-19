import { NextRequest, NextResponse } from 'next/server';

// In-memory store for user statuses (in production, use Redis or database)
const userStatuses = new Map<string, {
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  isTyping: boolean;
  typingTo?: string;
}>();

type UserStatusResponse = {
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  isTyping: boolean;
  typingTo?: string;
};

type UserStatusUpdateBody = {
  userId?: string;
  status?: 'online' | 'offline' | 'away';
  isTyping?: boolean;
  typingTo?: string;
};

// Heartbeat interval to clean up offline users
setInterval(() => {
  const now = new Date();
  for (const [, status] of userStatuses.entries()) {
    if (status.status !== 'offline' && now.getTime() - status.lastSeen.getTime() > 30000) {
      status.status = 'offline';
    }
  }
}, 10000);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userIds = searchParams.get('userIds')?.split(',').filter(Boolean);
  
  if (!userIds || userIds.length === 0) {
    return NextResponse.json({ error: 'User IDs required' }, { status: 400 });
  }

  const statuses: Record<string, UserStatusResponse> = {};
  for (const userId of userIds) {
    const status = userStatuses.get(userId);
    if (status) {
      statuses[userId] = {
        status: status.status,
        lastSeen: status.lastSeen.toISOString(),
        isTyping: status.isTyping,
        typingTo: status.typingTo
      };
    } else {
      statuses[userId] = {
        status: 'offline',
        lastSeen: new Date().toISOString(),
        isTyping: false
      };
    }
  }

  return NextResponse.json({ statuses });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UserStatusUpdateBody;
    const { userId, status, isTyping, typingTo } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const currentStatus = userStatuses.get(userId) || {
      status: 'offline',
      lastSeen: new Date(),
      isTyping: false
    };

    // Update status
    if (status && ['online', 'offline', 'away'].includes(status)) {
      currentStatus.status = status;
    }
    
    if (typeof isTyping === 'boolean') {
      currentStatus.isTyping = isTyping;
      currentStatus.typingTo = typingTo;
    }

    currentStatus.lastSeen = new Date();
    userStatuses.set(userId, currentStatus);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Pick<UserStatusUpdateBody, 'userId'>;
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Update heartbeat
    const currentStatus = userStatuses.get(userId) || {
      status: 'online',
      lastSeen: new Date(),
      isTyping: false
    };

    currentStatus.lastSeen = new Date();
    currentStatus.status = 'online';
    userStatuses.set(userId, currentStatus);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
