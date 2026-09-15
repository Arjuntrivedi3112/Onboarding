import { KeywordsModule } from "@/components/modules/KeywordsModule";

export default function GlossaryPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-foreground">Glossary</h1>
      <p className="measure mt-2 text-muted-foreground">
        Every term the book uses, defined in one line. Search it whenever a lesson assumes something
        you have not met yet.
      </p>
      <div className="mt-8">
        <KeywordsModule />
      </div>
    </div>
  );
}
