import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Hello World" },
      { name: "description", content: "A simple hello world project." },
    ],
  }),
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight text-foreground sm:text-8xl">
          Hello, World
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Welcome to your new project.
        </p>
      </div>
    </main>
  );
}
