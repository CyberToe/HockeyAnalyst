import NavigationContent from './NavigationContent'

export default function Sidebar() {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🏒</span>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">
              Hockey Analytics
            </span>
          </div>
        </div>
        
        <div className="mt-5 flex-grow flex flex-col">
          <NavigationContent />
        </div>
      </div>
    </div>
  )
}
