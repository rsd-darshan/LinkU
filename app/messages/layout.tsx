export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="route-shell route-messages -mb-6 -mr-4 flex h-full min-h-0 w-[calc(100%+1rem)] flex-col overflow-hidden p-0 xl:-mr-8 xl:w-[calc(100%+2rem)]">
      {children}
    </div>
  );
}
