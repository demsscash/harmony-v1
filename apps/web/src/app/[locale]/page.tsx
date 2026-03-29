import { redirect } from 'next/navigation';

export default function Home() {
  // Par défaut, l'application pointe vers le dashboard
  // Le AuthProvider en layout se chargera du cas d'erreur de session
  redirect('/dashboard');
}
