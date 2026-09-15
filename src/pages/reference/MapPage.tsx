import { useNavigate } from "react-router-dom";

import { EcosystemMap } from "@/components/ecosystem/EcosystemMap";
import { curriculum, findSection, sectionPath } from "@/curriculum";

/** Which section explains each actor on the map. */
const NODE_TO_SECTION: Record<string, string> = {
  advertiser: "basics",
  agency: "technology",
  dsp: "technology",
  dmp: "data",
  exchange: "mediabuying",
  ssp: "technology",
  adserver: "adserving",
  publisher: "channels",
  user: "identity",
};

export default function MapPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="font-display text-3xl text-foreground">Ecosystem map</h1>
      <p className="measure mt-2 text-muted-foreground">
        Every party an ad passes between, and how they connect. Select any part to open the section
        that explains it.
      </p>

      <div className="mt-8">
        <EcosystemMap
          onNodeClick={(nodeId) => {
            const sectionId = NODE_TO_SECTION[nodeId];
            const section = sectionId ? findSection(curriculum, sectionId) : null;
            if (section) navigate(sectionPath(section));
          }}
        />
      </div>
    </div>
  );
}
