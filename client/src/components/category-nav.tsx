import { Link, useLocation } from "wouter";
import { Vote, Globe, Trophy, Bitcoin, LayoutGrid, Landmark } from "lucide-react";

interface CategoryItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const categories: CategoryItem[] = [
  { id: "all", label: "Todos", icon: LayoutGrid, href: "/markets" },
  { id: "politica", label: "Política", icon: Landmark, href: "/categoria/politica" },
  { id: "esportes", label: "Esportes", icon: Trophy, href: "/categoria/esportes" },
  { id: "cripto", label: "Cripto", icon: Bitcoin, href: "/categoria/cripto" },
];

export function CategoryNav() {
  const [location] = useLocation();

  return (
    <nav className="flex items-center gap-2 overflow-x-auto py-2 px-4 md:px-0 scrollbar-hide" data-testid="nav-categories">
      {categories.map((category) => {
        const isActive = location === category.href || 
          (category.id === "all" && location === "/") ||
          (category.href !== "/markets" && location.startsWith(category.href));
        const Icon = category.icon;
        
        return (
          <Link
            key={category.id}
            href={category.href}
            data-testid={`link-category-${category.id}`}
          >
            <div
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
                transition-all duration-200 cursor-pointer
                ${isActive 
                  ? "bg-gradient-purple text-white shadow-purple border border-primary" 
                  : "glass-card text-purple-light hover:text-white hover:border-glow"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium text-sm">{category.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
