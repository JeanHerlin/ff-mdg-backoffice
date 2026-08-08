import { Suspense } from "react";
import { AcceptInviteForm } from "./accept-invite-form";

export const metadata = { title: "Configurer mon compte" };

export default function InvitationPage() {
  return (
    <Suspense>
      <AcceptInviteForm />
    </Suspense>
  );
}
