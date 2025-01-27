import styles from "./page.module.css";
import { getEmails } from "@/utils/gmail";
import { unstable_noStore as noStore } from "next/cache";

export default async function Home() {
  // Opt out of static rendering
  noStore();

  const emails = await getEmails();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>My Inbox</h1>
        <p className={styles.subheader}>{emails.length} emails found</p>
      </header>

      <main className={styles.emailList}>
        {emails.map((email) => (
          <div key={email.id} className={styles.emailCard}>
            <h2 className={styles.emailSubject}>{email.subject}</h2>
            <p className={styles.emailFrom}>{email.from}</p>
            <time className={styles.emailDate}>{email.date}</time>
          </div>
        ))}
      </main>
    </div>
  );
}
