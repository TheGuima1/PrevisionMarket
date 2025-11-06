import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicNavbar } from "@/components/public-navbar";
import { MarketCard } from "@/components/market-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Market } from "@shared/schema";
import { TrendingUp, Zap, Newspaper, Vote, Trophy, DollarSign, Bitcoin, Globe2, Cpu, Palette, MapPin, LineChart, Award } from "lucide-react";

// Polymarket-style categories with 13 categories
const categories = [
  { value: "all", label: "All Markets", icon: Globe2 },
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "breaking", label: "Breaking", icon: Zap },
  { value: "new", label: "New", icon: Newspaper },
  { value: "elections", label: "Elections", icon: Award },
  { value: "politics", label: "Politics", icon: Vote },
  { value: "sports", label: "Sports", icon: Trophy },
  { value: "finance", label: "Finance", icon: DollarSign },
  { value: "crypto", label: "Crypto", icon: Bitcoin },
  { value: "geopolitics", label: "Geopolitics", icon: MapPin },
  { value: "tech", label: "Tech", icon: Cpu },
  { value: "culture", label: "Culture", icon: Palette },
  { value: "world", label: "World", icon: Globe2 },
  { value: "economy", label: "Economy", icon: LineChart },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: markets, isLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  // Filter by category and tag
  const filteredMarkets = markets?.filter((m) => {
    const categoryMatch = selectedCategory === "all" || m.category === selectedCategory;
    const tagMatch = !selectedTag || (m.tags && m.tags.includes(selectedTag));
    return categoryMatch && tagMatch;
  });

  // Extract all unique tags from markets
  const allTags = Array.from(
    new Set(markets?.flatMap((m) => m.tags || []) || [])
  ).sort();

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="space-y-2">
          <h1 className="font-accent text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Bet on What Happens Next
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Trade on predictions about future events. Prices reflect the collective wisdom of the market.
          </p>
        </div>

        {/* Category Pills - Polymarket Style */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setSelectedTag(null);
                }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
                  transition-all hover-elevate active-elevate-2
                  ${isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}
                data-testid={`button-category-${cat.value}`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Filter by tag:</p>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 15).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  data-testid={`badge-tag-${tag}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Markets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-lg" />
            ))}
          </div>
        ) : filteredMarkets && filteredMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-markets">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} isPublic />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <div className="text-6xl opacity-50">📊</div>
            <h3 className="text-xl font-semibold">No markets found</h3>
            <p className="text-muted-foreground">
              {selectedCategory === "all" && !selectedTag
                ? "No active markets at the moment"
                : "Try adjusting your filters"
              }
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
