import React, { useMemo, useState } from "react";
import { AIChatPanel } from "@/components/ai/AIChatPanel";

const TERMS: { term: string; def: string }[] = [
  { term: "AdTech", def: "AdTech stands for Advertising Technology and includes all software, platforms, and tools used to create, manage, deliver, track, and optimize digital advertising campaigns. It connects advertisers, publishers, and users through automated systems." },
  { term: "Ad Slot", def: "An ad slot is a predefined location on a website or mobile app where an advertisement can be displayed. Each slot has fixed specifications like size, format, and placement that determine which ads can appear there." },
  { term: "Ad Space", def: "Ad space refers to the actual visible area inside an ad slot where the advertisement is rendered. While ad slot is the container, ad space is the portion that users actually see on their screen." },
  { term: "Ad Inventory", def: "Ad inventory is the total collection of ad slots and impressions that a publisher has available to sell. It represents the supply side of digital advertising and changes based on traffic volume." },
  { term: "Premium Inventory", def: "Premium inventory includes high-visibility and high-demand ad placements such as homepage banners or above-the-fold ads. These placements usually generate better engagement and are sold at higher prices." },
  { term: "Remnant Inventory", def: "Remnant inventory consists of unsold ad space that was not purchased through direct deals. Publishers typically sell this inventory at discounted rates through ad networks or programmatic platforms." },
  { term: "Long-Tail Inventory", def: "Long-tail inventory comes from smaller websites and blogs with lower traffic volumes. Although individual placements have low reach, they collectively provide large scale at a lower cost." },
  { term: "Creative", def: "A creative is the actual ad content shown to users, such as images, videos, text, or audio. Creatives are designed to attract attention and encourage users to take action." },
  { term: "Click", def: "A click is recorded when a user interacts with an advertisement by clicking on it. Clicks are a primary engagement metric and are often used for billing in CPC-based campaigns." },
  { term: "Impression", def: "An impression is counted each time an advertisement is served and displayed on a user’s device. Even repeated views of the same ad by the same user count as separate impressions." },
  { term: "Viewable Impression", def: "A viewable impression is an impression that meets industry visibility standards, meaning the ad appeared within the user’s visible screen area. This metric helps filter out ads that were technically served but never seen." },
  { term: "Conversion", def: "A conversion occurs when a user completes a predefined action after interacting with an ad, such as making a purchase or signing up. Conversions are used to measure campaign success." },
  { term: "Landing Page", def: "A landing page is a dedicated webpage where users arrive after clicking an ad. It is optimized for a single objective, usually to drive conversions rather than general browsing." },
  { term: "CPM (Cost Per Mille)", def: "CPM is a pricing model where advertisers pay for every 1,000 impressions served. It is commonly used for brand awareness campaigns focused on visibility." },
  { term: "CPC (Cost Per Click)", def: "CPC is a pricing model where advertisers pay only when a user clicks on their ad. This model is used when the primary goal is to drive traffic." },
  { term: "CPA (Cost Per Action / Acquisition)", def: "CPA is a pricing model where advertisers pay only when a user completes a specific action or conversion. It is performance-focused and minimizes risk for advertisers." },
  { term: "DSP (Demand-Side Platform)", def: "A DSP is a platform used by advertisers and agencies to purchase ad inventory programmatically across multiple publishers. It enables automated bidding, targeting, and optimization from a single interface." },
  { term: "RTB (Real-Time Bidding)", def: "RTB is an automated auction process where individual ad impressions are bought and sold in real time. This entire process happens within milliseconds as a webpage loads." },
  { term: "Bidder", def: "The bidder is a component within a DSP that evaluates incoming bid requests and decides whether to bid and how much. It uses targeting rules, budgets, and algorithms to make decisions instantly." },
  { term: "SSP (Supply-Side Platform)", def: "An SSP is used by publishers to manage and sell their ad inventory to multiple demand sources. It helps maximize revenue by creating competition for each impression." },
  { term: "Floor Price", def: "A floor price is the minimum amount a publisher is willing to accept for an ad impression. It protects inventory value and prevents underselling." },
  { term: "Header Bidding", def: "Header bidding is a technique that allows multiple demand partners to bid on inventory simultaneously before the ad server selects a winner. This increases competition and publisher revenue." },
  { term: "Ad Server", def: "An ad server is a system that stores ads, selects which ad to show, delivers it to users, and tracks performance data. It acts as the decision-making engine for ad delivery." },
  { term: "First-Party Ad Server", def: "A first-party ad server is owned and operated by the publisher. It manages direct deals, programmatic demand, inventory forecasting, and reporting." },
  { term: "Third-Party Ad Server", def: "A third-party ad server is typically used by advertisers to track and verify campaigns across multiple publishers. It provides independent measurement and consolidated reporting." },
  { term: "Ad Network", def: "An ad network aggregates ad inventory from many publishers and sells it to advertisers as bundled inventory. It simplifies buying but offers less transparency and control." },
  { term: "Ad Exchange", def: "An ad exchange is a digital marketplace where advertisers and publishers buy and sell ad impressions through real-time auctions. It enables transparent and efficient programmatic trading." },
  { term: "Waterfall", def: "The waterfall is a traditional inventory-selling method where demand sources are called one after another until an impression is sold. It has largely been replaced by header bidding." },
  { term: "First-Price Auction", def: "In a first-price auction, the highest bidder wins the impression and pays exactly the amount they bid. This model is now the dominant auction type in programmatic advertising." },
  { term: "Second-Price Auction", def: "In a second-price auction, the highest bidder wins but pays slightly more than the second-highest bid. This model was common in early programmatic advertising." },
  { term: "Bid Shading", def: "Bid shading is a DSP strategy used in first-price auctions to avoid overpaying for impressions. The system automatically lowers bids while keeping them competitive enough to win." },
  { term: "DMP (Data Management Platform)", def: "A DMP is a platform that collects, stores, and organizes user data from multiple sources. It is used to create audience segments for targeting and campaign optimization." },
  { term: "First-Party Data", def: "First-party data is data collected directly by a company from its own users through websites, apps, or CRM systems. It is the most reliable and privacy-compliant type of data." },
  { term: "Second-Party Data", def: "Second-party data is first-party data shared directly between trusted partners. It allows advertisers to extend reach while maintaining higher data quality." },
  { term: "Third-Party Data", def: "Third-party data is collected and sold by external data providers or brokers. Its usage is declining due to privacy regulations and browser restrictions." },
  { term: "Cookies (First-Party / Third-Party)", def: "Cookies are small data files stored in a user’s browser to track activity. First-party cookies are set by the visited site, while third-party cookies are set by external domains." },
  { term: "MAID (Mobile Advertising ID)", def: "MAID is a unique identifier assigned to mobile devices for advertising and attribution purposes. It enables tracking and targeting within mobile apps." },
  { term: "Universal ID", def: "Universal IDs are alternative identity solutions designed to replace third-party cookies. They aim to balance advertising effectiveness with user privacy." },
  { term: "Fingerprinting", def: "Fingerprinting identifies users using device and browser characteristics such as fonts, screen size, and OS. It is considered privacy-sensitive and increasingly restricted." },
  { term: "Clean Room", def: "A clean room is a secure environment where multiple parties can analyze combined datasets without sharing raw user-level data. It supports privacy-safe collaboration." },
  { term: "Contextual Targeting", def: "Contextual targeting serves ads based on the content of a webpage rather than user identity. It is privacy-friendly and effective for brand safety." },
  { term: "Behavioral Targeting", def: "Behavioral targeting delivers ads based on a user’s past online behavior, such as browsing history or purchases. It aims to show more relevant ads." },
  { term: "Demographic Targeting", def: "Demographic targeting uses user attributes like age, gender, income, or education to determine ad delivery. It is commonly used in audience segmentation." },
  { term: "Frequency Capping", def: "Frequency capping limits how many times a user sees the same ad within a set period. It prevents ad fatigue and improves user experience." },
  { term: "Budget Capping", def: "Budget capping sets a maximum spend limit for a campaign or time period. It helps advertisers control costs and avoid overspending." },
  { term: "Pacing", def: "Pacing controls how a campaign’s budget is spent over time. It ensures consistent delivery and prevents budgets from being exhausted too early." },
  { term: "Impression Tracking", def: "Impression tracking records each time an ad is served to a user. This data is used for reporting, optimization, and billing." },
  { term: "Click Tracking", def: "Click tracking measures when users click on ads. It helps advertisers evaluate engagement and campaign effectiveness." },
  { term: "Conversion Tracking", def: "Conversion tracking measures whether users complete desired actions after interacting with ads. It connects ad exposure to business outcomes." },
  { term: "Viewability", def: "Viewability measures whether an ad was actually visible to the user based on industry standards. It improves transparency and media quality." },
  { term: "Invalid Traffic (IVT)", def: "Invalid traffic includes non-human or fraudulent activity such as bots and click farms. IVT is filtered out to protect advertisers from wasted spend." },
  { term: "Verification", def: "Verification tools confirm that ads are viewable, fraud-free, and placed in brand-safe environments. They provide independent campaign validation." },
  { term: "CTR (Click-Through Rate)", def: "CTR is the ratio of clicks to impressions and indicates how engaging an ad is. Higher CTR usually suggests better creative relevance." },
  { term: "Media Buying", def: "Media buying is the process of purchasing advertising inventory across platforms and publishers. It can be done manually or programmatically." },
  { term: "Manual Optimization", def: "Manual optimization involves human decision-making to adjust bids, targeting, and creatives. It provides control but is slower and less scalable." },
  { term: "Automated Optimization", def: "Automated optimization uses algorithms and machine learning to adjust campaigns in real time. It enables faster and more efficient scaling." },
  { term: "AdOps", def: "AdOps refers to the team responsible for setting up, managing, and maintaining advertising campaigns. They handle trafficking, troubleshooting, and delivery." },
  { term: "Ad Trafficking", def: "Ad trafficking is the technical process of uploading creatives, configuring tags, and launching campaigns in ad servers. It ensures ads run correctly." },
  { term: "DCO (Dynamic Creative Optimization)", def: "DCO dynamically generates personalized ad creatives in real time based on user data and performance signals. It improves relevance and conversion rates." },
  { term: "A/B Testing", def: "A/B testing compares multiple versions of ads or landing pages to determine which performs better. It supports data-driven optimization." },
  { term: "Attribution", def: "Attribution is the process of assigning credit for a conversion to one or more advertising touchpoints. It helps advertisers understand which ads or channels contributed to results." },
  { term: "Last-Click Attribution", def: "Last-click attribution assigns full credit for a conversion to the final ad interaction before conversion. It is simple to implement but often ignores earlier influence." },
  { term: "First-Click Attribution", def: "First-click attribution gives full credit to the first ad interaction in the user journey. It is useful for understanding discovery and awareness impact." },
  { term: "Linear Attribution", def: "Linear attribution distributes conversion credit equally across all touchpoints. It provides a balanced view of the customer journey." },
  { term: "Time-Decay Attribution", def: "Time-decay attribution assigns more credit to interactions closer to the conversion event. It emphasizes recent engagement." },
  { term: "Vanity URL", def: "A vanity URL is a short, branded, and easy-to-remember URL used in campaigns. It is commonly used in offline or awareness advertising." },
  { term: "Beacons", def: "Beacons are small physical devices that use Bluetooth signals to track user presence or actions in physical locations. They help connect offline behavior with digital advertising." },
  { term: "Publisher", def: "A publisher is a website or app owner that provides ad inventory. Publishers earn revenue by displaying advertisements to their users." },
  { term: "Advertiser", def: "An advertiser is a brand or company that pays to display ads. Advertisers aim to drive awareness, traffic, or conversions." },
  { term: "Advertising Agency", def: "An advertising agency plans, creates, and manages campaigns on behalf of advertisers. Agencies often provide strategy, creative, and media buying services." },
  { term: "Agency Trading Desk (ATD)", def: "An ATD is a specialized unit within an agency that manages programmatic advertising. It combines media expertise with proprietary technology." },
  { term: "Walled Garden", def: "A walled garden is a closed advertising ecosystem where the platform controls user data, inventory, and measurement. Examples include Google and Meta." },
  { term: "IAB (Interactive Advertising Bureau)", def: "The IAB is an industry organization that sets standards for digital advertising. It defines ad formats, measurement guidelines, and best practices." },
  { term: "IAB Content Taxonomy", def: "IAB Content Taxonomy is a standardized classification system for website content. It is used for contextual targeting and brand safety." },
  { term: "RON (Run on Network)", def: "Run on Network means ads are displayed across all sites within an ad network. It provides wide reach but limited placement control." },
  { term: "ROS (Run on Site)", def: "Run on Site means ads are displayed only on selected publisher websites. It offers greater control over placement and context." },
  { term: "Dayparting", def: "Dayparting is the practice of showing ads during specific times or days. It helps align ads with user behavior patterns." },
  { term: "Geolocation Targeting", def: "Geolocation targeting delivers ads based on a user’s physical location derived from IP or device data. It is useful for local and regional campaigns." },
  { term: "Device Targeting", def: "Device targeting allows ads to be shown based on device type such as mobile, desktop, or tablet. It helps optimize creative and user experience." },
  { term: "Browser / OS Targeting", def: "Browser and OS targeting delivers ads based on the user’s browser or operating system. It is useful for compatibility-specific promotions." },
  { term: "Dimensions", def: "Dimensions are primary attributes used in reporting, such as country, device, or campaign. They help organize and analyze performance data." },
  { term: "Subdimensions", def: "Subdimensions are secondary breakdowns within a dimension, such as city within country. They provide deeper analytical insights." },
  { term: "Reporting Discrepancy", def: "Reporting discrepancy refers to differences in metrics reported by different platforms. It often occurs due to tracking methods or timing differences." },
  { term: "Brand Safety", def: "Brand safety ensures ads do not appear next to harmful or inappropriate content. It protects brand reputation." },
  { term: "Brand Suitability", def: "Brand suitability focuses on placing ads in environments appropriate to a brand’s values. It is more nuanced than strict brand safety." },
  { term: "Meta-DSP", def: "A meta-DSP is a platform that manages multiple DSPs through a single interface. It is commonly used by agencies for centralized control." },
  { term: "SDK (Software Development Kit)", def: "An SDK is a set of tools and code used to integrate advertising and tracking into mobile applications. It enables in-app ad serving." },
  { term: "Server-Side vs Client-Side", def: "Server-side processing happens on backend servers, while client-side runs in the user’s browser. Server-side is faster and more secure." },
  { term: "Data Enrichment", def: "Data enrichment enhances raw user data with additional attributes such as interests or demographics. It improves targeting accuracy." },
  { term: "Profile Merging", def: "Profile merging combines multiple data sources into a single unified user profile. It creates a more complete view of the user." },
  { term: "Lookalike Modeling", def: "Lookalike modeling is a technique used to find new users who resemble an existing high-value audience. It uses data patterns and algorithms to expand reach while maintaining relevance." },
  { term: "Audience Extension", def: "Audience extension allows advertisers to reach new users by leveraging existing audience data across additional platforms or publishers. It helps scale campaigns beyond owned channels." },
  { term: "CMP (Consent Management Platform)", def: "A CMP is a tool used to collect, manage, and store user consent for data collection and processing. It ensures compliance with privacy regulations like GDPR and CCPA." },
  { term: "Privacy Sandbox", def: "Privacy Sandbox is a privacy-focused initiative designed to replace third-party cookies. It enables interest-based advertising while reducing individual user tracking." }
];

export function KeywordsModule() {
  const [q, setQ] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>(undefined);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return TERMS;
    return TERMS.filter(
      (t) =>
        t.term.toLowerCase().includes(term) ||
        t.def.toLowerCase().includes(term)
    );
  }, [q]);

  const handleAskAI = (input: string) => {
    setChatContext(input);
    setIsChatOpen(true);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Glossary — Key Terms</h2>
      <p className="text-muted-foreground mb-4">Definitions sourced from the provided list. Terms are numbered for easy reference.</p>

      <div className="flex gap-2 mb-6">
        <input
          aria-label="Search glossary"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search terms or definitions..."
          className="flex-1 px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none text-sm"
        />
        <button
          onClick={() => handleAskAI(q || "Explain glossary terms")}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
        >
          Ask AI
        </button>
      </div>

      {results.length === 0 ? (
        <div className="p-6 border rounded-lg bg-card">
          <p className="mb-4">No results found for "{q}".</p>
          <p className="text-sm text-muted-foreground mb-4">Use the search box and press the top <strong>Ask AI</strong> button to get an explanation.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setQ("")}
              className="px-4 py-2 rounded-lg border"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((t, i) => (
            <div key={t.term} className="p-4 border rounded-lg bg-card">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">{i + 1}. {t.term}</h3>
                {/* single Ask AI button at the top handles queries; keep entries clean */}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.def}</p>
            </div>
          ))}
        </div>
      )}

      <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} context={chatContext} />
    </div>
  );
}
