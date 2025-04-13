import { Play } from "lucide-react"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </header>
        <div className="h-[calc(100vh-4rem)] p-4 flex flex-col gap-4">
          {/* Big "Keep Watching" card with play button and title at bottom left */}
          <div className="relative w-full h-[55%] overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-gray-800">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10"></div>
            <img
              src="/placeholder.svg?height=540&width=960"
              alt="Continue watching"
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
            <div className="absolute bottom-0 left-0 p-6 z-20 flex items-center gap-4">
              <button className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
                <Play className="h-6 w-6 text-white fill-white" />
              </button>
              <div className="text-white">
                <h2 className="text-xl font-bold">Continue Assistindo</h2>
                <p className="text-sm text-white/80">Introdução à Programação</p>
              </div>
            </div>
          </div>

          {/* Three simplified smaller cards with green gradients */}
          <div className="grid grid-cols-3 gap-4 h-[40%]">
            {/* Suas Aulas Card */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500 to-green-700">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 p-4 z-20">
                <h3 className="text-lg font-semibold text-white">Suas Aulas</h3>
              </div>
            </div>

            {/* Calendário Card */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-green-400 to-emerald-600">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 p-4 z-20">
                <h3 className="text-lg font-semibold text-white">Calendário</h3>
              </div>
            </div>

            {/* Progresso Card */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-teal-400 to-green-600">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 p-4 z-20">
                <h3 className="text-lg font-semibold text-white">Progresso</h3>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
