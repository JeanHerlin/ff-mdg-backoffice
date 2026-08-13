import { CreateScrimForm } from "./create-scrim-form";

export const metadata = { title: "Créer un scrim" };

export default function CreateScrimPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Créer un scrim</h1>
        <p className="text-sm text-muted-foreground">
          Les horaires sont enregistrés tels que saisis dans votre fuseau horaire actuel — chaque joueur les verra
          correctement convertis dans le sien.
        </p>
      </div>
      <CreateScrimForm />
    </div>
  );
}
