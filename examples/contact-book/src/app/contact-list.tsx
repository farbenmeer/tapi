import { useQuery } from "@farbenmeer/bunny/client";
import { Link } from "@farbenmeer/router";
import { client } from "client";

export function ContactList() {
  const contacts = useQuery(client.contacts.get());

  return (
    <div data-testid="contact-list">
      <nav>
        <Link href="/contacts/new" data-testid="add-contact-link">
          + New Contact
        </Link>
      </nav>
      {contacts.length === 0 ? (
        <p className="empty-state" data-testid="empty-state">
          No contacts yet. Add one!
        </p>
      ) : (
        <ul>
          {contacts.map((contact) => (
            <li key={contact.id}>
              <Link
                href={`/contacts/${contact.id}`}
                data-testid={`contact-${contact.id}`}
              >
                {contact.name} — {contact.email}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
