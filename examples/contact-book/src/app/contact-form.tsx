import { useState } from "react";
import { useRouter, Link } from "@farbenmeer/router";
import { client } from "client";

export function ContactForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const contact = await client.contacts.post({ name, email, phone });
    router.push(`/contacts/${contact.id}`);
  }

  return (
    <div data-testid="contact-form">
      <nav>
        <Link href="/" data-testid="back-link">
          &larr; Back to list
        </Link>
      </nav>
      <h2>New Contact</h2>
      <form onSubmit={handleSubmit} data-testid="create-form">
        <label>
          Name
          <input
            data-testid="create-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            data-testid="create-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Phone
          <input
            data-testid="create-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <button type="submit" data-testid="create-submit">
          Create Contact
        </button>
      </form>
    </div>
  );
}
