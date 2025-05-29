export default function AdminFooter() {
  return (
    <footer class="bg-[var(--color-brand-dark)] border-t border-blue-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div class="flex items-center space-x-6">
              <p class="text-sm text-white">
                © 2025 Knowledge Test Platform. All rights reserved.
              </p>
            </div>
            
            <div class="flex items-center space-x-4">
              <span class="text-xs text-gray-300">
                v0.1.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 