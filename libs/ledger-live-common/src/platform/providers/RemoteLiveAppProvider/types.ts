import { LiveAppManifest } from "../../types";

export type LiveAppRegistry = {
  liveAppById: { [appId: string]: LiveAppManifest };
  liveAppByIndex: LiveAppManifest[];
  liveAppFilteredById: { [appId: string]: LiveAppManifest };
  liveAppFiltered: LiveAppManifest[];
};
