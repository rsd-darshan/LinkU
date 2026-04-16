export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 30) {
    return 'Active now';
  }

  if (diffInSeconds < 60) {
    return 'Active now';
  }

  if (diffInSeconds < 120) {
    return '1 min ago';
  }

  const minutes = Math.floor(diffInSeconds / 60);
  
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  const days = Math.floor(hours / 24);
  
  if (days < 7) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // For older dates, show the actual date
  return past.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export function isUserOnline(lastSeen: Date | string): boolean {
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffInSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);
  
  return diffInSeconds < 30; // Online if seen within last 30 seconds
}
