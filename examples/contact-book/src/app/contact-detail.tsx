import { useState } from "react";
import { useQuery } from "@farbenmeer/bunny/client";
import { useParams, useRouter, Link } from "@farbenmeer/router";
import { client } from "client";

export function ContactDetail() {
  const { id } = useParams();
  const router = useRouter();
  const contact = useQuery(client.contacts[id!]!.get());
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function startEditing() {
    setName(contact.name);
    setEmail(contact.email);
    setPhone(contact.phone);
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await client.contacts[id!]!.patch({ name, email, phone });
    setEditing(false);
  }

  async function handleDelete() {
    await client.contacts[id!]!.delete();
    router.push("/");
  }

  if (editing) {
    return (
      <div data-testid="contact-edit">
        <nav>
          <Link href="/" data-testid="back-link">
            &larr; Back to list
          </Link>
        </nav>
        <h2>Edit Contact</h2>
        <form onSubmit={handleSave} data-testid="edit-form">
          <label>
            Name
            <input
              data-testid="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              data-testid="edit-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Phone
            <input
              data-testid="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <div className="actions">
            <button type="submit" data-testid="save-button">
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              data-testid="cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div data-testid="contact-detail">
      <nav>
        <Link href="/" data-testid="back-link">
          &larr; Back to list
        </Link>
      </nav>
      <h2 data-testid="contact-name">{contact.name}</h2>
      <dl>
        <div className="detail-field">
          <dt>Email</dt>
          <dd data-testid="contact-email">{contact.email}</dd>
        </div>
        <div className="detail-field">
          <dt>Phone</dt>
          <dd data-testid="contact-phone">{contact.phone || "—"}</dd>
        </div>
      </dl>
      <div className="actions">
        <button onClick={startEditing} data-testid="edit-button">
          Edit
        </button>
        <button
          className="danger"
          onClick={handleDelete}
          data-testid="delete-button"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
