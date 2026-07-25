import { GamePage } from "@/views/game";
import { OrientationPrompt } from "@/shared/ui/orientation-prompt";

export const metadata = { title: "Game" };

export default function Page() {
  return (
    <OrientationPrompt>
      <GamePage />
    </OrientationPrompt>
  );
}
