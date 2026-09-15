import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { DMP_STAGES, DmpStageNav, DmpStageDetail, getDmpStage } from "./_shared";

const PIXEL_STEPS = [
  {
    title: "The pixel loads on the page",
    detail:
      "A 1×1 transparent pixel — just a piece of HTML, also called a tag or tracking pixel — sits on the page and fires when the page loads.",
  },
  {
    title: "It requests the image from the DMP",
    detail: "The pixel sends a request to the DMP asking for that tiny 1×1 image.",
  },
  {
    title: "The DMP returns the pixel and drops a cookie",
    detail: "The DMP returns the image, assigns a cookie to the browser, and begins storing data against that cookie.",
  },
  {
    title: "The data is passed to the DMP for profiling",
    detail: "Everything collected against that cookie is passed to the DMP for processing and audience profiling.",
  },
];

interface Method {
  id: string;
  label: string;
  detail: string;
}

const METHODS: Method[] = [
  {
    id: "piggyback",
    label: "Piggybacking",
    detail:
      "Piggybacking happens when a single master pixel, placed on a site's pages, triggers several more tracking pixels from other sources or networks that aren't directly embedded on the site. One tag execution ends up collecting data for multiple systems at once.",
  },
  {
    id: "tag",
    label: "Tags and tag management",
    detail:
      "Tags are pieces of JavaScript or iframe code that behave like pixels: once loaded, they send a request to the DMP, which places a cookie and collects data. Publishers often hold their tags and pixels in a container placed directly under a page's opening <body> element — a tag management system (TMS) — so tags can be added, removed or modified from one interface instead of asking a developer to edit the site's HTML.",
  },
  {
    id: "api",
    label: "API, server-to-server",
    detail:
      "An application program interface (API) exchanges data directly between web servers and the DMP, with no pixel or cookie involved. This is also called server-to-server integration, and it suits a company with a number of data silos, since it can efficiently collect from many separate databases at once.",
  },
];

function Body() {
  const [stage, setStage] = useState(1);
  const [pixelStep, setPixelStep] = useState(0);
  const [method, setMethod] = useState(METHODS[0].id);

  const currentStage = getDmpStage(stage);
  const pixelDone = pixelStep >= PIXEL_STEPS.length;
  const currentMethod = METHODS.find((m) => m.id === method) ?? METHODS[0];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Collecting data can be done a few different ways, depending on where the data is stored: a
          DMP integrates with DSPs, ad exchanges, SSPs and CRM systems, and it collects directly from a
          website or app through tags placed on the page.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">The workflow</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Collection is the first of five stages a DMP runs data through. Later lessons pick up where
          this one leaves off.
        </p>
        <DmpStageNav activeIds={DMP_STAGES.map((s) => s.id)} selected={stage} onSelect={setStage} />
        <div className="mt-4">
          <DmpStageDetail stage={currentStage} />
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it: fire the pixel</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          The simplest way for a DMP to collect first-party data. Step through what actually happens
          when a page with a tracking pixel loads.
        </p>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Step through a pixel firing"
        >
          <button
            type="button"
            onClick={() => setPixelStep((s) => Math.min(s + 1, PIXEL_STEPS.length))}
            disabled={pixelDone}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              pixelDone
                ? "border-border text-muted-foreground opacity-50"
                : "border-primary bg-primary/10 text-foreground"
            )}
          >
            Load the page
          </button>
          <button
            type="button"
            onClick={() => setPixelStep(0)}
            className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Restart
          </button>
        </div>

        <ol className="mt-4 space-y-2">
          {PIXEL_STEPS.map((step, i) => (
            <li
              key={step.title}
              className={cn("flex gap-3 text-sm", i < pixelStep ? "text-foreground" : "text-muted-foreground opacity-60")}
            >
              <span className="figure shrink-0">{i + 1}</span>
              <span>
                <span className="block text-foreground">{step.title}</span>
                {i < pixelStep && <span className="measure block text-muted-foreground">{step.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">The other collection routes</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          A single pixel is not the only way data arrives. Choose a method to read how it differs.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a collection method">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              aria-pressed={method === m.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                method === m.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">{currentMethod.label}</p>
          <p className="measure mt-1 text-muted-foreground">{currentMethod.detail}</p>
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone will ask why a single page load seems to fire ten different tracking requests, and
      piggybacking is the answer. Knowing the difference between a pixel, a tag and a server-to-server
      API call is what lets you work out why a DMP isn't seeing a source at all.
    </p>
  ),
  objectives: [
    "Explain what happens, step by step, when a tracking pixel fires",
    "Distinguish a pixel from a tag, and both from an API integration",
    "Say why a company with many data silos would choose server-to-server integration over pixels",
  ],
  Body,
  takeaways: [
    "A tracking pixel is a 1×1 transparent image: loading it sends a request to the DMP, which returns the image, drops a cookie, and starts storing data against it.",
    "Piggybacking lets one master pixel trigger several other vendors' tracking pixels from a single execution; tags do the same job as pixels but as JavaScript or iframe code, usually managed through a tag management system.",
    "Server-to-server API integration skips pixels and cookies entirely, which is why it suits a company whose data already sits in many separate silos.",
  ],
  checkYourself: [
    {
      question:
        "A page loads one master pixel, but four different vendors end up recording data from that single visit. What is this called?",
      answer: <p>Piggybacking — one master pixel automatically triggers the other vendors' pixels from a single tag execution.</p>,
    },
    {
      question: "A publisher wants to add a new tracking tag without asking a developer to edit the site's HTML. What lets them do that?",
      answer: (
        <p>
          A tag management system (TMS). It holds tags and pixels in one container, usually placed
          directly under the page's opening &lt;body&gt; element, so they can be added, removed or
          changed from a single interface.
        </p>
      ),
    },
    {
      question: "Why would a company with data spread across many internal silos prefer an API integration over a pixel on its website?",
      answer: (
        <p>
          A pixel only sees what happens on the page it sits on. An API — server-to-server
          integration — exchanges data directly between the company's own web servers and the DMP,
          which lets it pull from many separate databases at once instead of waiting for each one to
          pass through a browser.
        </p>
      ),
    },
  ],
};

export default lesson;
