import { prisma } from "@/lib/prisma";

export async function canUsersMessage({
  senderId,
  receiverId,
  bookingId,
  connectionId
}: {
  senderId: string;
  receiverId: string;
  bookingId?: string;
  connectionId?: string;
}) {
  if (connectionId) {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      select: { requesterId: true, receiverId: true, status: true }
    });
    if (!connection || connection.status !== "ACCEPTED") return false;
    const usersInConnection = [connection.requesterId, connection.receiverId];
    return usersInConnection.includes(senderId) && usersInConnection.includes(receiverId);
  }

  if (bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { studentId: true, mentorId: true }
    });
    if (!booking) return false;
    const usersInBooking = [booking.studentId, booking.mentorId];
    return usersInBooking.includes(senderId) && usersInBooking.includes(receiverId);
  }

  if (senderId === receiverId) return false;

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { id: true, role: true, isActive: true }
  });
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, role: true, isActive: true }
  });

  if (!sender?.isActive || !receiver?.isActive) return false;

  // Check if users are connected
  const connection = await prisma.connection.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: senderId, receiverId },
        { requesterId: receiverId, receiverId: senderId }
      ]
    },
    select: { id: true }
  });

  // Only allow messaging if connected
  return Boolean(connection);
}
