import { Icon } from '../ui'
import { type MenuItem } from '../../data/menuData'

interface MenuCardProps {
  item: MenuItem
}

export function MenuCard({ item }: MenuCardProps) {
  return (
    <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5 md:p-6 shadow-xs hover:shadow-md hover:border-(--accent-green) hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between group cursor-pointer">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-base md:text-lg text-(--text-primary) group-hover:text-(--accent-green) transition-colors duration-200">
            {item.name}
          </h3>
          <span className="shrink-0 px-2.5 py-1 rounded-md bg-(--bg-surface-secondary) text-(--accent-green) font-mono text-xs font-bold border border-(--border-theme) group-hover:border-(--accent-green)/40 group-hover:bg-(--accent-green)/10 transition-colors duration-200">
            {item.price}
          </span>
        </div>

        <p className="text-xs md:text-sm text-(--text-secondary) leading-relaxed">
          {item.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-(--border-subtle) flex items-center justify-between text-xs text-(--text-muted)">
        <span className="capitalize font-medium flex items-center gap-1 text-(--text-secondary) group-hover:text-(--accent-green) transition-colors duration-200">
          <Icon name="local_dining" size={14} className="text-(--accent-green)" />
          {item.category}
        </span>
      </div>
    </div>
  )
}
