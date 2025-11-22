// Achievement Designs Page - просмотр всех вариантов дизайнов достижений
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';

// Import all achievement components
import { FoilAchievement } from '../../components/common/achievements/FoilAchievement';
import { GlassAchievement } from '../../components/common/achievements/GlassAchievement';
import { WaterAchievement } from '../../components/common/achievements/WaterAchievement';
import { HoneycombAchievement } from '../../components/common/achievements/HoneycombAchievement';
import { PixelArtAchievement } from '../../components/common/achievements/PixelArtAchievement';
import { AuroraSkyAchievement } from '../../components/common/achievements/AuroraSkyAchievement';
import { NatureAchievement } from '../../components/common/achievements/NatureAchievement';
import { TreeAchievement } from '../../components/common/achievements/TreeAchievement';
import { CosmicAchievement } from '../../components/common/achievements/CosmicAchievement';
import { CyberpunkAchievement } from '../../components/common/achievements/CyberpunkAchievement';
import { GlowingIconAchievement } from '../../components/common/achievements/GlowingIconAchievement';
import { GeometricPatternAchievement } from '../../components/common/achievements/GeometricPatternAchievement';
import { MetallicAchievement, BronzeMetallicAchievement, GoldMetallicAchievement } from '../../components/common/achievements/MetallicAchievement';
import { GlitchAchievement } from '../../components/common/achievements/GlitchAchievement';
import { MazeAchievement } from '../../components/common/achievements/MazeAchievement';
import { SwissBauhausAchievement } from '../../components/common/achievements/SwissBauhausAchievement';
import { NeonAchievement } from '../../components/common/achievements/NeonAchievement';
import { OrigamiAchievement } from '../../components/common/achievements/OrigamiAchievement';
import { LavaAchievement } from '../../components/common/achievements/LavaAchievement';
import { MosaicAchievement } from '../../components/common/achievements/MosaicAchievement';
import { AuroraPlanetsAchievement } from '../../components/common/achievements/AuroraPlanetsAchievement';
import { AuroraAsteroidsAchievement } from '../../components/common/achievements/AuroraAsteroidsAchievement';
import { AuroraMeteorsAchievement } from '../../components/common/achievements/AuroraMeteorsAchievement';
import { MatrixAchievement } from '../../components/common/achievements/MatrixAchievement';
import { JungleAchievement } from '../../components/common/achievements/JungleAchievement';

export function AchievementDesignsPage() {
  const navigate = useNavigate();
  const [clickedAchievement, setClickedAchievement] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sample achievement data for preview
  const sampleAchievement = {
    id: 'preview-1',
    name: 'Champion',
    description: 'Reach the tournament final but lose',
    icon: Trophy,
    rarity: 'legendary' as const,
    unlocked: true,
    date: '2025-11-16'
  };

  const handleAchievementClick = (id: string, unlocked: boolean) => {
    if (!unlocked) return;
    setClickedAchievement(id);
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setClickedAchievement(null);
    }, 1000);
  };

  const achievementComponents = [
    { name: 'Foil', component: FoilAchievement },
    { name: 'Glass', component: GlassAchievement },
    { name: 'Water', component: WaterAchievement },
    { name: 'Honeycomb', component: HoneycombAchievement },
    { name: 'Pixel Art', component: PixelArtAchievement },
    { name: 'Aurora Sky', component: AuroraSkyAchievement },
    { name: 'Nature', component: NatureAchievement },
    { name: 'Tree', component: TreeAchievement },
    { name: 'Cosmic', component: CosmicAchievement },
    { name: 'Cyberpunk', component: CyberpunkAchievement },
    { name: 'Glowing Icon', component: GlowingIconAchievement },
    { name: 'Geometric Pattern', component: GeometricPatternAchievement },
    { name: 'Metallic (Silver)', component: MetallicAchievement },
    { name: 'Metallic (Bronze)', component: BronzeMetallicAchievement },
    { name: 'Metallic (Gold)', component: GoldMetallicAchievement },
    { name: 'Glitch', component: GlitchAchievement },
    { name: 'Maze', component: MazeAchievement },
    { name: 'Swiss Bauhaus', component: SwissBauhausAchievement },
    { name: 'Neon', component: NeonAchievement },
    { name: 'Origami', component: OrigamiAchievement },
    { name: 'Lava', component: LavaAchievement },
    { name: 'Mosaic', component: MosaicAchievement },
    { name: 'Aurora + Planets', component: AuroraPlanetsAchievement },
    { name: 'Aurora + Asteroids', component: AuroraAsteroidsAchievement },
    { name: 'Aurora + Meteors', component: AuroraMeteorsAchievement },
    { name: 'Matrix', component: MatrixAchievement },
    { name: 'Jungle', component: JungleAchievement },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">Achievement Design Gallery</h1>
        <p className="text-muted-foreground">
          Browse all available achievement design variants
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievementComponents.map(({ name, component: Component }) => {
          const achievementId = `preview-${name}`;
          const isClicked = clickedAchievement === achievementId;
          const achievementWithId = { ...sampleAchievement, id: achievementId };
          return (
            <Card key={name} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Component
                  achievement={achievementWithId}
                  onClick={handleAchievementClick}
                  isClicked={isClicked}
                  isAnimating={isAnimating}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

